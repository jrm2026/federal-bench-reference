#!/usr/bin/env node
/**
 * Reconcile appellate dockets to district dockets, then find the trial judge's
 * opinion on the district docket.
 *
 *   node scripts/reconcile-dockets.mjs --district=dnj
 *   node scripts/reconcile-dockets.mjs --district=dnj --held --write
 *
 * The significance screen keyed on the existence of an appeal, so a Third
 * Circuit docket number was recorded where the district court's belongs. The
 * two identify different proceedings. The entry that belongs on a judge's page
 * is the trial judge's opinion on the district docket, which is the decision the
 * appeal was taken from.
 *
 * Three resolution paths, cheapest first:
 *
 *   1. The record already carries a district docket. Try the GovInfo package,
 *      whose ID is deterministic from the docket, then RECAP.
 *   2. The record carries an appellate docket. Ask CourtListener for the
 *      appellate docket's originating-court information, which gives the
 *      district docket number and the trial judge's name. This is populated
 *      only for dockets bought from PACER, so it often returns nothing.
 *   3. Nothing structured is available. Read the appellate opinion's text and
 *      take the district docket off the cover page, which states it as
 *      "(D.C. Civil Action No. 2-11-cv-01754), District Judge: Honorable ___".
 *
 * Then walk the district docket to find the decision and its author. The docket
 * text carries both, and it is the better evidence:
 *
 *   a. Find the notice of appeal. Its description names the order appealed from
 *      — "NOTICE OF APPEAL as to 133 Order" — and a later entry ties the appeal
 *      to its circuit number: "USCA Case Number 22-1618 for 135 Notice of Appeal".
 *   b. Fetch that entry. Its description ends "Signed by Judge Esther Salas on
 *      3/31/2022", which is who decided, the date, and the ECF number in one line.
 *
 * Never take the author from the docket's assigned_to. That is who holds the case
 * now. Berkelhammer's docket shows Padin where Salas decided; Huertas shows
 * Chesler where Wigenton decided; and the Berkelhammer docket records its own
 * reassignment mid-case ("Magistrate Judge Michael A. Hammer no longer assigned").
 *
 * Writes a worksheet by default and changes nothing. --write fills
 * district_docket where a path resolved it, and never sets a link or a
 * link_level: what document is the decision appealed from is a reading, not a
 * lookup, and a human makes it.
 *
 * Needs COURTLISTENER_TOKEN. Without one the API throttles at five requests a
 * minute, which is not enough to walk a corpus.
 *
 * Node does not read .env on its own. Use `npm run reconcile -- --district=dnj --held`
 * or pass the flag yourself: `node --env-file=.env scripts/...`. Without it the
 * token in .env is invisible and the run silently falls back to the throttle.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const CL = 'https://www.courtlistener.com/api/rest/v4';
const TOKEN = process.env.COURTLISTENER_TOKEN;

const arg = (name, fallback = null) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const DISTRICT = arg('district', 'dnj');
const HELD = process.argv.includes('--held');
const WRITE = process.argv.includes('--write');
const COURT = { dnj: 'njd' }[DISTRICT] ?? DISTRICT;

const DIR = HELD
  ? join(ROOT, 'review', 'pending', 'dnj-no-district-decision')
  : join(ROOT, 'src', 'content', 'districts', DISTRICT, 'opinions');

// CourtListener throttles unauthenticated callers at five requests a minute. A
// token lifts that, but not to unlimited: a quarter-second gap collects 429s
// within seconds. Pace conservatively and back off when the server says to,
// rather than treating a throttle as a failure.
let gapMs = TOKEN ? 1200 : 13000;
let last = 0;
let throttleEvents = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(url) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const wait = gapMs - (Date.now() - last);
    if (wait > 0) await sleep(wait);
    last = Date.now();
    const res = await fetch(url, { headers: TOKEN ? { Authorization: `Token ${TOKEN}` } : {} });

    if (res.status === 429) {
      throttleEvents++;
      // Honour Retry-After where the server sends one; otherwise back off, and
      // widen the standing gap so the rest of the run stops provoking it.
      const retryAfter = Number(res.headers.get('retry-after'));
      const backoff = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(60000, 2000 * 2 ** attempt);
      // Tens of minutes is a quota reset, not a burst limit. Sitting on it helps
      // nobody: --write has persisted the work, so stop and resume after.
      if (backoff > 300000) {
        throw new Error(`quota exhausted — CourtListener asks for ${Math.round(backoff / 60000)} minutes. ` +
                        `Work so far is written; re-run later and it resumes.`);
      }
      gapMs = Math.min(15000, Math.round(gapMs * 1.5));
      process.stderr.write(`      throttled; waiting ${Math.round(backoff / 1000)}s, pacing now ${gapMs}ms\n`);
      await sleep(backoff);
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${new URL(url).pathname}`);
    return res.json();
  }
  throw new Error(TOKEN
    ? 'still throttled after six retries — CourtListener is rate-limiting this token'
    : 'throttled and no COURTLISTENER_TOKEN is set');
}

async function cl(path, params = {}) {
  const url = new URL(CL + path);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
  return request(url);
}

/** Follow an absolute `next` cursor URL under the same pacing and auth. */
const clNext = (url) => request(new URL(url));

/** The CourtListener docket id for a district docket number. */
async function docketIdFor(districtDocket) {
  const d = await cl('/dockets/', { court: COURT, docket_number: districtDocket, fields: 'id,case_name' });
  return d.results?.[0]?.id ?? null;
}

/**
 * Entries newest first, one page at a time, stopping as soon as `done` is happy.
 *
 * Reading a whole docket to find one entry is what exhausted the quota: a
 * 900-entry docket is nine calls, and most of them are scheduling orders. A
 * notice of appeal is near the end of a case by definition, so newest-first
 * usually finds it on page one.
 */
async function entriesUntil(docketId, done, maxPages = 6) {
  const rows = [];
  let page = await cl('/docket-entries/', {
    docket: docketId, order_by: '-date_filed',
    fields: 'entry_number,date_filed,description', page_size: 100,
  });
  rows.push(...(page.results ?? []));
  for (let i = 1; i < maxPages && page.next && !done(rows); i++) {
    page = await clNext(page.next);
    rows.push(...(page.results ?? []));
  }
  return rows;
}

/** One entry by its number, without pulling the docket around it. */
async function entryByNumber(docketId, entryNumber) {
  const r = await cl('/docket-entries/', {
    docket: docketId, entry_number: entryNumber,
    fields: 'entry_number,date_filed,description',
  });
  return r.results?.[0] ?? null;
}

/** GovInfo package IDs are deterministic from a district docket. */
export function govinfoPackage(docket) {
  const m = /^(\d):(\d{2}-(?:cv|cr|mc|md)-\d{3,6})$/.exec(docket ?? '');
  return m ? `USCOURTS-${COURT}-${m[1]}_${m[2]}` : null;
}

/** The district docket and trial judge as the appellate cover page states them. */
export function districtFromOpinionText(text) {
  if (!text) return {};
  const dk = /D\.?\s*C\.?\s*(?:Civil|Criminal)?\s*(?:Action\s*)?Nos?\.?\s*([\d]-[\d]{2}-(?:cv|cr|mc|md)-[\d]{3,6})/i.exec(text)
         || /\(D\.?\s*C\.?\s*(?:No\.?)?\s*([\d]-[\d]{2}-(?:cv|cr|mc|md)-[\d]{3,6})\)/i.exec(text);
  const jd = /District\s+Judge:\s*(?:the\s+)?Honorable\s+([A-Z][A-Za-z.''\- ]+)/i.exec(text);
  return {
    district_docket: dk ? dk[1].replace('-', ':') : null,
    district_judge: jd ? jd[1].trim().replace(/\s+/g, ' ') : null,
  };
}

/** "Signed by Judge Esther Salas on 3/31/2022" -> the author and the date. */
export function signedBy(description) {
  const m = /Signed by\s+(?:the\s+)?(?:Honorable\s+)?(?:Chief\s+)?(?:U\.?S\.?\s+)?(?:District\s+|Magistrate\s+|Senior\s+)*Judge\s+([A-Z][A-Za-z.''\- ]+?)\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/.exec(description ?? '');
  if (!m) return null;
  const [mm, dd, yy] = m[2].split('/');
  const year = yy.length === 2 ? `20${yy}` : yy;
  return { judge: m[1].trim().replace(/\s+/g, ' '),
           date: `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}` };
}

/**
 * "NOTICE OF APPEAL as to 133 Order" -> the entry number appealed from.
 *
 * Clerks write these several ways, and a regex anchored on one of them reports
 * "no notice of appeal" on a docket that plainly has one. Seen in D.N.J.:
 *   NOTICE OF APPEAL as to 133 Order
 *   NOTICE OF APPEAL by PLAINTIFF as to 45 Judgment
 *   AMENDED NOTICE OF APPEAL as to 210 Opinion
 *   NOTICE OF APPEAL to the Third Circuit re 88 Order
 */
export function appealedFrom(description) {
  const d = description ?? '';
  if (!/NOTICE OF APPEAL/i.test(d)) return null;
  const m = /NOTICE OF APPEAL\b[^.]{0,80}?\b(?:as to|re:?|from)\s+(?:ECF\s*(?:No\.?)?\s*)?#?\s*(\d+)/i.exec(d);
  return m ? m[1] : null;
}

/** Is this entry a notice of appeal at all, even if it names no document? */
export function isNoticeOfAppeal(description) {
  return /NOTICE OF APPEAL/i.test(description ?? '');
}

/** "USCA Case Number 22-1618 for 135 Notice of Appeal" -> {circuit, noaEntry}. */
export function uscaLink(description) {
  const m = /USCA Case Number\s+([\d-]+)\s+for\s+(\d+)\s+Notice of Appeal/i.exec(description ?? '');
  return m ? { circuit: m[1], noaEntry: m[2] } : null;
}

/**
 * Walk a district docket for the decision the appeal was taken from and the
 * judge who signed it.
 *
 * Cross-appeals mean a docket can carry several notices of appeal. Where the
 * record knows its circuit number, the "USCA Case Number ... for ... Notice of
 * Appeal" entry ties one notice to that appeal, and that is the one to follow.
 * Otherwise take the first notice on the docket.
 *
 * Returns { ecf, date, judge, description, via } or null.
 */
export async function decisionFromDocket(docketId, appellateDocket = null) {
  const rows = await entriesUntil(docketId, (r) => r.some((x) => isNoticeOfAppeal(x.description)));

  let noaEntry = null, via = 'first notice of appeal found';
  if (appellateDocket) {
    const tie = rows.map((r) => uscaLink(r.description))
                    .find((u) => u && u.circuit === appellateDocket);
    if (tie) { noaEntry = tie.noaEntry; via = `USCA ${tie.circuit} tied to entry ${tie.noaEntry}`; }
  }
  let target = null;
  if (noaEntry) {
    const noa = rows.find((r) => String(r.entry_number) === String(noaEntry))
             ?? await entryByNumber(docketId, noaEntry);
    target = noa ? appealedFrom(noa.description) : null;
  }
  if (!target) {
    const noa = rows.find((r) => appealedFrom(r.description));
    target = noa ? appealedFrom(noa.description) : null;
  }
  if (!target) {
    const any = rows.some((r) => isNoticeOfAppeal(r.description));
    return { ecf: null, date: null, judge: null, via: null,
             note: any ? `notice of appeal names no document (${rows.length} entries read)`
                       : `no notice of appeal in the ${rows.length} most recent entries` };
  }

  const order = rows.find((r) => String(r.entry_number) === String(target))
             ?? await entryByNumber(docketId, target);
  if (!order) return { ecf: target, date: null, judge: null, via, note: `entry ${target} not retrievable` };

  const sig = signedBy(order.description);
  return { ecf: String(target), date: sig?.date ?? order.date_filed, judge: sig?.judge ?? null,
           description: order.description, via,
           note: sig ? null : 'entry carries no "Signed by" line' };
}

/** Path 2: originating-court information hung off the appellate docket. */
async function viaOriginatingCourt(appellateDocket) {
  const d = await cl('/dockets/', { court: 'ca3', docket_number: appellateDocket, fields: 'id,original_court_info' });
  const hit = d.results?.find((r) => r.original_court_info);
  if (!hit) return null;
  const id = String(hit.original_court_info).match(/(\d+)\/?$/)?.[1];
  if (!id) return null;
  const oci = await cl(`/originating-court-information/${id}/`, { fields: 'docket_number,assigned_to_str,date_judgment' });
  return { district_docket: oci.docket_number ?? null, district_judge: oci.assigned_to_str || null,
           date_judgment: oci.date_judgment ?? null, path: 'originating-court-information' };
}

/** Path 3: the appellate opinion's own text. */
async function viaOpinionText(appellateDocket, reporterCite) {
  const q = appellateDocket
    ? { court: 'ca3', docket_number: appellateDocket, fields: 'cluster_id' }
    : { citation: reporterCite, fields: 'cluster_id' };
  const s = await cl('/search/', { type: 'o', ...q });
  const cluster = s.results?.[0]?.cluster_id;
  if (!cluster) return null;
  const ops = await cl('/opinions/', { cluster: cluster, fields: 'plain_text,html_with_citations' });
  const text = ops.results?.[0]?.plain_text || ops.results?.[0]?.html_with_citations || '';
  const found = districtFromOpinionText(text.slice(0, 6000));
  return found.district_docket ? { ...found, path: 'appellate opinion cover page' } : null;
}

// Only walk the corpus when invoked directly. The pure helpers above are
// importable for testing without firing a hundred API calls.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (!isMain) { /* imported as a module */ } else {

const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
const rows = [];

for (const f of files) {
  const path = join(DIR, f);
  const o = JSON.parse(readFileSync(path, 'utf8'));
  const row = { id: o.id, judge: o.judge_name, caption: o.caption,
                district_docket: o.district_docket, appellate_docket: o.appellate_docket,
                resolved_by: null, district_judge: null, govinfo: null, note: null };

  if (!o.district_docket) {
    try {
      const got = (o.appellate_docket && await viaOriginatingCourt(o.appellate_docket))
               || (await viaOpinionText(o.appellate_docket, o.reporter_cite));
      if (got?.district_docket) {
        row.district_docket = got.district_docket;
        row.district_judge = got.district_judge;
        row.resolved_by = got.path;
        if (WRITE) {
          o.district_docket = got.district_docket;
          writeFileSync(path, JSON.stringify(o, null, 2) + '\n');
        }
      } else {
        row.note = 'no district docket found — read the appellate opinion by hand';
      }
    } catch (e) {
      row.note = `lookup failed: ${e.message}`;
    }
  }

  if (row.district_docket) {
    const pkg = govinfoPackage(row.district_docket);
    row.govinfo = pkg ? `https://www.govinfo.gov/app/details/${pkg}` : null;

    // The docket names the decision and who signed it. This is the point of the
    // exercise: a docket number says where to look, not what was decided or by
    // whom. Skip a record that already carries a signature-line attribution.
    if (o.authorship_source !== 'docket_entry_signature') {
      try {
        const id = await docketIdFor(row.district_docket);
        if (!id) { row.note = 'docket not in RECAP'; }
        else {
          const d = await decisionFromDocket(id, row.appellate_docket);
          row.ecf = d?.ecf ?? null;
          row.decision_date = d?.date ?? null;
          row.signed_by = d?.judge ?? null;
          row.via = d?.via ?? null;
          if (d?.note) row.note = d.note;

          // A signature naming someone other than the judge on the page is the
          // finding, not a value to store. Leave the record alone and report it.
          const mismatch = d?.judge && !d.judge.split(/\s+/).some(
            (w) => w.length > 3 && o.judge_name.includes(w));

          if (WRITE && d?.ecf && !mismatch) {
            o.decision_ecf_number = d.ecf;
            o.decision_date = d.date ?? o.decision_date;
            if (d.judge) { o.authored_by = d.judge; o.authorship_source = 'docket_entry_signature'; }
            writeFileSync(path, JSON.stringify(o, null, 2) + '\n');
          }
        }
      } catch (e) {
        row.note = `docket walk failed: ${e.message}`;
      }
    } else {
      row.ecf = o.decision_ecf_number; row.signed_by = o.authored_by; row.via = 'already recorded';
    }
  }

  // Who signed is the check the gate cannot make for itself. A mismatch means
  // the entry is on the wrong judge's page, so say so loudly rather than write it.
  const named = row.signed_by ?? row.district_judge;
  if (named && !named.split(/\s+/).some((w) => w.length > 3 && o.judge_name.includes(w)))
    row.note = `SIGNED BY ${named} — record says ${o.judge_name}. Do not restore until reconciled.`;

  rows.push(row);
  const mark = row.note?.startsWith('SIGNED BY') ? 'X'
             : row.signed_by ? '+' : row.district_docket ? ' ' : '!';
  console.log(`  ${mark} ${(row.district_docket ?? '—').padEnd(16)} ` +
              `${(row.ecf ? 'ECF ' + row.ecf : '').padEnd(9)} ` +
              `${(row.signed_by ?? '').padEnd(22)} ${row.caption.slice(0, 40)}`);
  if (row.note) console.log(`      ${row.note}`);
}

const out = join(ROOT, 'docket-reconciliation.json');
writeFileSync(out, JSON.stringify({ district: DISTRICT, held: HELD, generated: new Date().toISOString(), rows }, null, 2) + '\n');

const known = rows.filter((r) => r.district_docket).length;
const signed = rows.filter((r) => r.signed_by).length;
const mismatched = rows.filter((r) => r.note?.startsWith('SIGNED BY')).length;
console.log(`\n${rows.length} records · ${known} with a district docket · ` +
            `${signed} with a signing judge from the docket · ${mismatched} attributed to the wrong judge`);
console.log(`worksheet: docket-reconciliation.json${WRITE ? '' : '  (dry run — pass --write to fill district_docket)'}`);
if (throttleEvents) console.log(`${throttleEvents} throttle event(s); final pacing ${gapMs}ms between calls.`);
if (!TOKEN) console.log('COURTLISTENER_TOKEN is unset; this ran at 5 requests/minute.');
console.log(WRITE
  ? 'Records written. Re-run to continue: those already attributed are skipped.'
  : 'Dry run. Re-run with --write so progress persists and a throttled run can resume.');
}
