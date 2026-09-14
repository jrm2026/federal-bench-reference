#!/usr/bin/env node
/**
 * resolve-links.mjs — find a free public copy of the DISTRICT opinion for
 * records whose only link is appellate or unlabeled.
 *
 * Sources, in order of preference:
 *   1. GovInfo USCOURTS  — official, free, no key, deterministic package IDs
 *   2. CourtListener     — free; token raises the 5/min throttle
 *   3. Justia            — broad coverage of written district opinions
 *
 * Writes proposals to review/pending/links/. Never edits src/content directly:
 * a link change on a sitting judge's page goes through the same review gate as
 * anything else.
 *
 *   node scripts/resolve-links.mjs --district=dnj [--limit=N] [--apply-dry-run]
 *
 * Env: COURTLISTENER_TOKEN (optional), GOVINFO_API_KEY (optional, DEMO_KEY works)
 *
 * Node does not read .env on its own. Use `npm run reconcile -- --district=dnj --held`
 * or pass the flag yourself: `node --env-file=.env scripts/...`. Without it the
 * token in .env is invisible and the run silently falls back to the throttle.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2)
  .map(a => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const DISTRICT = args.district ?? 'dnj';
const LIMIT = args.limit ? Number(args.limit) : Infinity;
const CL_TOKEN = process.env.COURTLISTENER_TOKEN;
const GOVINFO_KEY = process.env.GOVINFO_API_KEY ?? 'DEMO_KEY';

const CL_COURT = { dnj: 'njd', sdny: 'nysd', edny: 'nyed' }[DISTRICT];
const GOVINFO_COURT = { dnj: 'njd', sdny: 'nysd', edny: 'nyed' }[DISTRICT];
const JUSTIA_PATH = { dnj: 'new-jersey/njdce', sdny: 'new-york/nysdce', edny: 'new-york/nyedce' }[DISTRICT];

const SRC = `src/content/districts/${DISTRICT}/opinions`;
const OUT = `review/pending/links`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** 1:23-cv-12601 -> 1_23-cv-12601 (GovInfo package suffix) */
const pkgDocket = d => d.replace(/:/g, '_');
/** 1:23-cv-12601 -> 1:2023cv12601 (Justia path form) */
function justiaDocket(d) {
  const m = d.match(/^(\d):(\d{2})-(cv|cr|md)-(\d+)$/);
  if (!m) return null;
  const [, office, yy, type, num] = m;
  return `${office}:${Number(yy) > 50 ? '19' : '20'}${yy}${type}${num}`;
}
/** A district docket looks like 3:24-cv-01098. An appellate one looks like 24-2947. */
const isDistrictDocket = d => !!d && /^\d:\d{2}-(cv|cr|md)-\d+$/.test(d);

async function getJSON(url, headers = {}) {
  const r = await fetch(url, { headers: { 'User-Agent': 'FederalBenchReference/1.0', ...headers } });
  if (r.status === 429) return { _throttled: true };
  if (!r.ok) return null;
  return r.json();
}

/** GovInfo: package id is deterministic from the docket; granules list the documents. */
async function tryGovInfo(rec) {
  if (!isDistrictDocket(rec.docket)) return null;
  const pkg = `USCOURTS-${GOVINFO_COURT}-${pkgDocket(rec.docket)}`;
  const summary = await getJSON(
    `https://api.govinfo.gov/packages/${pkg}/summary?api_key=${GOVINFO_KEY}`);
  if (!summary || summary._throttled) return summary?._throttled ? { _throttled: true } : null;
  const gran = await getJSON(
    `https://api.govinfo.gov/packages/${pkg}/granules?offset=0&pageSize=100&api_key=${GOVINFO_KEY}`);
  const list = gran?.granules ?? [];
  // prefer a granule whose title reads like an opinion or order
  const pick = list.find(g => /opinion|memorandum|order/i.test(g.title ?? '')) ?? list[0];
  if (!pick) return null;
  return {
    source: 'govinfo',
    url: `https://www.govinfo.gov/content/pkg/${pkg}/pdf/${pick.granuleId}.pdf`,
    title: pick.title ?? summary.title,
    date: summary.dateIssued ?? null,
    granules: list.length,
    verified_docket: rec.docket,
  };
}

/** CourtListener: search by docket first — caption is unreliable across appeal. */
async function tryCourtListener(rec) {
  const h = CL_TOKEN ? { Authorization: `Token ${CL_TOKEN}` } : {};
  const base = 'https://www.courtlistener.com/api/rest/v4/search/';
  const queries = [];
  if (isDistrictDocket(rec.docket))
    queries.push(`${base}?type=o&court=${CL_COURT}&docket_number=${encodeURIComponent(rec.docket)}`);
  if (rec.reporter_cite && /F\.\s*Supp/.test(rec.reporter_cite))
    queries.push(`${base}?type=o&citation=${encodeURIComponent(rec.reporter_cite)}`);
  queries.push(`${base}?type=o&court=${CL_COURT}&q=${encodeURIComponent(rec.caption)}`);
  for (const q of queries) {
    const j = await getJSON(q, h);
    if (j?._throttled) return { _throttled: true };
    const hit = j?.results?.[0];
    if (hit) return {
      source: 'courtlistener',
      url: `https://www.courtlistener.com${hit.absolute_url}`,
      title: hit.caseName, date: hit.dateFiled,
      docket_returned: hit.docketNumber, status: hit.status,
    };
    if (!CL_TOKEN) await sleep(13000); // free tier is 5/min
  }
  return null;
}

/** Justia: the docket path is deterministic; the internal case id is not, so probe. */
async function tryJustia(rec) {
  const jd = isDistrictDocket(rec.docket) ? justiaDocket(rec.docket) : null;
  if (!jd) return null;
  const url = `https://law.justia.com/cases/federal/district-courts/${JUSTIA_PATH}/${jd}/`;
  const r = await fetch(url, { headers: { 'User-Agent': 'FederalBenchReference/1.0' } });
  if (!r.ok) return null;
  const html = await r.text();
  const m = html.match(new RegExp(
    `/cases/federal/district-courts/${JUSTIA_PATH.replace('/', '\\/')}/${jd.replace(/[:]/g, '[:]')}/\\d+/\\d+/`));
  if (!m) return null;
  return { source: 'justia', url: `https://law.justia.com${m[0]}`, title: null, date: null };
}

/**
 * Some records have no district opinion because none was written — a trial, a
 * sentencing, a plea. Those need a stated line, not a link.
 */
const NO_WRITTEN_OPINION = /trial and judgment|judgment and sentencing|plea and sentencing|resentencing after remand|trial and judgment of conviction/i;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const files = readdirSync(SRC).filter(f => f.endsWith('.json'));
  const recs = files.map(f => ({ f, r: JSON.parse(readFileSync(join(SRC, f), 'utf8')) }))
    .filter(x => x.r.link_level !== 'district').slice(0, LIMIT);

  const report = { resolved: [], no_written_opinion: [], unresolved: [], throttled: 0 };

  for (const { f, r } of recs) {
    if (NO_WRITTEN_OPINION.test(r.motion_type ?? '')) {
      report.no_written_opinion.push({ id: r.id, caption: r.caption, motion_type: r.motion_type });
      continue;
    }
    let hit = null;
    for (const fn of [tryGovInfo, tryCourtListener, tryJustia]) {
      try {
        const out = await fn(r);
        if (out?._throttled) { report.throttled++; await sleep(13000); continue; }
        if (out) { hit = out; break; }
      } catch (e) { /* try the next source */ }
    }
    if (hit) {
      report.resolved.push({ id: r.id, caption: r.caption, docket: r.docket, ...hit });
      writeFileSync(join(OUT, `${r.id}.json`), JSON.stringify({
        id: r.id, file: f,
        change: { public_url: hit.url, link_level: 'district' },
        add_link: { anchor: `District opinion (${hit.source})`, url: hit.url },
        evidence: hit,
        reviewer_must_confirm: [
          'the document is the district opinion, not an appellate one',
          'the caption may differ from the appellate caption — confirm the docket matches',
          'the date matches the entry',
        ],
      }, null, 2));
    } else {
      report.unresolved.push({ id: r.id, caption: r.caption, docket: r.docket,
        reporter_cite: r.reporter_cite, current: r.links?.[0]?.anchor ?? null });
    }
  }

  writeFileSync(join(OUT, '_report.json'), JSON.stringify(report, null, 2));
  console.log(`candidates examined : ${recs.length}`);
  console.log(`resolved            : ${report.resolved.length}`);
  console.log(`no written opinion  : ${report.no_written_opinion.length}`);
  console.log(`unresolved          : ${report.unresolved.length}`);
  if (report.throttled) console.log(`throttle events     : ${report.throttled} (set COURTLISTENER_TOKEN)`);
  console.log(`\nProposals in ${OUT}/. Nothing was written to src/content.`);
}

main();
