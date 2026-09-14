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

// CourtListener allows 5 requests a minute unauthenticated. Pace accordingly
// rather than collecting 429s.
const GAP_MS = TOKEN ? 250 : 13000;
let last = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cl(path, params = {}) {
  const wait = GAP_MS - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  last = Date.now();
  const url = new URL(CL + path);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: TOKEN ? { Authorization: `Token ${TOKEN}` } : {},
  });
  if (res.status === 429) throw new Error('throttled — set COURTLISTENER_TOKEN');
  if (!res.ok) throw new Error(`${res.status} ${url.pathname}`);
  return res.json();
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

/** "NOTICE OF APPEAL as to 133 Order" -> the entry number appealed from. */
export function appealedFrom(description) {
  const m = /NOTICE OF APPEAL\s+as to\s+(\d+)/i.exec(description ?? '');
  return m ? m[1] : null;
}

/**
 * Walk a district docket for the decision the appeal was taken from, and the
 * judge who signed it. Returns { ecf, date, judge } or null.
 */
export async function decisionFromDocket(docketId) {
  const entries = await cl('/docket-entries/', {
    docket: docketId, order_by: 'date_filed', fields: 'entry_number,date_filed,description',
  });
  const rows = entries.results ?? [];
  const noa = rows.find((r) => appealedFrom(r.description));
  if (!noa) return null;
  const target = appealedFrom(noa.description);
  const order = rows.find((r) => String(r.entry_number) === target);
  if (!order) return { ecf: target, date: null, judge: null, note: 'order entry not on this page' };
  const sig = signedBy(order.description);
  return { ecf: target, date: sig?.date ?? order.date_filed, judge: sig?.judge ?? null,
           description: order.description };
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
  }

  // Whether the judge on the located decision is the judge on the page is the
  // check the gate cannot make. Flag it rather than assume it.
  if (row.district_judge && !row.district_judge.split(/\s+/).some((w) =>
        w.length > 3 && o.judge_name.includes(w)))
    row.note = `cover page names ${row.district_judge}; record says ${o.judge_name} — RECONCILE`;

  rows.push(row);
  const mark = row.resolved_by ? '+' : row.district_docket ? ' ' : '!';
  console.log(`  ${mark} ${(row.district_docket ?? '—').padEnd(16)} ${row.caption.slice(0, 48)}`);
  if (row.note) console.log(`      ${row.note}`);
}

const out = join(ROOT, 'docket-reconciliation.json');
writeFileSync(out, JSON.stringify({ district: DISTRICT, held: HELD, generated: new Date().toISOString(), rows }, null, 2) + '\n');

const resolved = rows.filter((r) => r.resolved_by).length;
const known = rows.filter((r) => r.district_docket).length;
console.log(`\n${rows.length} records · ${known} with a district docket · ${resolved} resolved this run`);
console.log(`worksheet: docket-reconciliation.json${WRITE ? '' : '  (dry run — pass --write to fill district_docket)'}`);
if (!TOKEN) console.log('COURTLISTENER_TOKEN is unset; this ran at 5 requests/minute.');
}
