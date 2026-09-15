#!/usr/bin/env node
/**
 * Regenerate docs/HELD-ENTRIES.md from the tree.
 *
 *   node scripts/inventory-held.mjs --district=dnj
 *
 * The inventory was written by hand on 14 September 2026 and was accurate that
 * day. Two commits later it was not: the recoverability table said 21 entries
 * carried a district docket when 36 did, because the reconciliation that
 * followed moved twelve entries out of category B and corrected two more. A
 * hand-kept census of machine-readable facts will always drift, so this counts
 * them instead.
 *
 * Categories are recomputed from the record, not copied forward:
 *
 *   A  a district docket is on the record — a link resolves from it
 *   B  only an appellate docket, recorded where the district one belongs
 *   C  no docket, but a district reporter citation (F. Supp.) to find it by
 *   D  no docket, and the only citation is appellate — as written, the appeal
 *   E  no docket and no citation — nothing to resolve from
 *
 * Where scripts/resolve-decisions.mjs has left a report, its verdicts are
 * folded in. Categories estimate recoverability from what the record carries;
 * the verdicts answer it from what the court's docket actually holds. When both
 * are present the verdict governs and the category is context.
 */

import fs from 'node:fs';
import path from 'node:path';

const args = new Map(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const district = args.get('district') ?? 'dnj';

const HELD_DIR = path.join('review', 'pending', `${district}-no-district-decision`);
const PUB_DIR = path.join('src', 'content', 'districts', district, 'opinions');
const JUDGE_DIR = path.join('src', 'content', 'districts', district, 'judges');
const SCOPE_DIR = path.join('review', 'pending', `${district}-out-of-scope-criminal`);
const REPORT = path.join('docs', `decision-resolution-${district}.json`);
const OUT = path.join('docs', 'HELD-ENTRIES.md');

const readAll = (dir) => !fs.existsSync(dir) ? [] :
  fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
    .map((f) => ({ key: path.basename(f, '.json'), rec: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }));

const held = readAll(HELD_DIR);
const published = readAll(PUB_DIR);
const judges = readAll(JUDGE_DIR).map(({ rec }) => rec);
// An empty report is not a report. The file exists from the moment a run starts
// writing incrementally, so presence alone says nothing about whether anything
// was resolved; a run that died on its first request leaves one behind.
const rawReport = fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, 'utf8')) : null;
const report = rawReport && Object.values(rawReport).some((r) => r.flag) ? rawReport : null;
const outOfScope = readAll(SCOPE_DIR);

/** An appellate reporter cite names the appeal; a district one names the decision. */
const isDistrictReporter = (c) => /F\.\s*Supp\./i.test(c ?? '');
const isAppellateReporter = (c) => /\bF\.\s*(?:2d|3d|4th)\b|F\.\s*App'?x/i.test(c ?? '');

function category(r) {
  if (r.district_docket) return 'A';
  if (r.appellate_docket) return 'B';
  if (isDistrictReporter(r.reporter_cite)) return 'C';
  if (isAppellateReporter(r.reporter_cite)) return 'D';
  return 'E';
}

const CATEGORY_MEANING = {
  A: 'A district docket is on the record. A district link resolves from it.',
  B: 'The docket on the record is the Third Circuit’s. The district docket is missing.',
  C: 'No docket, but the district decision is published in F. Supp. and findable by citation.',
  D: 'The record carries only an appellate citation. As written, this entry is the appeal.',
  E: 'No docket and no reporter citation. Nothing on the record to resolve from.',
};

const VERDICT_MEANING = {
  ok: 'a signed district decision by this judge, PDF held',
  'no-pdf': 'this judge signed, but RECAP holds no PDF',
  mismatch: 'signed orders exist and none carry this judge’s name',
  empty: 'no signed orders indexed',
};

for (const h of held) { h.cat = category(h.rec); h.verdict = report?.[h.key]?.flag ?? null; }

const counts = {};
for (const h of held) counts[h.cat] = (counts[h.cat] ?? 0) + 1;
const verdicts = {};
for (const h of held) if (h.verdict) verdicts[h.verdict] = (verdicts[h.verdict] ?? 0) + 1;

const byJudge = new Map();
for (const j of judges) byJudge.set(j.slug, { judge: j, kept: [], held: [] });
for (const { rec } of published) byJudge.get(rec.judge_slug)?.kept.push(rec);
for (const h of held) byJudge.get(h.rec.judge_slug)?.held.push(h);

const hostOf = (u) => { try { return new URL(u).host; } catch { return null; } };
const today = new Date().toISOString().slice(0, 10);

const L = [];
L.push(`# Kept and held entries — District of New Jersey`);
L.push('');
L.push(`Generated ${today} by \`scripts/inventory-held.mjs\`. Do not edit by hand —`);
L.push(`re-run it. An entry belongs on a judge's page only when the district court's`);
L.push(`own decision is available; an appellate opinion shows what the circuit did,`);
L.push(`not what the judge did. ${held.length} entries failed that test and sit in`);
L.push(`\`${HELD_DIR}/\`, which does not render. ${published.length} remain published.`);
L.push('');
L.push(`Every held entry came from a District Judge. No magistrate judge lost one.`);
L.push(`The significant tier was scored on career significance, and a district`);
L.push(`decision important enough to score is a district decision important enough`);
L.push(`to appeal, so it survives in free repositories as a Third Circuit PDF.`);
L.push(`Magistrate work is not appealed and sits in GovInfo at the district level.`);
L.push('');
if (outOfScope.length) {
  L.push(`${outOfScope.length} further entries are not held but excluded, as criminal subject`);
  L.push(`matter. They are in \`${SCOPE_DIR}/\` and will not be restored; that`);
  L.push(`directory's README says where the line falls and which look-alikes stay.`);
  L.push('');
}
L.push(`## What the record carries`);
L.push('');
L.push(`| | Count | What it means |`);
L.push(`|---|---|---|`);
for (const c of ['A', 'B', 'C', 'D', 'E']) {
  L.push(`| **${c}** | ${counts[c] ?? 0} | ${CATEGORY_MEANING[c]} |`);
}
L.push('');
const resolvable = (counts.A ?? 0) + (counts.B ?? 0) + (counts.C ?? 0);
L.push(`${resolvable} of the ${held.length} are recoverable with a lookup.`);
L.push(`${held.length - resolvable} need research or should be dropped.`);
L.push('');

if (report) {
  L.push(`## What the docket actually holds`);
  L.push('');
  L.push(`From \`${REPORT}\`. A category estimates recoverability from what the record`);
  L.push(`carries. A verdict answers it from the court's own docket, so where the two`);
  L.push(`disagree the verdict governs.`);
  L.push('');
  L.push(`| | Count | What it means |`);
  L.push(`|---|---|---|`);
  for (const v of ['ok', 'no-pdf', 'mismatch', 'empty']) {
    if (verdicts[v]) L.push(`| \`${v}\` | ${verdicts[v]} | ${VERDICT_MEANING[v]} |`);
  }
  L.push('');
} else {
  L.push(`No resolution report yet. Run \`scripts/resolve-decisions.mjs --district=${district} --held\``);
  L.push(`and re-run this to fold in what each docket actually holds.`);
  L.push('');
}

// Defects that validate.mjs would catch on sight but never sees, because it
// walks src/content and these records are not there yet. Two Cecchi entries
// claimed the decision document as their authorship source while linking only
// the Third Circuit PDF — true of 39 records once, corrected, and these two
// survived the correction. Surface them here so the next restore does not
// rediscover them at the gate.
const defects = [];
for (const { key, rec } of held) {
  if (rec.authorship_source === 'opinion_text' && rec.link_level !== 'district') {
    defects.push([key, `authorship_source 'opinion_text' but link_level is '${rec.link_level}' \u2014 ` +
                       `the linked document is the appeal, not the decision`]);
  }
  if (rec.authored_by && rec.judge_name && rec.authored_by !== rec.judge_name) {
    defects.push([key, `authored_by '${rec.authored_by}' is not the judge whose page this sits on ` +
                       `('${rec.judge_name}')`]);
  }
  if (rec.district_docket && !/\d:\d{2}-(cv|cr|mc|md)-\d+/i.test(rec.district_docket)) {
    defects.push([key, `district_docket '${rec.district_docket}' is not shaped like a district docket`]);
  }
}
if (defects.length) {
  L.push(`## Defects in held records`);
  L.push('');
  L.push(`\`npm run validate\` walks \`src/content\` and these records are not there,`);
  L.push(`so nothing checks them until the moment one is restored and the gate sees`);
  L.push(`it for the first time. ${defects.length} would fail today.`);
  L.push('');
  for (const [k, msg] of defects) L.push(`- \`${k}\` \u2014 ${msg}`);
  L.push('');
}

for (const office of ['district', 'magistrate']) {
  const group = [...byJudge.values()]
    .filter(({ judge }) => judge.office === office)
    .filter(({ kept, held: h }) => kept.length || h.length)
    .sort((a, b) => (a.judge.name.split(' ').pop()).localeCompare(b.judge.name.split(' ').pop()));
  if (!group.length) continue;

  L.push('---');
  L.push('');
  L.push(`# ${office === 'district' ? 'District Judges' : 'Magistrate Judges'}`);
  L.push('');
  for (const { judge, kept, held: hs } of group) {
    L.push(`## ${judge.name}`);
    L.push(`kept ${kept.length} · held ${hs.length}`);
    L.push('');
    if (!kept.length) L.push(`- **Kept: none.** The page reads "Developing record."`);
    for (const k of [...kept].sort((a, b) => a.caption.localeCompare(b.caption))) {
      L.push(`- **Kept.** ${k.citation_line ?? k.caption}  `);
      L.push(`  \`${hostOf(k.public_url) ?? 'no link'}\``);
    }
    for (const h of [...hs].sort((a, b) => a.rec.caption.localeCompare(b.rec.caption))) {
      const v = h.verdict ? ` · \`${h.verdict}\`` : '';
      L.push(`- **Held (${h.cat}).**${v} ${h.rec.citation_line ?? h.rec.caption}  `);
      L.push(`  ${CATEGORY_MEANING[h.cat]}`);
      const cands = report?.[h.key]?.candidates ?? [];
      if (cands.length === 1) {
        L.push(`  ECF ${cands[0].ecf}, signed ${cands[0].date_signed} by ${cands[0].judge}.`);
      } else if (cands.length > 1) {
        L.push(`  ${cands.length} signed orders by this judge: ` +
               cands.map((c) => `ECF ${c.ecf} (${c.date_signed})`).join(', ') + '. Pick one.');
      }
      const others = report?.[h.key]?.other_signers ?? [];
      if (others.length && h.verdict === 'mismatch') {
        L.push(`  Signed instead by ${others.join(', ')}.`);
      }
    }
    L.push('');
  }
}

fs.writeFileSync(OUT, L.join('\n'));
console.log(`${OUT}: ${held.length} held, ${published.length} published, ` +
            `${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' ')}` +
            (report ? ` | verdicts ${Object.entries(verdicts).map(([k, v]) => `${k}=${v}`).join(' ')}` : ' | no resolution report yet'));
