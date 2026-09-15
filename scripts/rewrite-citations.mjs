#!/usr/bin/env node
/**
 * Put the district court's decision at the front of every citation line.
 *
 *   node scripts/rewrite-citations.mjs --district=dnj
 *   node scripts/rewrite-citations.mjs --district=dnj --write
 *
 * Every held entry was found because somebody appealed it, so every citation
 * line was written from the appeal. Sheridan's page read "Oakwood Laboratories
 * LLC v. Thanoo, 999 F.3d 892 (3d Cir. 2021)" above a link to Sheridan's own
 * opinion. The data underneath is right and the line still credits the Third
 * Circuit for a district judge's work, which is what constraint 5 forbids.
 *
 * So: the district decision leads, then the signal, then the appeal.
 *
 *   Oakwood Laboratories LLC v. Thanoo, No. 3:17-cv-05090, ECF No. 83
 *   (D.N.J. Oct. 23, 2019), vacated, 999 F.3d 892 (3d Cir. 2021)
 *
 * Where the district decision is published, the reporter citation leads and the
 * ECF number is redundant: In re Horizon is 106 F. Supp. 3d 507, not a docket
 * entry. Where it is not, the docket, the ECF number and the date identify it,
 * which is also exactly what a reader needs to pull it from PACER.
 *
 * The appellate half is lifted from the existing line rather than rebuilt,
 * because the line already holds citations nobody should retype — and a
 * rebuild would quietly drop what it failed to parse. Anything this script
 * cannot take apart it reports and leaves alone.
 *
 * The signal is read from the posture note and is the part to check. "Partially
 * reversed" could be rev'd in part or aff'd in part and rev'd in part, and the
 * two say different things about what survived.
 */

import fs from 'node:fs';
import path from 'node:path';

const args = new Map(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const district = args.get('district') ?? 'dnj';
const write = Boolean(args.get('write'));
const OPS = path.join('src', 'content', 'districts', district, 'opinions');

// Bluebook T12. May, June and July are not abbreviated.
const MONTH = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July',
               'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
const longDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!m) return null;
  return `${MONTH[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
};

/** A district reporter citation, if the decision was published. */
const districtReporter = (line) =>
  (/\b\d+\s+F\.\s*Supp\.(?:\s*\d(?:d|th))?\s+\d+\s*\(D\.N\.J\.[^)]*\)/.exec(line ?? '') ?? [null])[0];

/**
 * What the appeal did, in the form a citation takes. Order matters: a note
 * saying the circuit affirmed in part and reversed in part contains the word
 * "affirmed", so the compound cases have to be tested first.
 */
function signal(note) {
  const s = (note ?? '').toLowerCase();
  if (!s) return null;
  const aff = /\baffirm/.test(s);
  const rev = /\brevers|\brevived\b/.test(s);
  const vac = /\bvacat/.test(s);
  // "Partially reversed" says only that part was reversed. It does not assert
  // that the rest was affirmed, so it takes rev'd in part rather than the
  // compound — Huertas says exactly that and nothing more.
  const part = /\bin part\b|\bpartially\b|\bmost\b/.test(s);

  if (aff && vac) return part ? 'aff\u2019d in part, vacated in part' : 'vacated';
  if (aff && rev) return 'aff\u2019d in part, rev\u2019d in part';
  if (vac) return 'vacated';
  if (rev) return part ? 'rev\u2019d in part' : 'rev\u2019d';
  if (aff) return 'aff\u2019d';
  if (/\bremanded\b/.test(s)) return 'remanded';
  if (/\bdismissed\b/.test(s)) return 'appeal dismissed';
  return null;
}

/** A second court changing the result is a sequence, not a partial. */
const higherCourt = (note) => /supreme court|cert\.|certiorari|en banc/i.test(note ?? '');

/**
 * The appellate half of the existing line: a reporter citation, or a docket
 * number and a date. Taken whole, never rebuilt.
 */
function appellateTail(line, caption) {
  const reporter = /\b\d+\s+F\.\s*(?:2d|3d|4th|App'?x)\s+\d+\s*\((?:\d?d\s+Cir\.|Fed\.\s*Cir\.)[^)]*\)/.exec(line ?? '');
  const docketed = /Nos?\.\s*\d{2,4}-\d{3,5}(?:\s*(?:,|&|and)\s*(?:Nos?\.\s*)?\d{2,4}-\d{3,5})*\s*\((?:\d?d\s+Cir\.|Fed\.\s*Cir\.)[^)]*\)/.exec(line ?? '');
  const m = reporter ?? docketed;
  if (!m) return null;

  // What sits between the citation and the clause before it. Usually a bare
  // signal, which this script supplies itself. Sometimes it carries a fact:
  // ADP v. Mork reads "appeal consolidated in ADP, LLC v. Rafferty, 923 F.3d
  // 113", and rebuilding from the citation alone loses the consolidation. So
  // anything beyond a conventional signal is preserved whole and reported.
  let before = (line ?? '').slice(0, m.index);
  if (caption && before.startsWith(caption)) before = before.slice(caption.length);
  const clause = before.slice(before.lastIndexOf(';') + 1);
  // Strip the whole signal, not its first word. "aff'd in part and rev'd in
  // part" is conventional throughout and leaves nothing behind; "appeal
  // consolidated in ADP, LLC v. Rafferty" leaves a case name, which is a fact.
  let leftover = clause.replace(/^[\s,;]+|[\s,.]+$/g, ''), prev;
  do {
    prev = leftover;
    leftover = leftover
      .replace(/^(aff[''\u2019]?d|affirmed|rev[''\u2019]?d|reversed|vacated|remanded|appeal\s+dismissed|appeal(ed)?|in\s+part|and|sub\s+nom\.?)\b[\s,]*/i, '')
      .replace(/^[\s,]+/, '');
  } while (leftover !== prev);
  const carriesMore = leftover.length > 0 && !/^No\.\s*[\d:cvr-]+$/i.test(leftover);

  return { text: m[0], carriesMore, context: carriesMore ? clause.replace(/^[\s,;]+/, '') + m[0] : null };
}

const rows = [];
for (const f of fs.readdirSync(OPS).filter((x) => x.endsWith('.json'))) {
  const file = path.join(OPS, f);
  const rec = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!rec.decision_ecf_number || !rec.decision_date) continue;   // nothing to lead with

  const date = longDate(rec.decision_date);
  const published = districtReporter(rec.citation_line);
  // Consolidated cases carry several district dockets. Take the list the
  // existing line already states rather than the single field.
  const stated = /\bNos\.\s*((?:\d:\d{2}-[a-z]{2}-\d+)(?:\s*(?:,|&|and)\s*(?:\d:\d{2}-[a-z]{2}-\d+))+)/i
    .exec(rec.citation_line ?? '');
  const dockets = stated ? `Nos. ${stated[1].trim()}` : `No. ${rec.district_docket}`;
  const head = published
    ? `${rec.caption}, ${published}`
    : `${rec.caption}, ${dockets}, ECF No. ${rec.decision_ecf_number} (D.N.J. ${date})`;

  const sig = signal(rec.appellate_posture_note);
  const tail = appellateTail(rec.citation_line, rec.caption);
  const why = [];
  if (!date) why.push('unparseable decision_date');
  if (/\bNos\.\s*\d:\d{2}-/.test(rec.citation_line ?? '') && !stated)
    why.push('the line names several dockets in a form this could not parse');
  if (!sig && tail) why.push('no signal derivable from the posture note');
  if (!tail && rec.appellate_posture_note) why.push('appellate citation not extractable from the existing line');
  if (higherCourt(rec.appellate_posture_note))
    why.push('a second court acted; the signal is a sequence, not a partial');
  if (tail?.carriesMore) why.push(`the appellate clause carries more than a citation: \u201c${tail.context}\u201d`);

  const next = tail && sig ? `${head}, ${sig}, ${tail.text}`
             : tail ? `${head}, ${tail.text}`
             : head;
  rows.push({ file, rec, next, why, changed: next !== rec.citation_line });
}

const clean = rows.filter((r) => r.changed && !r.why.length);
const flagged = rows.filter((r) => r.changed && r.why.length);

for (const r of clean) {
  console.log(`  ${r.rec.judge_slug}`);
  console.log(`    was: ${r.rec.citation_line}`);
  console.log(`    now: ${r.next}\n`);
}
if (flagged.length) {
  console.log(`  ${flagged.length} need a human:\n`);
  for (const r of flagged) {
    console.log(`  ${r.rec.judge_slug} — ${r.why.join('; ')}`);
    console.log(`    was: ${r.rec.citation_line}`);
    console.log(`    now: ${r.next}\n`);
  }
}

if (write) {
  for (const r of clean) fs.writeFileSync(r.file, JSON.stringify({ ...r.rec, citation_line: r.next }, null, 2) + '\n');
  console.log(`${clean.length} rewritten. ${flagged.length} left alone.`);
} else {
  console.log(`${clean.length} would be rewritten, ${flagged.length} left alone. --write applies them.`);
}
