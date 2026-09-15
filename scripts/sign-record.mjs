#!/usr/bin/env node
/**
 * Record the curator's sign-off on one judge, and verify the ledger.
 *
 *   node scripts/sign-record.mjs renee-marie-bumb --reviewer "Jay R. McDaniel"
 *   node scripts/sign-record.mjs --verify-all
 *
 * A sign-off is bound to a sha256 of everything about that judge a reader can
 * see: the biography, and every opinion record keyed to the slug — captions,
 * citations, links, ruling statements, treatment notes, tags. Edit any of it
 * after signing and the hash stops matching, the sign-off lapses, and
 * scripts/validate.mjs reports it.
 *
 * Scores, bands, screen components and the workflow dates are excluded. They
 * are stored and never rendered, so re-scoring a decision does not lapse a
 * sign-off on the substance, and a correction note can be reworded freely.
 *
 * The authority lives here rather than in a field inside the record because a
 * field inside the record is self-reported: an automated process with write
 * access to src/content can type any name into it. This ledger is CODEOWNERS-
 * protected, which is the whole point of the indirection.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DISTRICTS = join(ROOT, "src", "content", "districts");
const LEDGER = join(ROOT, "src", "content", "config", "signoffs.json");

// What the curator is attesting to on the judge record.
const JUDGE_SIGNED = [
  "name", "office", "vicinage", "role_line", "record_status",
  "record_status_note", "biography", "other_writings",
];

// What the curator is attesting to on each opinion record.
const OPINION_SIGNED = [
  "caption", "citation_line", "docket", "reporter_cite", "court", "tier",
  "document_type", "rr_disposition", "headnote_district_ruling",
  "qualification_rationale", "appellate_posture_note", "public_url", "links",
  "subject_primary", "subject_secondary", "procedural_tags", "subject_label",
];

// Workflow metadata and unrendered scoring. Changing these never lapses a
// sign-off, because a reader never sees them.
const EXCLUDED = new Set([
  "research_cutoff", "status_checked", "last_verified", "classification_pass",
  "headnote_status", "score_total", "components", "screen_score",
  "screen_components", "classification", "screen_classification",
]);

/** Stable, key-sorted projection with workflow metadata stripped. */
function canonicalize(node, key = null) {
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

function pick(record, keys) {
  const out = {};
  for (const k of [...keys].sort()) {
    const v = canonicalize(record[k], k);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/** Every district that carries a judges/ directory. */
export function districts() {
  if (!existsSync(DISTRICTS)) return [];
  return readdirSync(DISTRICTS).filter((d) => existsSync(join(DISTRICTS, d, "judges")));
}

/** Load one judge and the opinions keyed to that slug, across all districts. */
export function loadJudge(slug) {
  for (const d of districts()) {
    const path = join(DISTRICTS, d, "judges", `${slug}.json`);
    if (!existsSync(path)) continue;
    const judge = JSON.parse(readFileSync(path, "utf8"));
    const odir = join(DISTRICTS, d, "opinions");
    const opinions = existsSync(odir)
      ? readdirSync(odir)
          .map((f) => JSON.parse(readFileSync(join(odir, f), "utf8")))
          .filter((o) => o.judge_slug === slug)
          .sort((a, b) => a.id.localeCompare(b.id))
      : [];
    return { district: d, judge, opinions };
  }
  return null;
}

/** The hash a sign-off is bound to: the judge, plus every opinion on the page. */
export function contentHash({ judge, opinions }) {
  const subject = {
    judge: pick(judge, JUDGE_SIGNED),
    opinions: opinions.map((o) => ({ id: o.id, ...pick(o, OPINION_SIGNED) })),
  };
  return createHash("sha256").update(JSON.stringify(subject)).digest("hex").slice(0, 16);
}

/** Ledger state for every judge in the tree. Used by the gate and by --verify-all. */
export function auditLedger() {
  const ledger = JSON.parse(readFileSync(LEDGER, "utf8"));
  const rows = [];
  for (const d of districts()) {
    for (const f of readdirSync(join(DISTRICTS, d, "judges"))) {
      const slug = f.replace(/\.json$/, "");
      const loaded = loadJudge(slug);
      if (!loaded) continue;
      const entry = ledger.signoffs[slug];
      const hash = contentHash(loaded);
      rows.push({
        slug,
        district: d,
        name: loaded.judge.name,
        hash,
        state: !entry ? "unsigned" : entry.content_hash === hash ? "current" : "lapsed",
        signed: entry ?? null,
      });
    }
  }
  for (const slug of Object.keys(ledger.signoffs)) {
    if (!rows.some((r) => r.slug === slug)) {
      rows.push({ slug, district: null, name: slug, hash: null, state: "orphaned", signed: ledger.signoffs[slug] });
    }
  }
  return rows.sort((a, b) => a.slug.localeCompare(b.slug));
}

// ---------------------------------------------------------------------------
// CLI. validate.mjs imports auditLedger from this file and must not trigger it.

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const args = process.argv.slice(2);

  if (args.includes("--verify-all")) {
    const rows = auditLedger();
    const by = (s) => rows.filter((r) => r.state === s);
    for (const r of rows) {
      const mark = { current: "ok", lapsed: " !", unsigned: "  ", orphaned: " ?" }[r.state];
      const detail =
        r.state === "lapsed" ? `LAPSED — signed ${r.signed.content_hash}, now ${r.hash}`
        : r.state === "orphaned" ? "signed but no record in the tree"
        : r.state === "current" ? `${r.signed.reviewer}, ${r.signed.date}`
        : "not signed";
      console.log(`  ${mark} ${r.slug.padEnd(28)} ${detail}`);
    }
    console.log(
      `\n${by("current").length} current, ${by("lapsed").length} lapsed, ` +
      `${by("unsigned").length} unsigned, ${by("orphaned").length} orphaned`,
    );
    // A lapsed or orphaned entry is a defect in the ledger. An unsigned record
    // is the expected state before launch; docs/LAUNCH-CHECKLIST.md governs
    // when that becomes blocking.
    process.exit(by("lapsed").length + by("orphaned").length ? 1 : 0);
  }

  const slug = args[0];
  const rIdx = args.indexOf("--reviewer");
  const reviewer = rIdx > -1 ? args[rIdx + 1] : null;

  if (!slug || !reviewer) {
    console.error('usage: node scripts/sign-record.mjs <slug> --reviewer "Name"');
    console.error("       node scripts/sign-record.mjs --verify-all");
    process.exit(2);
  }

  const ledger = JSON.parse(readFileSync(LEDGER, "utf8"));
  if (!ledger.curators.includes(reviewer)) {
    console.error(`"${reviewer}" is not listed in signoffs.json curators.`);
    console.error("Adding a curator is itself a reviewed change to a CODEOWNERS-protected file.");
    process.exit(1);
  }

  const loaded = loadJudge(slug);
  if (!loaded) {
    console.error(`No judge record for '${slug}' in any district.`);
    process.exit(1);
  }

  const { judge, opinions, district } = loaded;
  const hash = contentHash(loaded);

  console.log(`\nSigning: ${judge.name}  (${district})`);
  console.log(`  role       ${judge.role_line ?? judge.office}`);
  console.log(`  biography  ${judge.biography?.text ? `${judge.biography.confidence}` : "ABSENT"}`);
  console.log(`  decisions  ${opinions.length}`);
  for (const o of opinions) {
    const words = (o.headnote_district_ruling || "").trim().split(/\s+/).filter(Boolean).length;
    console.log(`             - ${o.caption} (${words} words, ${o.headnote_status})`);
  }
  console.log(`  hash       ${hash}\n`);
  console.log("You are attesting that you read the rendered page and that its selection");
  console.log("does not imply a tendency. The gate cannot check either.\n");

  ledger.signoffs[slug] = {
    reviewer,
    date: new Date().toISOString().slice(0, 10),
    content_hash: hash,
  };

  writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + "\n");
  console.log("Recorded. Commit src/content/config/signoffs.json on its own,");
  console.log("separately from the content it signs.");
}
