#!/usr/bin/env node
// Compliance and data gates. Fails the build on violation.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { runComplianceGates } from './gates-compliance.mjs';
import { sameJudge } from './lib/judge-name.mjs';

const ROOT = 'src/content/districts';
const tax = JSON.parse(readFileSync('src/content/config/taxonomy.json', 'utf8'));
const policy = JSON.parse(readFileSync('src/content/config/policy.json', 'utf8'));
const INTAKE = new Set(tax.subject.intake_filter);
const CAP_SIG = policy.caps.significant_per_judge;
const CAP_RECENT = policy.caps.recent_per_tag;
// The matter-relevant window, as a date. A record older than this is not
// matter-relevant however good it is; that is what the tier means.
const SUBJECT_CUTOFF = new Date(Date.now() - policy.lookback.subject_district_years * 365.25 * 86400000)
  .toISOString().slice(0, 10);
const SUBJ = new Set(tax.subject.all), PROC = new Set(tax.procedural.all);
const CMAX = { app:25, doc:20, prac:20, end:15, press:10, career:10 };
const BANDS = [[75,100,'major'],[60,74,'noteworthy'],[40,59,'qualifying'],[30,39,'supplemental']];
const SCMAX = { centrality:25, analysis:25, disposition:20, doctrine:15, treatment:10, practical:5 };
const SCBANDS = [[60,100,'principal'],[45,59,'useful'],[35,44,'supplemental']];
// Per-judge aggregate fields are forbidden: they turn a record of what a judge
// has done into a prediction of what a judge will do.
const FORBIDDEN = /grant_rate|reversal_rate|affirmance_rate|win_rate|denial_rate|avg_time|average_time|ideolog|lean|score_percentile|ranking/i;

const err = [];
const warn = [];

// Criminal in substance, whatever the docket says. Removed from taxonomy.json on
// 15 September 2026 and kept here so a record carrying one fails loudly rather
// than falling through the closed-vocabulary check with a vague message.
const CRIMINAL_SUBJECTS = new Set([
  'federal-criminal', 'criminal-public-corruption', 'habeas-post-conviction',
]);

// Deliberately not a disposition test. "Convicted", "sentenced" and "indictment"
// describe what happened to a defendant; "prosecution" alone is the predicate of
// a civil malicious-prosecution claim and does not qualify.
const CRIMINAL_PROSE =
  /\b(jury convicted|was convicted|convicted him|convicted her|imposed a sentence|sentenced (?:him|her|the defendant)|returned an indictment|pleaded guilty|guilty plea)\b/i;
const districts = readdirSync(ROOT).filter(d => existsSync(join(ROOT, d, 'judges')));
const canonical = new Map();

for (const d of districts) {
  const jdir = join(ROOT, d, 'judges'), odir = join(ROOT, d, 'opinions');
  const judges = readdirSync(jdir).map(f => JSON.parse(readFileSync(join(jdir, f), 'utf8')));
  const ops = existsSync(odir)
    ? readdirSync(odir).map(f => JSON.parse(readFileSync(join(odir, f), 'utf8'))) : [];

  for (const j of judges) {
    if (j.canonical !== false) {
      if (canonical.has(j.slug)) err.push(`${j.slug}: canonical in ${canonical.get(j.slug)} and ${d}`);
      canonical.set(j.slug, d);
    }
    for (const k of Object.keys(j)) if (FORBIDDEN.test(k)) err.push(`${j.slug}: forbidden aggregate field '${k}'`);
    if (j.biography) {
      const b = j.biography;
      if (!b.sources?.length) err.push(`${j.slug}: biography with no source link`);
      if (!b.last_verified) err.push(`${j.slug}: biography with no verification date`);
      if (b.confidence !== 'verified' && !b.source_note)
        err.push(`${j.slug}: confidence '${b.confidence}' with no source note`);
      if (/(a website should|the website should|should be rechecked before publication|this report does not infer)/i.test(b.text))
        err.push(`${j.slug}: biography contains an editorial instruction to the builder`);
      if (/\b(brilliant|respected|well-regarded|no-nonsense|tough|lenient|conservative|liberal|plaintiff-friendly|defense-friendly)\b/i.test(b.text))
        err.push(`${j.slug}: biography contains characterization`);
    }
    const n = ops.filter(o => o.judge_slug === j.slug).length;
    if (n !== j.actual_selected_count) err.push(`${j.slug}: count ${j.actual_selected_count} != ${n} records`);
    // Caps are per tier. The career screen is capped per judge; the
    // matter-relevant tier is capped per judge per subject, because a reader
    // arrives with one subject and five entries in it is already generous.
    const mine = ops.filter(o => o.judge_slug === j.slug);
    const sig = mine.filter(o => o.tier === 'significant').length;
    if (sig > CAP_SIG) err.push(`${j.slug}: ${sig} significant decisions exceeds cap of ${CAP_SIG}`);
    for (const t of INTAKE) {
      const k = mine.filter(o => o.tier === 'recent' &&
        (o.subject_primary === t || (o.subject_secondary ?? []).includes(t))).length;
      if (k > CAP_RECENT)
        err.push(`${j.slug}: ${k} recent decisions tagged '${t}' exceeds cap of ${CAP_RECENT}`);
    }
    if (n === 0 && j.record_status === 'represented') err.push(`${j.slug}: no decisions and no status note`);
    if (n > 0 && j.record_status !== 'represented') err.push(`${j.slug}: status '${j.record_status}' with ${n} records`);
  }

  const seen = new Set();
  for (const o of ops) {
    const id = o.id;
    for (const k of Object.keys(o)) if (FORBIDDEN.test(k)) err.push(`${id}: forbidden aggregate field '${k}'`);

    // Criminal subject matter is out of scope. The reader is a civil defendant
    // newly served and not yet represented; a criminal docket tells them
    // nothing, and selection among criminal outcomes on a page carrying an
    // attorney-advertising banner reads as a verdict on the judge however
    // factually each line is written.
    //
    // The line is subject matter, not docket type, so a habeas petition, a
    // § 2255 motion and a coram nobis petition are excluded on their substance
    // although each carries a civil docket number.
    if (CRIMINAL_SUBJECTS.has(o.subject_primary))
      err.push(`${id}: subject '${o.subject_primary}' is criminal — out of scope`);
    for (const t of o.subject_secondary ?? [])
      if (CRIMINAL_SUBJECTS.has(t)) err.push(`${id}: secondary subject '${t}' is criminal — out of scope`);
    if (/-cr-/.test(o.district_docket ?? ''))
      err.push(`${id}: district docket '${o.district_docket}' is a criminal docket — out of scope`);

    // Prose only warns. United States v. Smith was tagged evidence-and-sanctions
    // with a jury conviction underneath, so the tags alone do not catch
    // everything; but Elfar v. Township of Holmdel is a civil-rights plaintiff
    // pleading malicious prosecution under the Tort Claims Act, and a rule that
    // failed on the word "prosecution" would delete it. A human reads these.
    if (CRIMINAL_PROSE.test(o.headnote_district_ruling ?? ''))
      warn.push(`${id}: headnote reads as a criminal prosecution while its subject is ` +
                `'${o.subject_primary}' — confirm it is civil in substance`);

    // The matter-relevant tier has three rules and no scoring. A record that
    // fails any of them is not matter-relevant, whatever else is true of it.
    if (o.tier === 'recent') {
      const tags = [o.subject_primary, ...(o.subject_secondary ?? [])];
      if (!tags.some((t) => INTAKE.has(t)))
        err.push(`${id}: recent tier but no subject on the intake list — ` +
                 `a reader cannot arrive at this entry`);
      if (!o.decision_date)
        err.push(`${id}: recent tier with no decision_date — the window cannot be applied`);
      else if (o.decision_date < SUBJECT_CUTOFF)
        err.push(`${id}: decided ${o.decision_date}, outside the matter-relevant window ` +
                 `(from ${SUBJECT_CUTOFF})`);
      // Not scored, and saying otherwise invites the career rubric back in.
      if (o.score_total != null || o.classification != null)
        err.push(`${id}: recent tier carries a significance score — this tier is not scored`);
    }

    // identity: caption alone is not a key on this corpus, and the docket that
    // identifies a district decision is the district court's, never the appeal's
    // A docket can carry two published decisions by the same judge. NCAA v.
    // Governor of New Jersey is 926 F. Supp. 2d 551 and 61 F. Supp. 3d 488, both
    // Shipp, both on 3:12-cv-04947, and only the second was reversed in Murphy.
    // The ECF number is what separates them.
    const key = `${o.judge_slug}|${o.caption}|${o.district_docket ?? o.reporter_cite ?? ''}` +
                `|${o.decision_ecf_number ?? ''}`;
    if (seen.has(key)) err.push(`${id}: duplicate judge+caption+district docket identity`);
    seen.add(key);

    // An entry belongs on a judge's page only when the district court's own
    // decision is available. An appellate opinion shows what the circuit did.
    if (o.link_level !== 'district')
      err.push(`${id}: link_level '${o.link_level}' — no district-court decision available`);
    // Who decided is not a matter of inference. An entry may carry a judge's
    // name only when a source that names the author was actually read.
    // opinion_text means "the document this entry links to names its author".
    // That is only true when the link is the district court's own decision; an
    // appellate PDF names the panel, and the district judge only as the judge
    // appealed from, which is a different source with a different name.
    if (o.authorship_source === 'opinion_text' && o.link_level !== 'district')
      err.push(`${id}: authorship_source 'opinion_text' but link_level is '${o.link_level}' — ` +
               `the linked document is the appeal, not the decision`);
    if (o.authorship_source === 'unverified')
      err.push(`${id}: authorship unverified — no signature line or cover page read`);
    // Identity, not string equality. The clerk writes "Julien Xavier Neals"
    // where the roster says "Julien X. Neals", and Mary L. Cooper signs what the
    // roster calls Mary Little Cooper. The old test asked whether any word over
    // three letters appeared in both, which passed Michael Vazquez as Michael
    // Farbiarz — the exact substitution this gate exists to catch.
    if (o.authored_by && o.authorship_source !== 'unverified' &&
        !sameJudge(o.authored_by, o.judge_name))
      err.push(`${id}: signed by '${o.authored_by}' but filed under ${o.judge_name}`);
    if (!o.district_docket)
      warn.push(`${id}: no district docket recorded${o.appellate_docket ? ` (appellate docket ${o.appellate_docket} is on the record)` : ''}`);

    if (!SUBJ.has(o.subject_primary)) err.push(`${id}: subject '${o.subject_primary}' not in vocabulary`);
    if ((o.subject_secondary ?? []).length > 2) err.push(`${id}: more than 2 secondary subjects`);
    for (const t of o.subject_secondary ?? []) if (!SUBJ.has(t)) err.push(`${id}: secondary '${t}' not in vocabulary`);
    for (const t of o.procedural_tags ?? []) if (!PROC.has(t)) err.push(`${id}: procedural '${t}' not in vocabulary`);
    if (o.taxonomy_gap) err.push(`${id}: unresolved taxonomy_gap '${o.taxonomy_gap}'`);

    if (!(o.links ?? []).length) err.push(`${id}: no public link`);
    for (const l of o.links ?? []) if (/[?&]q=/.test(l.url)) err.push(`${id}: link is a search-results page`);
    if (o.headnote_status === 'published' && !o.headnote_district_ruling) err.push(`${id}: published with no ruling statement`);
    if (!o.appellate_posture_note) err.push(`${id}: no treatment statement`);
    if (o.document_type === 'report_recommendation' && !o.rr_disposition)
      err.push(`${id}: R&R with no adoption status`);

    if (o.score_total != null) {
      const c = o.components ?? {};
      const sum = Object.values(c).reduce((a, b) => a + b, 0);
      if (sum !== o.score_total) err.push(`${id}: components ${sum} != total ${o.score_total}`);
      for (const [k, v] of Object.entries(c)) if (v > CMAX[k]) err.push(`${id}: ${k}=${v} over max`);
      if (o.score_total < 30) err.push(`${id}: total ${o.score_total} below floor 30`);
      if (Math.max(c.app ?? 0, c.doc ?? 0, c.prac ?? 0) < 15) err.push(`${id}: fails independent gate`);
      const b = BANDS.find(([lo, hi]) => o.score_total >= lo && o.score_total <= hi)?.[2];
      if (b !== o.classification) err.push(`${id}: band '${o.classification}' != ${b} for ${o.score_total}`);
    }
    if (o.screen_score != null) {
      const c = o.screen_components ?? {};
      const sum = Object.values(c).reduce((a, b) => a + b, 0);
      if (sum !== o.screen_score) err.push(`${id}: screen components ${sum} != ${o.screen_score}`);
      for (const [k, v] of Object.entries(c)) if (v > SCMAX[k]) err.push(`${id}: screen ${k}=${v} over max`);
      if ((c.centrality ?? 0) < 15) err.push(`${id}: fails centrality gate`);
      if ((c.analysis ?? 0) < 15 && (c.disposition ?? 0) < 12) err.push(`${id}: fails analysis/disposition gate`);
      const b = SCBANDS.find(([lo, hi]) => o.screen_score >= lo && o.screen_score <= hi)?.[2];
      if (b !== o.screen_classification) err.push(`${id}: screen band mismatch`);
    }
  }
}

// every page must carry the advertising footer via the base layout
const layout = readFileSync('src/layouts/Base.astro', 'utf8');
if (!/advert-banner/.test(layout) || !/advert-block/.test(layout))
  err.push('Base.astro: advertising banner or footer block missing');
const astroPages = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? astroPages(p) : p.endsWith('.astro') ? [p] : [];
});
for (const p of astroPages('src/pages')) {
  if (!/from ['"].*layouts\/Base.astro['"]/.test(readFileSync(p, 'utf8')))
    err.push(`${p}: does not use Base layout — would render without the advertising notice`);
}

// Compliance gates: whether what a reader will see is allowed to be published,
// as distinct from whether the data is well formed. scripts/gates-compliance.mjs.
const sIdx = process.argv.indexOf('--stale-days');
const compliance = runComplianceGates({
  staleDays: sIdx > -1 ? Number(process.argv[sIdx + 1]) : 45,
  requireSignoffs: process.argv.includes('--require-signoffs'),
});
err.push(...compliance.errors);

const allWarn = [...warn, ...compliance.warnings];
if (allWarn.length) {
  console.warn(`${allWarn.length} warning(s):`);
  for (const w of allWarn) console.warn('  ~ ' + w);
}
for (const n of compliance.notes) console.log('note: ' + n);

if (err.length) {
  console.error(`FAILED — ${err.length} issue(s):`);
  for (const e of err) console.error('  - ' + e);
  process.exit(1);
}
console.log(`OK — ${districts.length} district(s), ${canonical.size} canonical judges, all gates passed.`);
