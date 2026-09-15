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
 * The source is GovInfo, not CourtListener. That was not the first design.
 * CourtListener's citable opinions collection returns 53 D.N.J. hits for "trade
 * secret" whose newest is June 2016 and none inside a five-year window; recent
 * district decisions live in RECAP as documents that are mostly not available.
 * The 44 published entries decided 2021 or later confirm it — 19 link to GovInfo
 * and 23 to Justia. GovInfo's USCOURTS collection is the source of record.
 *
 * Needs GOVINFO_API_KEY. DEMO_KEY works for a small run and throttles hard; a
 * real key is free from api.data.gov. Use `npm run ingest`, which reads .env.
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchUscourts, granule, pdfUrl, usingDemoKey, stats } from './lib/govinfo.mjs';
import { findBySubject, docketsById } from './lib/recap.mjs';

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
// RECAP by default. GovInfo was the original source on the belief that
// CourtListener could not serve this tier; that was true of its citable
// opinions collection and false of its RECAP document index, which carries
// recent D.N.J. opinions with their signature lines. --source=govinfo keeps the
// older path for a district where RECAP coverage is thin.
const SOURCE = arg('source', 'recap');

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
  const url = hit.url;
  // The link is the decision, so the document names its author. Only claim that
  // when the name on it matches the page the entry would sit on.
  const named = (hit.namedJudge ?? '').trim();
  const matches = named && named.split(/[\s,]+/).some((w) => w.length > 3 && judge.name.includes(w));
  return {
    id: `${judge.slug}--${slug(caption)}`,
    district: DISTRICT,
    judge_slug: judge.slug,
    judge_name: judge.name,
    judge_office: judge.office.startsWith('magistrate') ? 'magistrate' : 'district',
    caption,
    citation_line: `${caption}${docket ? `, No. ${docket}` : ''} (D.N.J. ${hit.dateFiled ?? ''})`.trim(),
    district_docket: docket,
    appellate_docket: null,
    additional_dockets: [],
    reporter_cite: null,
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
    links: hit.pdf
      ? [{ anchor: `District opinion, ECF ${hit.ecf} (CourtListener)`, url },
         { anchor: 'District opinion PDF (RECAP)', url: hit.pdf }]
      : [{ anchor: 'District opinion (GovInfo)', url }],
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
    decision_ecf_number: hit.ecf != null ? String(hit.ecf) : null,
    decision_date: hit.dateFiled ?? null,
    authored_by: hit.signedBy ?? (matches ? judge.name : null),
    // RECAP gives the clerk's line, which is the best of the three sources.
    // GovInfo gives a judge field that has to be matched against the page.
    authorship_source: hit.signedBy ? 'docket_entry_signature'
                     : matches ? 'opinion_text' : 'unverified',
    research_cutoff: TODAY,
    status_checked: TODAY,
    last_verified: TODAY,
    _ingest: {
      matched_subject: subject,
      matched_terms: taxonomy.search_terms[subject],
      source: hit.pdf ? 'recap' : 'govinfo',
      govinfo_package: hit.packageId ?? null,
      govinfo_granule: hit.granuleId ?? null,
      judge_field: named || null,
      docket_entry: hit.description ?? null,
      matched_text: hit.snippet ?? null,
      window: `${CUTOFF} to ${TODAY} (${YEARS}y subject lookback)`,
      predates_watershed: hit.predatesWatershed ?? null,
      needs: [
        'headnote written from the public opinion',
        'procedural tags',
        'link verified to resolve',
        ...(hit.predatesWatershed
          ? [`decided before ${hit.predatesWatershed.date}: ${hit.predatesWatershed.what} ` +
             `Say so on the page or do not publish it.`]
          : []),
      ],
    },
  };
}

// ---------------------------------------------------------------------------

const judgeDir = join(ROOT, 'src', 'content', 'districts', DISTRICT, 'judges');
let judges = readdirSync(judgeDir).map((f) => JSON.parse(readFileSync(join(judgeDir, f), 'utf8')));
if (ONE_JUDGE) judges = judges.filter((j) => j.slug === ONE_JUDGE);
// Every judge on the roster, not just the current_bench section. Cooper,
// Sheridan, McNulty and Thompson render under fjc_reconciliation and three of
// the four have empty or near-empty pages — exactly the judges this tier exists
// to serve. Filtering them out was silently excluding the need.
// Judges with no page at all are excluded by having no record to begin with.

const seen = existingKeys();
const outDir = join(ROOT, 'review', 'pending', `${DISTRICT}-recent-${TODAY}`);
const proposals = [];
let searches = 0, skipped = 0;

console.log(`${judges.length} judges x ${SUBJECTS.length} subject(s), ${YEARS}-year window from ${CUTOFF}`);
console.log(`cap ${PER_TAG} per judge per subject · source: ` +
            `${SOURCE === 'recap' ? 'RECAP document index' : 'GovInfo USCOURTS'}\n`);

const bySurname = new Map(judges.map((j) => [j.name.split(/\s+/).pop().toLowerCase(), j]));

for (const subject of SUBJECTS) {
  const terms = taxonomy.search_terms?.[subject];
  if (!terms) { console.log(`  ! no search terms for '${subject}' in taxonomy.json`); continue; }

  // One search per subject across the whole court, then attribute to judges.
  // Searching per judge per subject would be 41x the calls for the same corpus,
  // and neither source filters by judge in the query anyway.
  let results = [];
  try {
    searches++;
    if (SOURCE === 'recap') {
      const hits = await findBySubject({ court: COURT, terms, since: CUTOFF, limit: 60 });
      const dockets = await docketsById(hits.map((h) => h.docketId));
      searches += dockets.size;
      results = hits.map((h) => ({ ...h, docket: dockets.get(h.docketId) ?? null }));
    } else {
      const r = await searchUscourts({ courtCode: COURT, terms, since: CUTOFF, pageSize: 100 });
      results = r.results ?? [];
    }
    if (!results.length) console.log(`  · ${subject}: no results`);
  } catch (e) {
    console.log(`  ! ${subject}: ${e.message}`);
    continue;
  }

  const perJudge = new Map();
  for (const hit of results) {
    // Normalise the two sources to one shape: who signed, what it is called,
    // which docket, when, and where the public copy is.
    let named, caseName, docketNumber, issued, url, extra;
    if (SOURCE === 'recap') {
      if (!hit.docket) continue;                    // no docket, no identity
      named = hit.judge;
      caseName = hit.docket.case_name;
      docketNumber = hit.docket.docket_number;
      issued = hit.dateSigned ?? hit.dateFiled;
      url = hit.page ?? hit.pdf;
      extra = { ecf: hit.ecf, pdf: hit.pdf, signedBy: hit.judge,
                description: hit.description, snippet: hit.snippet };
    } else {
      if (!hit.packageId || !hit.granuleId) continue;
      let g;
      try { searches++; g = await granule(hit.packageId, hit.granuleId); }
      catch (e) { console.log(`  ! granule ${hit.granuleId}: ${e.message}`); continue; }
      named = [g.judges, g.judge, g.courtName].flat().filter((x) => typeof x === 'string').join(' ');
      caseName = g.title ?? hit.title;
      docketNumber = g.caseNumber ?? null;
      issued = g.dateIssued ?? hit.dateIssued ?? null;
      url = pdfUrl(hit.packageId, hit.granuleId);
      extra = { packageId: hit.packageId, granuleId: hit.granuleId };
    }

    const surname = [...bySurname.keys()].find((sn) => new RegExp(`\\b${sn}\\b`, 'i').test(named ?? ''));
    if (!surname) continue;
    const judge = bySurname.get(surname);
    if (ONE_JUDGE && judge.slug !== ONE_JUDGE) continue;

    const key = `${judge.slug}|${subject}`;
    const kept = perJudge.get(key) ?? 0;
    if (kept >= PER_TAG) continue;

    // A decision inside the window can still predate the statute the reader's
    // case will be pleaded under. Flag it; do not silently drop it.
    const ws = policy.doctrinal_watersheds?.[subject];
    const predates = ws && issued && issued < ws.date;

    const p = proposal({
      caseName, docketNumber, dateFiled: issued, url, namedJudge: named,
      ...extra,
      predatesWatershed: predates ? ws : null,
    }, judge, subject);

    const idKey = `${p.judge_slug}|${p.caption}|${p.district_docket ?? ''}`;
    if (seen.has(idKey)) { skipped++; continue; }
    seen.add(idKey);
    proposals.push(p);
    perJudge.set(key, kept + 1);
    console.log(`  ${predates ? '~' : '+'} ${judge.name.padEnd(22).slice(0, 22)} ${subject.padEnd(24)} ` +
                `${p.decision_date ?? '—'}  ${String(p.caption).slice(0, 36)}` +
                (predates ? `  [predates ${ws.date}]` : ''));
  }
}

if (WRITE && proposals.length) {
  mkdirSync(outDir, { recursive: true });
  for (const p of proposals) writeFileSync(join(outDir, `${p.id}.json`), JSON.stringify(p, null, 2) + '\n');
  writeFileSync(join(outDir, 'README.md'),
    `# Proposed: ${DISTRICT} recent tier, ${TODAY}\n\n` +
    `${proposals.length} candidates from ${SOURCE === 'recap' ? "CourtListener's RECAP document index" : 'GovInfo USCOURTS'}, ` +
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
if (usingDemoKey()) console.log('GOVINFO_API_KEY is unset; this ran on DEMO_KEY, which throttles hard.');
console.log(WRITE && proposals.length
  ? `\nWritten to ${outDir.replace(ROOT + '/', '')}`
  : '\nDry run. Add --write to propose these into review/pending/.');
