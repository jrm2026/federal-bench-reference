#!/usr/bin/env node
/**
 * Resolve every URL in the content tree and capture an archive copy.
 *
 *   node scripts/check-links.mjs                 # check only
 *   node scripts/check-links.mjs --archive       # also request Wayback captures
 *   node scripts/check-links.mjs --concurrency 4
 *
 * Requires open network access. Will not run in a restricted sandbox; run it
 * from the desktop.
 *
 * Why this exists: the review gate checks the HOST of an opinion link, not
 * whether it resolves. GovInfo package URLs of the form
 * USCOURTS-njd-2_15-cv-01116-4.pdf are brittle — the trailing sequence number
 * is not stable and a document added to a case can renumber the others. A dead
 * link on a judge page is the most visible possible failure and the easiest to
 * prevent.
 *
 * A failed request is not automatically a dead document, and the difference
 * decides whether there is any work to do:
 *
 *   dead         the origin answered and the document is gone (404, 410)
 *   blocked      something refused the request (401, 403, 407, 429). Court and
 *                agency hosts throttle robots, and an egress proxy answers 403
 *                to the CONNECT itself, which looks identical from here
 *   unreachable  no answer at all: DNS, TLS, reset, timeout
 *
 * Only dead links block publication. Blocked and unreachable mean the run was
 * inconclusive and has to be repeated with open network access, which is what
 * docs/HANDOFF.md section 5 asks for.
 *
 * Writes data/link-report.json. Exits 1 if anything is dead, 2 if the run was
 * inconclusive, 0 if every URL resolved.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const JUDGES = join(HERE, "..", "data", "judges");
const REPORT = join(HERE, "..", "data", "link-report.json");

const ARCHIVE = process.argv.includes("--archive");
const cIdx = process.argv.indexOf("--concurrency");
const CONCURRENCY = cIdx > -1 ? Number(process.argv[cIdx + 1]) : 3;
const TIMEOUT_MS = 30000;

/** Every URL in the tree, with enough context to fix it when it breaks. */
function collect() {
  const targets = [];
  for (const file of readdirSync(JUDGES).filter((f) => f.endsWith(".json"))) {
    const r = JSON.parse(readFileSync(join(JUDGES, file), "utf8"));
    const push = (url, where) => { if (url) targets.push({ jurist_id: r.jurist_id, where, url }); };

    push(r.official_profile_url, "official_profile_url");
    push(r.biography?.source_url, "biography.source_url");
    push(r.status?.source_url, "status.source_url");
    for (const [k, v] of Object.entries(r.practice_information || {})) {
      if (typeof v === "string" && v.startsWith("http")) push(v, `practice_information.${k}`);
    }
    const opinions = [
      ...(r.significant_opinions || []),
      ...Object.values(r.matter_relevant_opinions || {}).flat(),
    ];
    for (const o of opinions) {
      push(o.public_url, `opinion "${o.caption}"`);
      for (const ah of o.appellate_history || []) push(ah.url, `appellate history for "${o.caption}"`);
    }
  }
  // De-duplicate by URL, keeping every reference so a break lists all pages hit.
  const byUrl = new Map();
  for (const t of targets) {
    if (!byUrl.has(t.url)) byUrl.set(t.url, { url: t.url, refs: [] });
    byUrl.get(t.url).refs.push({ jurist_id: t.jurist_id, where: t.where });
  }
  return [...byUrl.values()];
}

async function fetchWithTimeout(url, opts = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try { return await fetch(url, { ...opts, signal: ac.signal, redirect: "follow" }); }
  finally { clearTimeout(t); }
}

async function check(item) {
  const out = { ...item, status: null, final_url: null, ok: false, archive_url: null, error: null };
  try {
    // HEAD first; several government hosts refuse it, so fall back to a ranged GET.
    let res = await fetchWithTimeout(item.url, { method: "HEAD" });
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await fetchWithTimeout(item.url, { method: "GET", headers: { Range: "bytes=0-2048" } });
    }
    out.status = res.status;
    out.final_url = res.url;
    out.ok = res.ok || res.status === 206;
    if (out.ok && out.final_url !== item.url) out.redirected = true;
  } catch (e) {
    out.error = e.name === "AbortError" ? "timeout" : String(e.message || e);
  }

  // A 403 survives the ranged-GET fallback above when the refusal is a robot
  // policy or an egress proxy rather than the document being gone. Say so
  // rather than reporting a live opinion as dead.
  out.result = out.ok ? "ok"
    : out.status == null ? "unreachable"
    : [401, 403, 407, 429].includes(out.status) ? "blocked"
    : "dead";

  if (ARCHIVE && out.ok) {
    try {
      const res = await fetchWithTimeout(`https://web.archive.org/save/${item.url}`, { method: "GET" });
      const loc = res.headers.get("content-location") || res.headers.get("location");
      if (loc) out.archive_url = loc.startsWith("http") ? loc : `https://web.archive.org${loc}`;
      else if (res.url?.includes("web.archive.org")) out.archive_url = res.url;
    } catch { out.archive_note = "archive request failed; retry later"; }
  }
  return out;
}

async function run() {
  const items = collect();
  if (items.length === 0) {
    console.log("no URLs found in the content tree");
    return 0;
  }
  console.log(`checking ${items.length} unique URL(s), concurrency ${CONCURRENCY}${ARCHIVE ? ", archiving" : ""}\n`);

  const results = [];
  let i = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) {
      const item = items[i++];
      const r = await check(item);
      results.push(r);
      const mark = r.ok ? (r.redirected ? "»" : "✓") : r.result === "dead" ? "✗" : "?";
      console.log(`  ${mark} ${r.status ?? r.error}  ${r.url}`);
      if (!r.ok) for (const ref of r.refs) console.log(`        ${ref.jurist_id} — ${ref.where}`);
      if (ARCHIVE) await new Promise((s) => setTimeout(s, 1500)); // be polite to the archive
    }
  });
  await Promise.all(workers);

  const dead = results.filter((r) => r.result === "dead");
  const blocked = results.filter((r) => r.result === "blocked");
  const unreachable = results.filter((r) => r.result === "unreachable");
  const inconclusive = blocked.length + unreachable.length;
  const redirected = results.filter((r) => r.ok && r.redirected);

  writeFileSync(REPORT, JSON.stringify({
    checked_at: new Date().toISOString(),
    archived: ARCHIVE,
    total: results.length,
    dead: dead.length,
    blocked: blocked.length,
    unreachable: unreachable.length,
    redirected: redirected.length,
    results: results.sort((a, b) => a.url.localeCompare(b.url)),
  }, null, 2) + "\n");

  console.log(`\n${results.length} checked, ${dead.length} dead, ${inconclusive} inconclusive, ${redirected.length} redirected`);
  console.log(`report: data/link-report.json`);
  if (redirected.length) {
    console.log("\nRedirects are not failures, but a redirected opinion URL should be");
    console.log("replaced with its final form so the stored citation is stable.");
  }
  if (dead.length) {
    console.log("\nDead links block publication. For a GovInfo package URL, the usual cause");
    console.log("is a renumbered document within the case; find the current sequence number");
    console.log("on the case's GovInfo package page rather than guessing.");
  }
  if (inconclusive && !results.some((r) => r.ok)) {
    console.log("\nNothing resolved, on any host. That is the network, not the content: an");
    console.log("egress proxy answering 403 to CONNECT produces exactly this result. Run the");
    console.log("check from a machine with open access to the courts, GovInfo and the FJC.");
    console.log("docs/HANDOFF.md section 5 covers it. This run proves nothing either way.");
  } else if (inconclusive) {
    console.log(`\n${inconclusive} URL(s) neither resolved nor answered as gone. Government hosts`);
    console.log("throttle automated requests, so retry these by hand or at lower concurrency");
    console.log("before treating any of them as a broken link.");
  }
  return dead.length ? 1 : inconclusive ? 2 : 0;
}

process.exit(await run());
