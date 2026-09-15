#!/usr/bin/env node
/**
 * Propose matter-relevant decisions for the `recent` tier.
 *
 *   npm run ingest -- --district=dnj
 *   npm run ingest -- --district=dnj --subjects=trade-secrets --write
 *
 * This is the tier the mail campaign needs. The recipient is a defendant newly
 * served in D.N.J. who has not appeared through counsel. He wants to see how the
 * judge on his docket handles the kind of case he is in, recently. He does not
 * want a Second Amendment en banc history.
 *
 * Three gates, no scoring. Do not run these candidates through the significance
 * rubric: it is a career screen, and it rejects exactly the ordinary
 * trade-secrets TRO this reader came for.
 *
 *   1. Subject. The decision matches a search term for a subject on the intake
 *      list. Terms live in taxonomy.json so they can be tuned without code.
 *   2. Window. Inside the lookback in policy.json — five years for subject.
 *   3. Link. A free public copy exists. CourtListener's opinions collection is
 *      the source, so the link is the decision itself, which is also what makes
 *      `opinion_text` an honest authorship source for these.
 *
 * Why this tier fills the empty District Judge pages when the significant tier
 * emptied them: an ordinary Rule 12 ruling from 2023 was never appealed, so
 * there is no appellate opinion to mistake for it, and it sits at the district
 * level by construction.
 *
 * Writes proposals into review/pending/ and nothing else, ever. Ingestion does
 * not touch src/content; a human reads each candidate, writes the headnote from
 * the public opinion, and merges. That is hard constraint 6.
 *
 * Needs COURTLISTENER_TOKEN. Use `npm run ingest`, which reads .env; calling
 * node directly does not, and the run falls back to five requests a minute.
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cl, hasToken, stats } from './lib/courtlistener.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const CONFIG = join(ROOT, 'src', 'content', 'config');

const arg = (n, d = null) => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};
const DISTRICT = arg('district', 'dnj');
const COURT = { dnj: 'njd' }[DISTRICT] ?? DISTRICT;
const WRITE = process.argv.includes('--write');
const ONE_JUDGE = arg('judge');

const taxonomy = JSON.parse(readFileSync(join(CONFIG, 'taxonomy.json'), 'utf8'));
const policy = JSON.parse(readFileSync(join(CONFIG, 'policy.json'), 'utf8'));

const SUBJECTS = (arg('subjects') ?? taxonomy.topic_pages.join(',')).split(',').filter(Boolean);
const PER_TAG = Number(arg('limit', policy.caps.recent_per_tag ?? 5));
const YEARS = policy.lookback.subject_district_years ?? 5;
const CUTOFF = new Date(Date.now() - YEARS * 365.25 * 86400000).toISOString().slice(0, 10);
const TODAY = new Date().toISOString().slice(0, 10);

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);

// --- what already exists, so a proposal is never a duplicate ----------------
// Identity is judge + caption + district docket. Caption alone collides on this
// corpus, and two entries can legitimately share a docket when a case was
// reassigned, so all three are needed.
function existingKeys() {
  const keys = new Set();
  const dirs = [join(ROOT, 'src', 'content', 'districts', DISTRICT, 'opinions'),
                ...readdirSync(join(ROOT, 'review', 'pending'), { withFileTypes: true })
                  .filter((d) => d.isDirectory())
                  .map((d) => join(ROOT, 'review', 'pending', d.name))];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      try {
        const o = JSON.parse(readFileSync(join(dir, f), 'utf8'));
        if (o.judge_slug) keys.add(`${o.judge_slug}|${o.caption}|${o.district_docket ?? ''}`);
      } catch { /* README and other non-records */ }
    }
  }
  return keys;
}

/** CourtListener's district docket string, normalised to the vicinage form. */
function normaliseDocket(raw) {
  if (!raw) return null;
  const m = /(\d):?(\d{2}-(?:cv|cr|mc|md)-\d{3,6})/i.exec(raw) ?? /(\d{2}-\d{3,5})/.exec(raw);
  if (!m) return null;
  return m.length > 2 ? `${m[1]}:${m[2]}` : null;
}

function proposal(hit, judge, subject) {
  const caption = hit.caseName;
  const docket = normaliseDocket(hit.docketNumber);
  const url = `https://www.courtlistener.com${hit.absolute_url}`;
  // The link is the decision, so the document names its author. Only claim that
  // when the name on it matches the page the entry would sit on.
  const named = (hit.judge ?? '').trim();
  const matches = named && named.split(/[\s,]+/).some((w) => w.length > 3 && judge.name.includes(w));
  return {
    id: `${judge.slug}--${slug(caption)}`,
    district: DISTRICT,
    judge_slug: judge.slug,
    judge_name: judge.name,
    judge_office: judge.office.startsWith('magistrate') ? 'magistrate' : 'district',
    caption,
    citation_line: `${caption}${docket ? `, No. ${docket}` : ''} (D.N.J. ${hit.dateFiled})`,
    district_docket: docket,
    appellate_docket: null,
    additional_dockets: [],
    reporter_cite: (hit.citation ?? [])[0] ?? null,
    court: 'D.N.J.',
    tier: 'recent',
    document_type: 'opinion',
    rr_disposition: null,
    // Written by a human from the public opinion. Never from a headnote.
    headnote_district_ruling: null,
    qualification_rationale: null,
    appellate_posture_note: `No appellate disposition identified as of ${TODAY}.`,
    headnote_status: 'draft',
    public_url: url,
    links: [{ anchor: 'District opinion (CourtListener)', url }],
    link_level: 'district',
    // The significance rubric is a career screen and does not apply to this tier.
    classification: null,
    score_total: null,
    components: {},
    subject_screen: 'qualifying',
    subject_label: taxonomy.labels?.[subject] ?? subject,
    subject_screen_exclusion_reason: null,
    publish_subject_index: true,
    subject_primary: subject,
    subject_secondary: [],
    subject_index_only: false,
    procedural_tags: [],
    motion_type: null,
    disposition: null,
    taxonomy_gap: null,
    decision_ecf_number: null,
    decision_date: hit.dateFiled ?? null,
    authored_by: matches ? judge.name : null,
    authorship_source: matches ? 'opinion_text' : 'unverified',
    research_cutoff: TODAY,
    status_checked: TODAY,
    last_verified: TODAY,
    _ingest: {
      matched_subject: subject,
      matched_terms: taxonomy.search_terms[subject],
      courtlistener_judge_field: named || null,
      window: `${CUTOFF} to ${TODAY} (${YEARS}y subject lookback)`,
      needs: ['headnote written from the public opinion', 'procedural tags', 'link verified to resolve'],
    },
  };
}

// ---------------------------------------------------------------------------

const judgeDir = join(ROOT, 'src', 'content', 'districts', DISTRICT, 'judges');
let judges = readdirSync(judgeDir).map((f) => JSON.parse(readFileSync(join(judgeDir, f), 'utf8')));
if (ONE_JUDGE) judges = judges.filter((j) => j.slug === ONE_JUDGE);
judges = judges.filter((j) => j.render_section === 'current_bench');

const seen = existingKeys();
const outDir = join(ROOT, 'review', 'pending', `${DISTRICT}-recent-${TODAY}`);
const proposals = [];
let searches = 0, skipped = 0;

console.log(`${judges.length} judges x ${SUBJECTS.length} subject(s), ${YEARS}-year window from ${CUTOFF}`);
console.log(`cap ${PER_TAG} per judge per subject\n`);

for (const judge of judges) {
  const surname = judge.name.split(/\s+/).pop();
  for (const subject of SUBJECTS) {
    const terms = taxonomy.search_terms?.[subject];
    if (!terms) { console.log(`  ! no search terms for '${subject}' in taxonomy.json`); continue; }
    let hits = [];
    try {
      searches++;
      const r = await cl('/search/', {
        type: 'o', court: COURT, judge: surname, q: terms,
        filed_after: CUTOFF, order_by: 'dateFiled desc',
      });
      hits = (r.results ?? []).slice(0, PER_TAG * 3);
    } catch (e) {
      console.log(`  ! ${judge.slug} / ${subject}: ${e.message}`);
      if (/quota exhausted/.test(e.message)) break;
      continue;
    }

    let kept = 0;
    for (const hit of hits) {
      if (kept >= PER_TAG) break;
      if (!hit.absolute_url || !hit.caseName) continue;
      const p = proposal(hit, judge, subject);
      const key = `${p.judge_slug}|${p.caption}|${p.district_docket ?? ''}`;
      if (seen.has(key)) { skipped++; continue; }
      seen.add(key);
      proposals.push(p);
      kept++;
      console.log(`  + ${judge.name.padEnd(22).slice(0, 22)} ${subject.padEnd(28)} ${hit.dateFiled}  ${hit.caseName.slice(0, 40)}`);
    }
  }
}

if (WRITE && proposals.length) {
  mkdirSync(outDir, { recursive: true });
  for (const p of proposals) writeFileSync(join(outDir, `${p.id}.json`), JSON.stringify(p, null, 2) + '\n');
  writeFileSync(join(outDir, 'README.md'),
    `# Proposed: ${DISTRICT} recent tier, ${TODAY}\n\n` +
    `${proposals.length} candidates from CourtListener's opinions collection, ` +
    `${YEARS}-year window from ${CUTOFF}, capped at ${PER_TAG} per judge per subject.\n\n` +
    `Nothing here renders. Each candidate needs, before it moves into ` +
    `\`src/content/districts/${DISTRICT}/opinions/\`:\n\n` +
    `1. A headnote written from the public opinion — never from a commercial headnote.\n` +
    `2. Procedural tags from \`taxonomy.json\`.\n` +
    `3. The link verified to resolve to the correct case.\n` +
    `4. Authorship confirmed. Where \`authorship_source\` is \`unverified\`, the name\n` +
    `   CourtListener recorded did not match the judge whose page this would sit on;\n` +
    `   that is a finding, not a formatting problem.\n` +
    `5. The judge's \`actual_selected_count\` and \`declared_selected_count\` raised.\n\n` +
    `Then \`npm run validate\`.\n`);
}

const unattributed = proposals.filter((p) => p.authorship_source === 'unverified').length;
console.log(`\n${searches} searches · ${proposals.length} candidates · ${skipped} already in the tree`);
console.log(`${unattributed} candidate(s) where the recorded judge did not match the page`);
const s = stats();
if (s.throttleEvents) console.log(`${s.throttleEvents} throttle event(s); final pacing ${s.gapMs}ms`);
if (!hasToken()) console.log('COURTLISTENER_TOKEN is unset; this ran at 5 requests/minute.');
console.log(WRITE && proposals.length
  ? `\nWritten to ${outDir.replace(ROOT + '/', '')}`
  : '\nDry run. Add --write to propose these into review/pending/.');
