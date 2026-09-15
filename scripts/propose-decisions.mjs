#!/usr/bin/env node
/**
 * Pick the district opinion for each held record, from the resolution report.
 *
 *   node scripts/propose-decisions.mjs --district=dnj
 *   node scripts/propose-decisions.mjs --district=dnj --write
 *
 * Offline. It reads docs/decision-resolution-<district>.json, which
 * resolve-decisions.mjs bought from the API, and costs no further quota.
 *
 * The rule it encodes, which took a lawyer to state:
 *
 *   Under the federal rules you appeal from the order, not the opinion. So a
 *   record whose provenance is an appellate reference has been traced to the
 *   ORDER — and the order is a paragraph disposing of a motion, not the
 *   document that shows what the judge decided. In re Horizon was recorded as
 *   ECF 50, an order dismissing with prejudice and the thing the notice of
 *   appeal runs from. The reasoning is in ECF 47.
 *
 * The two are filed together: 37 same-day opinion/order pairs across the 33
 * resolved D.N.J. dockets, usually on adjacent ECF numbers. ADP v. Mork is
 * 43 opinion and 44 order; Horizon is 47 and 48.
 *
 * And the PDF is nearly always on the opinion rather than the order, which is
 * the happy accident this whole approach rests on: the document the appeal
 * points at is the one nobody can read, and the one carrying the reasoning is
 * the one RECAP holds.
 *
 * So: rank by what the clerk called the document, require a retrievable PDF,
 * and propose only where exactly one candidate survives. Where several do, say
 * so and stop. Picking among three opinions on one docket needs somebody who
 * knows which ruling the entry describes.
 */

import fs from 'node:fs';
import path from 'node:path';

const args = new Map(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const district = args.get('district') ?? 'dnj';
const write = Boolean(args.get('write'));

const HELD_DIR = path.join('review', 'pending', `${district}-no-district-decision`);
const REPORT = path.join('docs', `decision-resolution-${district}.json`);
const PICKS = path.join('review', `${district}-curator-picks.json`);

if (!fs.existsSync(REPORT)) {
  console.error(`no ${REPORT}. Run resolve-decisions first.`);
  process.exit(1);
}
const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));

// Where a docket carries several reasoned opinions, the docket text cannot say
// which one an entry describes — only somebody who knows the case can. Those
// decisions live in a file rather than in a command history, with the reason
// beside each, so the next person can see why ECF 47 and not ECF 157.
const picks = fs.existsSync(PICKS) ? (JSON.parse(fs.readFileSync(PICKS, 'utf8')).picks ?? {}) : {};

/**
 * What the clerk called it. The docket text is the authority: a document
 * headed OPINION is the reasoned decision whatever else sits beside it.
 */
function documentRank(description) {
  const s = (description ?? '').toUpperCase();
  // Administrative. These schedule, stay, consent, appoint or implement; none
  // of them decides anything, and a mandate-implementing order is the circuit's
  // decision being carried out, not the district court's.
  if (/SCHEDULING ORDER|CONSENT ORDER|STIPULATION|LETTER ORDER|TEXT ORDER|ORDER STAYING|ORDER APPOINTING|ORDER OF VOLUNTARY|ORDER IMPLEMENTING MANDATE|ORDER REOPENING|AMENDING CAPTION|SUR-REPLY|EXTENDING/.test(s))
    return 0;
  if (/MEMORANDUM OPINION|OPINION AND ORDER|MEMORANDUM AND ORDER|\bOPINION\b/.test(s)) return 3;
  if (/\bMEMORANDUM\b/.test(s)) return 2;
  return 1; // a substantive order: it disposes of something but does not explain
}

const rows = [];
for (const [key, entry] of Object.entries(report)) {
  const file = path.join(HELD_DIR, `${key}.json`);
  if (!fs.existsSync(file)) continue;            // moved out of scope, or published
  if (entry.flag !== 'ok') { rows.push({ key, file, entry, verdict: entry.flag }); continue; }

  const scored = (entry.candidates ?? [])
    .map((c) => ({ ...c, rank: documentRank(c.description) }))
    .filter((c) => c.available);

  const reasoned = scored.filter((c) => c.rank >= 2);
  const substantive = scored.filter((c) => c.rank === 1);

  let verdict, pick = null;
  const curated = picks[key] && scored.find((c) => String(c.ecf) === String(picks[key].ecf));
  if (curated) { verdict = 'propose'; pick = { ...curated, curated: picks[key].rationale }; }
  else if (reasoned.length === 1) { verdict = 'propose'; pick = reasoned[0]; }
  else if (reasoned.length > 1) verdict = 'ambiguous';
  else if (substantive.length) verdict = 'orders-only';
  else verdict = 'no-pdf';

  rows.push({ key, file, entry, verdict, pick, reasoned, substantive });
}

const group = (v) => rows.filter((r) => r.verdict === v);
const proposed = group('propose');

console.log(`${rows.length} held records carry a resolution\n`);

for (const r of proposed) {
  console.log(`  OK  ${r.key.slice(0, 66)}`);
  console.log(`      ECF ${r.pick.ecf} signed ${r.pick.date_signed} — ${(r.pick.description ?? '').replace(/\s+/g, ' ').slice(0, 70)}`);
  if (r.pick.curated) console.log(`      curator: ${r.pick.curated.slice(0, 110)}`);
}

for (const [label, note] of [
  ['ambiguous', 'several reasoned opinions with a PDF — which ruling does the entry describe?'],
  ['orders-only', 'a PDF exists but no reasoned opinion; the order disposes without explaining'],
  ['no-pdf', 'this judge signed, but nothing retrievable'],
]) {
  const g = group(label);
  if (!g.length) continue;
  console.log(`\n  ${g.length} ${label} — ${note}`);
  for (const r of g) {
    console.log(`     ${r.key.slice(0, 66)}`);
    for (const c of (r.reasoned?.length ? r.reasoned : r.substantive ?? []).slice(0, 8))
      console.log(`       ECF ${String(c.ecf).padStart(4)}  ${c.date_signed}  ${(c.description ?? '').replace(/\s+/g, ' ').slice(0, 64)}`);
  }
}

if (write) {
  for (const r of proposed) {
    const rec = JSON.parse(fs.readFileSync(r.file, 'utf8'));
    const appellate = (rec.links ?? []).filter((l) => !/courtlistener/.test(l.url));
    const next = {
      ...rec,
      decision_ecf_number: String(r.pick.ecf),
      decision_date: r.pick.date_signed,
      authored_by: r.pick.judge,
      authorship_source: 'docket_entry_signature',
      link_level: 'district',
      ...(r.pick.curated ? { decision_selection_note: r.pick.curated } : {}),
      // The docket-entry page, matching the convention already in src/content,
      // with the PDF beside it. The page survives a RECAP reprocessing that
      // could move the storage path.
      public_url: r.pick.page ?? r.pick.pdf,
      links: [
        { anchor: `District opinion, ECF ${r.pick.ecf} (CourtListener)`, url: r.pick.page ?? r.pick.pdf },
        ...(r.pick.pdf ? [{ anchor: 'District opinion PDF (RECAP)', url: r.pick.pdf }] : []),
        ...appellate,
      ],
    };
    fs.writeFileSync(r.file, JSON.stringify(next, null, 2) + '\n');
  }
  console.log(`\n${proposed.length} records completed to district level in ${HELD_DIR}.`);
  console.log('They are still held. Promotion to src/content is a human step.');
} else {
  console.log(`\n${proposed.length} would be completed. Nothing was modified; --write applies them.`);
}
