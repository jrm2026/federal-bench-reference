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
 *   9. Advertising block — warns while the preview is closed, blocks once it opens
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
const SOURCE_HOSTS = join(CONFIG, "source-hosts.json");

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
// The host list lives in src/content/config/source-hosts.json, with the reason
// each host is on it. The judge page template reads the same file to mark a
// biography's secondary sources, so the gate and the page cannot drift.

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

// Selection justified by what an appellate court did to the judge. These read as
// neutral procedural history and land as a verdict on the judge, which is why
// they warn rather than block: the sentence may be the only honest way to state
// the posture, and a human decides whether the page can carry it.
const APPELLATE_SELECTION = [
  /\bbecause of\b[^.]{0,60}\b(reversal|revers(ed|als)|vacatur|vacated|remand)/i,
  /\b(reversed|vacated|remanded)\b[^.]{0,40}\b(three|four|five|repeatedly|multiple) times\b/i,
  /\b(three|four|five|multiple|repeated)\b[^.]{0,30}\b(reversals|vacaturs|remands)\b/i,
  /\breassigned\b[^.]{0,60}\b(to (another|a different) (judge|district judge)|after (the )?(third|second|fourth) remand)\b/i,
  /\bunusual sequence of\b[^.]{0,30}\b(appellate )?(reversals|remands)\b/i,
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
    [SOURCE_HOSTS, "src/content/config/source-hosts.json", "every source host would be unrecognised"],
  ];
  const absent = required.filter(([p]) => !existsSync(p));
  if (absent.length) {
    for (const [, name, why] of absent) err("(tree)", "fail-closed", `${name} is missing — ${why}`);
    return { errors, warnings, notes };
  }

  const poison = JSON.parse(readFileSync(POISON, "utf8"));
  const ALLOWED_HOSTS = new Set(Object.keys(JSON.parse(readFileSync(SOURCE_HOSTS, "utf8")).primary));
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
      for (const rx of APPELLATE_SELECTION) {
        if (rx.test(surface))
          warn(file, "neutrality", `selection or framing rests on appellate treatment of the judge: ${rx}. ` +
               `Accurate is not the same as publishable — read the rendered page and decide.`);
      }

      // Gate 7 — poison list
      const slug = rec.slug ?? rec.judge_slug;
      for (const p of poison.entries) {
        if (p.jurist_id && p.jurist_id !== slug) continue;
        if (new RegExp(p.pattern, "i").test(surface)) err(file, "poison", p.reason);
      }
    }

    // Gate 3 — sources, on every URL the site will render
    // A biography may rest on a secondary source, because for a magistrate
    // judge there is no primary one: FJC covers Article III judges, the court's
    // own judge page is chambers and procedures, and a judicial-milestones page
    // gives an appointment date. What the reader may not be given is an
    // unlabelled link, since the label is the disclosure. An opinion link is
    // governed separately and strictly, below.
    for (const { file, rec } of judges) {
      const srcs = rec.biography?.sources ?? [];
      const labels = rec.biography?.source_labels ?? [];
      srcs.forEach((u, i) => {
        const h = hostOf(u);
        if (!h) { err(file, "sources", `unparseable biography source '${u}'`); return; }
        if (ALLOWED_HOSTS.has(h)) return;
        if (!labels[i]?.trim())
          err(file, "sources", `secondary biography source '${h}' carries no source_label; the label is what discloses it to the reader`);
        else if (rec.office?.startsWith("magistrate"))
          notes.push(`${file} [sources] secondary biography source '${h}', labelled '${labels[i]}' and disclosed on the page`);
        else
          warn(file, "sources", `biography source host '${h}' is secondary, and this judge has an FJC entry that should carry the fact instead`);
      });
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

  // Gate 9 — the attorney advertising block. Every page renders it, so an
  // unsettled value is not a typo waiting to be noticed: it is the sponsor
  // identification appearing beside a real firm's name on all of them.
  //
  // The severity follows the launch gate rather than the record set, because
  // the exposure does. docs/LAUNCH-CHECKLIST.md puts it exactly: the password
  // stops people and the header stops crawlers, and until both are gone the
  // site is private no matter what else is true. While both hold, an unsettled
  // block is a warning nobody can miss. The moment either is removed it blocks,
  // which is the moment a reader could arrive.
  const advert = advertisingBlockState();
  if (advert.missing.length) {
    for (const name of advert.missing) {
      err("(tree)", "fail-closed", `src/content/config/${name} is missing — the advertising block cannot be checked`);
    }
  } else if (advert.unsettled.length) {
    const what = advert.unsettled.map((u) => `${u.field} is ${u.reason}`).join(", ");
    const where = "it renders in the footer of every page through src/layouts/Base.astro";
    if (advert.gated) {
      warn("src/content/config/firm.json", "advertising",
        `${what}. Not blocking while the preview gate and the noindex header both hold, but ${where}, ` +
        `beside a sponsor named in full. Settle it before either comes off — see docs/LAUNCH-CHECKLIST.md.`);
    } else {
      err("src/content/config/firm.json", "advertising",
        `${what}, and the launch gate is down (${advert.openedBy.join("; ")}), so ${where}. ` +
        `The advertising block does compliance work and a page carrying a placeholder in it is worse than no page.`);
    }
  }

  return { errors, warnings, notes };
}

// --- Gate 9 helpers --------------------------------------------------------

/** A value nobody has filled in: absent, blank, or a [bracketed] stand-in. */
const isUnsettled = (v) =>
  v == null || String(v).trim() === "" ? "empty" :
  /^\s*[\[<{].*[\]>}]\s*$/.test(String(v)) || /REPLACE[-_ ]WITH/i.test(String(v)) ? "a placeholder" :
  null;

/**
 * Strip JSONC comments without touching the inside of a string. A naive
 * line-strip would be wrong here for a reason specific to this file: the
 * comments in wrangler.jsonc discuss `main` and `run_worker_first` at length,
 * so a check that cannot tell prose from configuration would read the
 * explanation of the gate as the gate itself and report it present after
 * someone deleted it.
 */
function stripJsonc(text) {
  let out = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      out += c;
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; out += c; continue; }
    if (c === "/" && text[i + 1] === "/") { while (i < text.length && text[i] !== "\n") i++; out += "\n"; continue; }
    if (c === "/" && text[i + 1] === "*") { i += 2; while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++; i++; continue; }
    out += c;
  }
  return out;
}

function advertisingBlockState() {
  const firmPath = join(CONFIG, "firm.json");
  const curatorPath = join(CONFIG, "curator.json");
  const missing = [
    !existsSync(firmPath) && "firm.json",
    !existsSync(curatorPath) && "curator.json",
  ].filter(Boolean);
  if (missing.length) return { missing, unsettled: [], gated: true, openedBy: [] };

  const firm = JSON.parse(readFileSync(firmPath, "utf8"));
  const curator = JSON.parse(readFileSync(curatorPath, "utf8"));

  // Per-district overrides win, so a district that fills in its own address is
  // settled even where the base is not. Report a field once when every district
  // inherits the same unsettled base value, and name districts only where they
  // actually differ — otherwise one blank address in base reads as three faults.
  const districts = Object.keys(firm.districts ?? {});
  const scopes = districts.length ? districts : ["base"];
  const unsettled = [];
  for (const field of ["sponsor_name", "address", "phone", "advertising_label", "disclaimer"]) {
    const byValue = new Map();
    for (const d of scopes) {
      const value = (firm.districts?.[d] ?? {})[field] ?? firm.base?.[field];
      const reason = isUnsettled(value);
      if (!reason) continue;
      const key = `${reason} ${value ?? ""}`;
      if (!byValue.has(key)) byValue.set(key, { reason, districts: [] });
      byValue.get(key).districts.push(d);
    }
    for (const { reason, districts: ds } of byValue.values()) {
      const scoped = ds.length === scopes.length ? field : `${ds.join("/")}.${field}`;
      unsettled.push({ field: scoped, reason });
    }
  }
  for (const field of ["curator_name", "role_phrase"]) {
    const reason = isUnsettled(curator[field]);
    if (reason) unsettled.push({ field: `curator.${field}`, reason });
  }

  // Is the site still closed? Two independent halves, either of which being
  // gone means a reader can arrive.
  const openedBy = [];
  const headersPath = join(ROOT, "public", "_headers");
  if (!existsSync(headersPath) || !/^\s*X-Robots-Tag\s*:.*\bnoindex\b/im.test(readFileSync(headersPath, "utf8"))) {
    openedBy.push("public/_headers no longer sets X-Robots-Tag: noindex");
  }
  const wranglerPath = join(ROOT, "wrangler.jsonc");
  if (existsSync(wranglerPath)) {
    let cfg = null;
    try { cfg = JSON.parse(stripJsonc(readFileSync(wranglerPath, "utf8"))); } catch { /* handled below */ }
    if (!cfg) openedBy.push("wrangler.jsonc could not be parsed, so the preview gate cannot be confirmed");
    else if (!cfg.main || cfg.assets?.run_worker_first !== true) {
      openedBy.push("wrangler.jsonc no longer runs the preview gate in front of the assets");
    }
  } else {
    openedBy.push("wrangler.jsonc is missing, so the preview gate cannot be confirmed");
  }

  return { missing, unsettled, gated: openedBy.length === 0, openedBy };
}
