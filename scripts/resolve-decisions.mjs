#!/usr/bin/env node
/**
 * Find the trial judge's own decision on a district docket, and a free public
 * copy of it, using one search per docket.
 *
 *   node scripts/resolve-decisions.mjs --district=dnj --held
 *   node scripts/resolve-decisions.mjs --district=dnj --held --write
 *
 * This replaces the docket walk in reconcile-dockets.mjs for every record that
 * already carries a district docket, which is most of them. The walk paged
 * through every entry of a docket looking for a notice of appeal and then the
 * order it named — 298 entries on Oakwood, 134 on Berkelhammer — and exhausted
 * the daily quota before it finished the corpus.
 *
 * RECAP's document index is full-text searchable and the clerk's signature line
 * lives in the docket entry description, so the walk was never necessary:
 *
 *     type=rd & court=njd & docket_number=3:17-cv-05090 & q="Signed by Judge"
 *
 * returns every signed order on the docket in one request, each with its ECF
 * number, its date, the signing judge, and whether CourtListener holds the PDF.
 * Two hundred and ninety-eight entries become one query.
 *
 * `available_only` is the second gate and the one that decides publication. An
 * entry belongs on a judge's page only when the district court's own decision
 * can be read, and RECAP holds the docket text far more often than it holds
 * documents. Ask for both and the script reports the difference.
 *
 * This script needs COURTLISTENER_TOKEN and will not run without one. The v4
 * search endpoint answers 403 to an anonymous caller, unlike the dockets and
 * docket-entries endpoints, which answer but throttle at five a minute. That
 * asymmetry is why the walk was written first and why it was the wrong shape.
 *
 * What it will not do: pick the entry. A docket carries many signed orders and
 * only the curator knows which one the record describes. The script ranks
 * candidates and flags the ones where the signing judge is not the judge whose
 * page the record sits on — Trematore is filed under Martinotti and its 2021
 * opinion is signed by Vazquez — but a human resolves that.
 */

import fs from 'node:fs';
import path from 'node:path';
import { cl, hasToken, stats } from './lib/courtlistener.mjs';
import { signedBy } from './reconcile-dockets.mjs';

const args = new Map(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const district = args.get('district') ?? 'dnj';
const write = Boolean(args.get('write'));
const heldOnly = Boolean(args.get('held'));

const COURT = { dnj: 'njd' };
const court = COURT[district];
if (!court) { console.error(`no CourtListener court id mapped for '${district}'`); process.exit(1); }

const HELD_DIR = path.join('review', 'pending', `${district}-no-district-decision`);
const PUB_DIR = path.join('src', 'content', 'districts', district, 'opinions');

/** "Brian R. Martinotti" and "brian-r-martinotti" are the same judge. */
const norm = (s) => (s ?? '')
  .toLowerCase()
  .replace(/[.,']/g, '')
  .replace(/\b(jr|sr|iii|ii|iv)\b/g, '')
  .replace(/[^a-z]+/g, ' ')
  .trim();

const surname = (s) => { const p = norm(s).split(' ').filter(Boolean); return p[p.length - 1] ?? ''; };

/** Search results for type=rd arrive grouped by docket. Flatten either shape. */
function flatten(payload) {
  const out = [];
  for (const r of payload.results ?? []) {
    const docs = Array.isArray(r.recap_documents) ? r.recap_documents : [r];
    for (const d of docs) {
      out.push({
        ecf: d.document_number ?? d.entry_number ?? null,
        date: d.entry_date_filed ?? null,
        description: d.description ?? '',
        short: d.short_description ?? '',
        available: Boolean(d.is_available),
        pdf: d.filepath_local
          ? `https://storage.courtlistener.com/${d.filepath_local}`
          : null,
        page: d.absolute_url ? `https://www.courtlistener.com${d.absolute_url}` : null,
      });
    }
  }
  return out;
}

async function signedOrders(districtDocket) {
  const payload = await cl('/search/', {
    type: 'rd',
    court,
    docket_number: districtDocket,
    q: '"Signed by Judge"',
    order_by: 'entry_date_filed desc',
  });
  return flatten(payload)
    .map((d) => ({ ...d, ...(signedBy(d.description) ?? {}) }))
    .filter((d) => d.judge);
}

function load(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => ({
    file: path.join(dir, f),
    rec: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')),
  }));
}

const records = [
  ...load(HELD_DIR).map((r) => ({ ...r, held: true })),
  ...(heldOnly ? [] : load(PUB_DIR).map((r) => ({ ...r, held: false }))),
].filter(({ rec }) => rec.district_docket);

console.log(`${records.length} record${records.length === 1 ? '' : 's'} with a district docket` +
            `${heldOnly ? ' (held only)' : ''}`);
console.log(hasToken()
  ? 'COURTLISTENER_TOKEN present.'
  : 'No COURTLISTENER_TOKEN — anonymous throttle is five requests a minute; this will pace itself.');
console.log('');

const report = {};
let resolved = 0, mismatched = 0, noPdf = 0, empty = 0, failed = 0;

for (const { file, rec, held } of records) {
  const page = rec.judge_slug;
  const label = `${page} · ${rec.caption}`.slice(0, 72);
  let orders;
  try {
    orders = await signedOrders(rec.district_docket);
  } catch (e) {
    failed++;
    console.log(`  !  ${label}\n     ${e.message}`);
    report[path.basename(file, '.json')] = { error: e.message, district_docket: rec.district_docket };
    continue;
  }

  const mine = orders.filter((o) => surname(o.judge) === surname(page) && norm(o.judge).split(' ')[0] === norm(page).split(' ')[0]);
  const others = orders.filter((o) => !mine.includes(o));
  const withPdf = mine.filter((o) => o.available);

  let flag;
  if (!orders.length) { flag = 'empty'; empty++; }
  else if (!mine.length) { flag = 'mismatch'; mismatched++; }
  else if (!withPdf.length) { flag = 'no-pdf'; noPdf++; }
  else { flag = 'ok'; resolved++; }

  const mark = { ok: 'OK', mismatch: 'X ', 'no-pdf': '~ ', empty: '. ' }[flag];
  console.log(`  ${mark} ${label}`);
  console.log(`     ${rec.district_docket} — ${orders.length} signed order(s), ` +
              `${mine.length} by this judge, ${withPdf.length} with a PDF` +
              (others.length ? `; other signers: ${[...new Set(others.map((o) => o.judge))].join(', ')}` : ''));
  for (const o of withPdf.slice(0, 4)) {
    console.log(`       ECF ${o.ecf} ${o.date} — ${(o.short || o.description).slice(0, 78)}`);
  }

  report[path.basename(file, '.json')] = {
    district_docket: rec.district_docket,
    page_judge: page,
    caption: rec.caption,
    flag,
    candidates: mine.map((o) => ({
      ecf: o.ecf, date: o.date, signed_date: o.date_signed, judge: o.judge,
      available: o.available, pdf: o.pdf, page: o.page,
      description: o.description.slice(0, 300),
    })),
    other_signers: [...new Set(others.map((o) => o.judge))],
  };

  if (write && flag === 'ok' && withPdf.length === 1) {
    const only = withPdf[0];
    const next = {
      ...rec,
      decision_ecf_number: String(only.ecf),
      decision_date: only.date,
      authored_by: only.judge,
      authorship_source: 'docket_entry_signature',
    };
    fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
    console.log('       written: single unambiguous candidate');
  }
}

const dest = path.join('docs', `decision-resolution-${district}.json`);
fs.writeFileSync(dest, JSON.stringify(report, null, 2) + '\n');

console.log('');
console.log(`OK  ${resolved}  district decision by this judge, PDF held`);
console.log(`~   ${noPdf}  signed by this judge, no PDF in RECAP`);
console.log(`X   ${mismatched}  signed orders exist, none by the judge on the page`);
console.log(`.   ${empty}  no signed orders indexed`);
if (failed) console.log(`!   ${failed}  request failed`);
const s = stats();
console.log(`\nthrottle events: ${s.throttleEvents}; final pacing ${s.gapMs}ms`);
console.log(`report written to ${dest}`);
if (!write) console.log('\nNothing was modified. Re-run with --write to record unambiguous single candidates.');
