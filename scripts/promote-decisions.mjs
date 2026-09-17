#!/usr/bin/env node
/**
 * Move held records that now have a district decision into src/content.
 *
 *   node scripts/promote-decisions.mjs --district=dnj
 *   node scripts/promote-decisions.mjs --district=dnj --write
 *
 * This is the human merge step in written form, not an ingest. Nothing here
 * decides anything: a record qualifies only if a person already resolved which
 * document it describes and a gate already accepted the result. It moves files
 * and fixes the counts that moving them changes.
 *
 * It refuses to promote a record that would break the per-judge cap, and it
 * refuses to promote one whose authorship is unverified or whose link is not at
 * district level — the same tests validate.mjs applies, checked here so a bad
 * record never reaches src/content rather than being caught after it does.
 *
 * Promoted records are unsigned, which is the expected state. The curator reads
 * the rendered page — not the JSON — and asks what the gate cannot: would a
 * reader infer a tendency from this selection? Then signs:
 *
 *     node scripts/sign-record.mjs <slug> --reviewer "Name"
 */

import fs from 'node:fs';
import path from 'node:path';
import { sameJudge } from './lib/judge-name.mjs';

const args = new Map(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const district = args.get('district') ?? 'dnj';
const write = Boolean(args.get('write'));

const HELD = path.join('review', 'pending', `${district}-no-district-decision`);
const SCOPE = path.join('review', 'pending', `${district}-out-of-scope-criminal`);
const OPS = path.join('src', 'content', 'districts', district, 'opinions');
const JUDGES = path.join('src', 'content', 'districts', district, 'judges');
const cap = JSON.parse(fs.readFileSync(path.join('src', 'content', 'config', 'policy.json'), 'utf8'))
  .caps.significant_per_judge;

const read = (d) => !fs.existsSync(d) ? [] :
  fs.readdirSync(d).filter((f) => f.endsWith('.json'))
    .map((f) => ({ file: path.join(d, f), name: f, rec: JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')) }));

const published = read(OPS);
const held = read(HELD);
const scoped = read(SCOPE);

const countBy = (rows) => rows.reduce((m, { rec }) => (m[rec.judge_slug] = (m[rec.judge_slug] ?? 0) + 1, m), {});
const now = countBy(published);

const ready = [], blocked = [];
const projected = { ...now };
for (const h of held) {
  const { rec } = h;
  const why = [];
  if (rec.link_level !== 'district') why.push(`link_level '${rec.link_level}'`);
  if (rec.authorship_source === 'unverified') why.push('authorship unverified');
  if (rec.authored_by && rec.judge_name && !sameJudge(rec.authored_by, rec.judge_name))
    why.push(`signed by ${rec.authored_by}, filed under ${rec.judge_name}`);
  if ((projected[rec.judge_slug] ?? 0) + 1 > cap) why.push(`would exceed the ${cap}-per-judge cap`);
  if (why.length) { blocked.push({ ...h, why }); continue; }
  projected[rec.judge_slug] = (projected[rec.judge_slug] ?? 0) + 1;
  ready.push(h);
}

console.log(`${ready.length} ready to promote, ${blocked.length} staying held\n`);
const byJudge = {};
for (const r of ready) (byJudge[r.rec.judge_slug] = byJudge[r.rec.judge_slug] ?? []).push(r.rec);
for (const slug of Object.keys(byJudge).sort()) {
  const before = now[slug] ?? 0;
  console.log(`  ${slug}  ${before} -> ${before + byJudge[slug].length}${before === 0 ? '   (page was empty)' : ''}`);
  for (const rec of byJudge[slug])
    console.log(`     ECF ${rec.decision_ecf_number} ${rec.decision_date}  ${rec.caption.slice(0, 56)}`);
}
if (blocked.length) {
  console.log(`\n  staying held:`);
  for (const b of blocked) console.log(`     ${b.rec.caption.slice(0, 52)} — ${b.why.join('; ')}`);
}

if (!write) {
  console.log(`\nNothing was moved. --write promotes them, unsigned, for the curator to read.`);
  process.exit(0);
}

for (const r of ready) fs.renameSync(r.file, path.join(OPS, r.name));

// Counts and status follow the files. A judge with entries reads 'represented';
// one without reads 'developing' and keeps a note saying what is outstanding,
// so an empty page is legibly maintained rather than merely empty.
const after = countBy(read(OPS));
const stillHeld = countBy(read(HELD));
const outOfScope = countBy(scoped);
let touched = 0;
for (const { file, rec: j } of read(JUDGES)) {
  const n = after[j.slug] ?? 0;
  const h = stillHeld[j.slug] ?? 0;
  const s = outOfScope[j.slug] ?? 0;
  const status = n > 0 ? 'represented' : 'developing';
  const parts = [];
  if (h) parts.push(`${h} decision${h === 1 ? '' : 's'} held pending a district-court link`);
  if (s) parts.push(`${s} moved out of scope as criminal subject matter`);
  const note = parts.length
    ? parts.join('; ').replace(/^./, (c) => c.toUpperCase()) + '.'
    : (n > 0 ? null : j.record_status_note ?? null);
  if (j.declared_selected_count === n && j.actual_selected_count === n
      && j.record_status === status && (j.record_status_note ?? null) === note) continue;
  fs.writeFileSync(file, JSON.stringify({
    ...j, declared_selected_count: n, actual_selected_count: n,
    record_status: status, record_status_note: note,
  }, null, 2) + '\n');
  touched++;
}

console.log(`\n${ready.length} promoted; ${touched} judge records updated.`);
console.log(`They are unsigned. Read the rendered pages, then sign what you accept.`);
