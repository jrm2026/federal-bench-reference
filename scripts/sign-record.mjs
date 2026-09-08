#!/usr/bin/env node
/**
 * Record the curator's sign-off on one judge record.
 *
 *   node scripts/sign-record.mjs renee-marie-bumb --reviewer "Jay R. McDaniel"
 *   node scripts/sign-record.mjs --verify-all
 *
 * The sign-off is bound to a hash of the record's publishable content:
 * biography, opinions, headnotes, links, postures. Editing any of that after
 * signing breaks the hash, the sign-off lapses, and the gate blocks the build.
 * Editorial metadata and notes are excluded, so a correction note can be
 * revised without invalidating a sign-off on the substance.
 *
 * This tool only writes the ledger. It does not read your mind about whether
 * you actually read the page.
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const JUDGES = join(HERE, "..", "data", "judges");
const LEDGER = join(HERE, "..", "data", "signoffs.json");

// Fields a curator is attesting to. Anything not listed here can change
// without lapsing a sign-off.
const SIGNED_KEYS = new Set([
  "canonical_name", "office", "vicinage", "official_profile_url",
  "biography", "significant_opinions", "matter_relevant_opinions",
]);
const EXCLUDED = new Set([
  "notes", "research_lead", "reviewer", "review_date",
  "verification_status", "status_checked", "roster_checked",
]);

/** Stable, key-sorted projection of the publishable content. */
export function canonicalize(node, key = null) {
  if (EXCLUDED.has(key)) return undefined;
  if (node === null || node === undefined) return null;
  if (Array.isArray(node)) return node.map((n) => canonicalize(n)).filter((n) => n !== undefined);
  if (typeof node === "object") {
    const out = {};
    for (const k of Object.keys(node).sort()) {
      const v = canonicalize(node[k], k);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  return node;
}

export function contentHash(record) {
  const subset = {};
  for (const k of [...SIGNED_KEYS].sort()) {
    const v = canonicalize(record[k], k);
    if (v !== undefined) subset[k] = v;
  }
  return createHash("sha256").update(JSON.stringify(subset)).digest("hex").slice(0, 16);
}

// Only run the CLI when invoked directly. validate-content.mjs imports
// contentHash from this file and must not trigger argument parsing.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (!isMain) { /* imported as a module */ }

const args = isMain ? process.argv.slice(2) : [];

if (isMain && args.includes("--verify-all")) {
  const ledger = JSON.parse(readFileSync(LEDGER, "utf8"));
  let lapsed = 0, ok = 0;
  for (const [jid, entry] of Object.entries(ledger.signoffs)) {
    let rec;
    try { rec = JSON.parse(readFileSync(join(JUDGES, `${jid}.json`), "utf8")); }
    catch { console.log(`  ? ${jid}: signed but no record present`); lapsed++; continue; }
    const h = contentHash(rec);
    if (h === entry.content_hash) { ok++; }
    else { console.log(`  ! ${jid}: LAPSED — signed ${entry.content_hash}, now ${h}`); lapsed++; }
  }
  console.log(`\n${ok} sign-off(s) current, ${lapsed} lapsed`);
  process.exit(lapsed ? 1 : 0);
}

const jid = args[0];
const rIdx = args.indexOf("--reviewer");
const reviewer = rIdx > -1 ? args[rIdx + 1] : null;

if (isMain && (!jid || !reviewer)) {
  console.error('usage: node scripts/sign-record.mjs <jurist_id> --reviewer "Name"');
  console.error("       node scripts/sign-record.mjs --verify-all");
  process.exit(2);
}

if (!isMain) { /* module consumers stop here */ } else {
const ledger = JSON.parse(readFileSync(LEDGER, "utf8"));
if (!ledger.curators.includes(reviewer)) {
  console.error(`"${reviewer}" is not listed in signoffs.json curators.`);
  console.error("Adding a curator is itself a reviewed change to a CODEOWNERS-protected file.");
  process.exit(1);
}

const path = join(JUDGES, `${jid}.json`);
const record = JSON.parse(readFileSync(path, "utf8"));
const hash = contentHash(record);

const opinions = [
  ...(record.significant_opinions || []),
  ...Object.values(record.matter_relevant_opinions || {}).flat(),
];

console.log(`\nSigning: ${record.canonical_name}`);
console.log(`  office     ${record.office}, ${record.vicinage}`);
console.log(`  biography  ${record.biography?.text ? "drafted" : "EMPTY"}`);
console.log(`  opinions   ${opinions.length}`);
for (const o of opinions) {
  const w = (o.headnote || "").trim().split(/\s+/).filter(Boolean).length;
  console.log(`             - ${o.caption} (${w} words)`);
}
console.log(`  hash       ${hash}\n`);
console.log("You are attesting that you read the rendered page and that its selection");
console.log("does not imply a tendency. The gate cannot check either.\n");

ledger.signoffs[jid] = {
  reviewer,
  date: new Date().toISOString().slice(0, 10),
  content_hash: hash,
};

writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + "\n");
console.log(`Recorded. Commit data/signoffs.json on its own, separately from content.`);
}
