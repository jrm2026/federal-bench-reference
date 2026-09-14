#!/usr/bin/env node
/**
 * Compliance gates. scripts/validate.mjs checks that the data is well formed;
 * this checks that what a reader will see is allowed to be published.
 *
 *   1. Fail closed      — a missing gate file stops the run, never a gate
 *   2. Westlaw firewall — no subscription research service in reader-facing text
 *   3. Sources          — opinion and biography links resolve to free public hosts
 *   4. Tone             — language characterising the judge rather than the holding
 *   5. Neutrality       — tallies and outcome-based selection language
 *   6. Appellate currency — a disturbed posture needs a status check in the window
 *   7. Poison list      — a fact once corrected may never reappear
 *   8. Sign-off ledger  — reported; blocking only under --require-signoffs
 *
 * These are the gates that carried over from the review scaffold. They exist
 * because the site's premise is RPC 8.4(e) and 8.2 compliance: it describes
 * what a judge has done and never what a judge will do.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { auditLedger } from "./sign-record.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CONFIG = join(ROOT, "src", "content", "config");
const POISON = join(CONFIG, "poison-list.json");
const LEDGER = join(CONFIG, "signoffs.json");

// --- Gate 2: subscription research services --------------------------------
// "headnote" is our own field name for a summary written from the public
// opinion. It is not a firewall term.
const FIREWALL = [
  /\bwestlaw\b/i, /\bkeycite\b/i, /\bthomson\s+reuters\b/i,
  /\bwest\s+key\s*number/i, /\bwest\s+headnote/i, /\bcase\s+synopsis\b/i,
  /\blexis(nexis)?\b/i, /\bshepard'?s\b/i,
  /\bbloomberg\s+law\b/i, /\bpractical\s+law\b/i,
];

// --- Gate 3: where an opinion or a biography may be sourced from -----------
const ALLOWED_HOSTS = new Set([
  "www.govinfo.gov", "govinfo.gov",
  "www.courtlistener.com", "courtlistener.com", "storage.courtlistener.com",
  "law.justia.com", "cases.justia.com", "docs.justia.com", "dockets.justia.com",
  "supreme.justia.com",
  "www.uscourts.gov", "uscourts.gov",
  "www2.ca3.uscourts.gov", "www.ca3.uscourts.gov", "www.njd.uscourts.gov",
  "www.cafc.uscourts.gov",
  "www.fjc.gov", "fjc.gov",
  "www.supremecourt.gov",
  "ecf.njd.uscourts.gov",
]);

// --- Gate 4: characterising the judge, not the holding ---------------------
const TONE = [
  /\bthe judge (is|was|tends|prefers|favou?rs|leans)\b/i,
  /\b(known|noted|reputed) for\b/i,
  /\b(tends|likely|inclined|disposed) to (rule|grant|deny|side)\b/i,
  /\b(plaintiff|defen[cs]e|defendant)[- ]friendly\b/i,
  /\b(pro|anti)-(plaintiff|defendant|business|employee|employer)\b/i,
  /\b(harsh|lenient|sympathetic|hostile|receptive|skeptical) (to|toward|towards)\b/i,
  /\b(conservative|liberal|activist) judge\b/i,
  /\b(usually|typically|generally|rarely|often) (grants|denies|rules|sides)\b/i,
  /\byour (odds|chances)\b/i,
  /\bhow (this|the) judge will\b/i,
  /\bpredict(s|ed|ing|ion|ive|ability)?\b[^.\n]{0,40}\b(judge|court|ruling|outcome|decision)\b/i,
  /\b(judge|court)\b[^.\n]{0,40}\bpredict/i,
];

// --- Gate 5: a tally is a prediction wearing the costume of a fact ---------
const TALLY = [
  /\b(granted|denied|dismissed|ruled|sided)\b[^.]{0,40}\b\d+\s+(of|out of)\s+\d+/i,
  /\bgrant(ed)?\s+rate\b/i, /\bdenial\s+rate\b/i, /\breversal\s+rate\b/i,
  /\bin\s+\d+\s+of\s+(the\s+)?\d+\s+(cases|motions|opinions)\b/i,
  /\b\d{1,3}\s?(%|percent)\s+of\s+(the\s+)?(time|cases|motions)\b/i,
  /\b(most|majority)\s+of\s+the\s+time\b/i,
  /\bstatistic(s|ally)\b[^.]{0,40}\bjudge\b/i,
];
const OUTCOME_SELECTION = [
  /\bselected\b[^.]{0,60}\b(because|where)\b[^.]{0,60}\b(granted|denied|won|lost|favou?red)\b/i,
  /\bcases? (in )?which (the|this) (judge|court) (granted|denied|sided)\b/i,
];

// --- Gate 6 ----------------------------------------------------------------
const DISTURBED = /(vacat|revers|remand|stay|withdraw|supersed|abrogat|cert(iorari)? granted)/i;

// Editorial metadata. A correction must be able to name the error it corrects,
// and a rationale must be able to say why an entry qualified, so these fields
// are excluded from content scanning.
const META_KEYS = new Set([
  "reason", "purpose", "_purpose", "_why_it_is_separate", "_how_to_sign",
  "record_status_note", "source_note", "taxonomy_gap", "corrected_on",
  "subject_screen_exclusion_reason", "classification_pass",
]);

/** Concatenate every string value that could reach a reader. */
function readerFacingText(node, key = null) {
  if (node == null) return "";
  if (META_KEYS.has(key)) return "";
  if (typeof node === "string") return node + "\n";
  if (Array.isArray(node)) return node.map((n) => readerFacingText(n)).join("");
  if (typeof node === "object") {
    return Object.entries(node).map(([k, v]) => readerFacingText(v, k)).join("");
  }
  return "";
}

const daysSince = (iso) => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Infinity : Math.floor((Date.now() - t) / 86400000);
};

function hostOf(url) {
  try { return new URL(url).hostname; } catch { return null; }
}

/**
 * Run the compliance gates.
 * @param {{ staleDays?: number, requireSignoffs?: boolean }} opts
 * @returns {{ errors: string[], warnings: string[], notes: string[] }}
 */
export function runComplianceGates(opts = {}) {
  const staleDays = opts.staleDays ?? 45;
  const errors = [];
  const warnings = [];
  const notes = [];
  const err = (where, gate, msg) => errors.push(`${where} [${gate}] ${msg}`);
  const warn = (where, gate, msg) => warnings.push(`${where} [${gate}] ${msg}`);

  // Gate 1 — fail closed. A tree that arrives without its gate files once
  // printed "passed" while the gates that matter were skipped outright. A green
  // light from a gate with its checks removed is worse than a red one.
  const required = [
    [POISON, "src/content/config/poison-list.json", "the poison list has nothing to check against"],
    [LEDGER, "src/content/config/signoffs.json", "sign-off authority cannot be checked"],
  ];
  const absent = required.filter(([p]) => !existsSync(p));
  if (absent.length) {
    for (const [, name, why] of absent) err("(tree)", "fail-closed", `${name} is missing — ${why}`);
    return { errors, warnings, notes };
  }

  const poison = JSON.parse(readFileSync(POISON, "utf8"));
  const districtsRoot = join(ROOT, "src", "content", "districts");
  const districts = existsSync(districtsRoot)
    ? readdirSync(districtsRoot).filter((d) => existsSync(join(districtsRoot, d, "judges")))
    : [];

  for (const d of districts) {
    const jdir = join(districtsRoot, d, "judges");
    const odir = join(districtsRoot, d, "opinions");
    const judges = readdirSync(jdir).map((f) => ({
      file: `${d}/judges/${f}`,
      rec: JSON.parse(readFileSync(join(jdir, f), "utf8")),
    }));
    const opinions = existsSync(odir)
      ? readdirSync(odir).map((f) => ({
          file: `${d}/opinions/${f}`,
          rec: JSON.parse(readFileSync(join(odir, f), "utf8")),
        }))
      : [];

    for (const { file, rec } of [...judges, ...opinions]) {
      const surface = readerFacingText(rec);

      // Gate 2 — Westlaw firewall
      for (const rx of FIREWALL) {
        if (rx.test(surface)) err(file, "firewall", `subscription research service named in reader-facing content: ${rx}`);
      }

      // Gate 4 — tone
      for (const rx of TONE) {
        if (rx.test(surface)) err(file, "tone", `characterises the judge rather than the holding: ${rx}`);
      }

      // Gate 5 — neutrality
      for (const rx of [...TALLY, ...OUTCOME_SELECTION]) {
        if (rx.test(surface)) err(file, "neutrality", `tally or outcome-based selection language: ${rx}`);
      }

      // Gate 7 — poison list
      const slug = rec.slug ?? rec.judge_slug;
      for (const p of poison.entries) {
        if (p.jurist_id && p.jurist_id !== slug) continue;
        if (new RegExp(p.pattern, "i").test(surface)) err(file, "poison", p.reason);
      }
    }

    // Gate 3 — sources, on every URL the site will render
    for (const { file, rec } of judges) {
      for (const u of rec.biography?.sources ?? []) {
        const h = hostOf(u);
        if (!h) { err(file, "sources", `unparseable biography source '${u}'`); continue; }
        if (!ALLOWED_HOSTS.has(h)) warn(file, "sources", `biography source host '${h}' is outside the free-public-source list`);
      }
    }
    for (const { file, rec } of opinions) {
      const urls = [rec.public_url, ...(rec.links ?? []).map((l) => l.url)].filter(Boolean);
      for (const u of urls) {
        const h = hostOf(u);
        if (!h) { err(file, "sources", `unparseable link '${u}'`); continue; }
        if (!ALLOWED_HOSTS.has(h)) err(file, "sources", `link host '${h}' is not a free public repository`);
      }

      // Gate 6 — appellate currency. A vacated, reversed, stayed or remanded
      // posture moves while the repository sits still.
      const posture = rec.appellate_posture_note ?? "";
      if (DISTURBED.test(posture)) {
        const checked = rec.status_checked ?? rec.last_verified;
        if (!checked) err(file, "currency", "disturbed appellate posture with no status check date");
        else if (daysSince(checked) > staleDays)
          err(file, "currency", `disturbed posture last checked ${checked}, ${daysSince(checked)} days ago (window ${staleDays})`);
      }
    }
  }

  // Gate 8 — sign-off ledger. Lapsed and orphaned entries are defects and
  // block. Unsigned records are the expected state before launch; making that
  // blocking is a launch-checklist decision, not a build one.
  const rows = auditLedger();
  const lapsed = rows.filter((r) => r.state === "lapsed");
  const orphaned = rows.filter((r) => r.state === "orphaned");
  const unsigned = rows.filter((r) => r.state === "unsigned");
  for (const r of lapsed) err(`${r.district}/judges/${r.slug}.json`, "signoff", `sign-off lapsed — signed ${r.signed.content_hash}, content now ${r.hash}`);
  for (const r of orphaned) err("src/content/config/signoffs.json", "signoff", `'${r.slug}' is signed but no record exists`);
  if (unsigned.length) {
    const line = `${unsigned.length} of ${rows.length} judge pages carry no curator sign-off`;
    if (opts.requireSignoffs) err("(tree)", "signoff", line);
    else notes.push(`${line}. docs/LAUNCH-CHECKLIST.md governs when this blocks; --require-signoffs blocks now.`);
  }

  return { errors, warnings, notes };
}
