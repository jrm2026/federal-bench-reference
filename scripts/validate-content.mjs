#!/usr/bin/env node
/**
 * Federal Bench Reference — build-time review gate.
 *
 * Run before every build. Exit code 1 blocks the build.
 *
 *   node scripts/validate-content.mjs [--stale-days 45]
 *
 * Seven gates, in order of severity:
 *   1. Schema          — required structural fields present
 *   2. Review gate     — nothing publishes without a named reviewer and date
 *   3. Westlaw firewall— no subscription-service editorial content anywhere
 *   4. Source allowlist— opinion links resolve to official or neutral free repositories
 *   5. Tone check      — language characterising a judge rather than a holding
 *   6. Appellate       — disturbed rulings need a recent status check
 *   7. Poison list     — facts known to be wrong may never reappear
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { contentHash } from "./sign-record.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const JUDGES = join(HERE, "..", "data", "judges");
const POISON = join(HERE, "..", "data", "poison-list.json");
const TAXONOMY = join(HERE, "..", "data", "taxonomy.json");
const LEDGER = join(HERE, "..", "data", "signoffs.json");

const argIdx = process.argv.indexOf("--stale-days");
const STALE_DAYS = argIdx > -1 ? Number(process.argv[argIdx + 1]) : 45;

const errors = [];
const warnings = [];

const err = (file, gate, msg) => errors.push(`${file} [${gate}] ${msg}`);
const warn = (file, gate, msg) => warnings.push(`${file} [${gate}] ${msg}`);

// --- Gate 3: subscription research services --------------------------------
// Note: "headnote" is our own field name for original 250-500 word summaries
// written from the public opinion. It is not a firewall term.
const FIREWALL = [
  /\bwestlaw\b/i, /\bkeycite\b/i, /\bthomson\s+reuters\b/i,
  /\bwest\s+key\s*number/i, /\bwest\s+headnote/i, /\bcase\s+synopsis\b/i,
  /\blexis(nexis)?\b/i, /\bshepard'?s\b/i,
  /\bbloomberg\s+law\b/i, /\bpractical\s+law\b/i,
];

// Editorial metadata. Corrections must be able to name the error they correct,
// so these fields are excluded from content scanning.
const META_KEYS = new Set([
  "notes", "reason", "purpose", "research_lead", "selection_basis",
  "roster_basis", "corrected_on", "jurist_id",
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

// --- Gate 4: where an opinion may be linked from ---------------------------
const ALLOWED_HOSTS = [
  "www.govinfo.gov", "govinfo.gov",
  "www.courtlistener.com", "courtlistener.com", "storage.courtlistener.com",
  "law.justia.com", "docs.justia.com", "dockets.justia.com",
  "www.uscourts.gov", "uscourts.gov",
  "www2.ca3.uscourts.gov", "www.njd.uscourts.gov",
  "www.fjc.gov", "fjc.gov",
  "www.supremecourt.gov",
  "ecf.njd.uscourts.gov",
];

// --- Gate 5: characterising the judge, not the holding ---------------------
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
  /\bpredict/i,
];

const DISTURBED = /(vacat|revers|remand|stay|withdraw|supersed|abrogat|cert(iorari)? granted)/i;

const poison = existsSync(POISON) ? JSON.parse(readFileSync(POISON, "utf8")) : { entries: [] };
const tax = existsSync(TAXONOMY) ? JSON.parse(readFileSync(TAXONOMY, "utf8")) : null;
const ledger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, "utf8")) : { curators: [], signoffs: {} };
const CATEGORY_KEYS = new Set((tax?.categories || []).map((c) => c.key));
const POSTURE_KEYS = new Set((tax?.postures || []).map((p) => p.key));

// Gate 8 — outcome selection and tallies. A tally is a prediction wearing the
// costume of a fact. Selecting only cases that came out one way implies a
// pattern even with no numbers on the page.
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

let disturbedTotal = 0;

const wordCount = (t) => (t || "").trim().split(/\s+/).filter(Boolean).length;

const files = readdirSync(JUDGES).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.error("review gate: no judge records found");
  process.exit(1);
}

const daysSince = (iso) => {
  if (!iso) return Infinity;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return Infinity;
  return (Date.now() - t) / 86400000;
};

const hostOf = (url) => {
  try { return new URL(url).host; } catch { return null; }
};

let publishedCount = 0;

for (const file of files) {
  const raw = readFileSync(join(JUDGES, file), "utf8");
  let r;
  try { r = JSON.parse(raw); } catch (e) { err(file, "schema", `unparseable: ${e.message}`); continue; }

  // Gate 1 — schema
  for (const k of ["jurist_id", "canonical_name", "office", "vicinage", "status", "biography", "publish"]) {
    if (!(k in r)) err(file, "schema", `missing required field: ${k}`);
  }
  if (r.jurist_id && file !== `${r.jurist_id}.json`) {
    err(file, "schema", `filename does not match jurist_id "${r.jurist_id}"`);
  }
  if (r.status && !r.status.roster_source) {
    err(file, "schema", "status.roster_source is required: every roster fact must name where it came from");
  }
  if (r.status && !r.status.roster_checked) {
    err(file, "schema", "status.roster_checked is required");
  }

  const opinions = [
    ...(r.significant_opinions || []),
    ...Object.values(r.matter_relevant_opinions || {}).flat(),
  ];

  // Gate 2 — review gate
  if (r.publish === true) {
    publishedCount++;
    const bio = r.biography || {};
    if (bio.verification_status !== "verified") {
      err(file, "review-gate", `publish=true but biography.verification_status is "${bio.verification_status}"`);
    }
    if (!bio.reviewer || !bio.review_date) {
      err(file, "review-gate", "publish=true requires a named biography reviewer and review_date");
    }
    if (!r.last_verified) err(file, "review-gate", "publish=true requires last_verified");

    // The reviewer field inside the record is self-reported. Authority lives in
    // the CODEOWNERS-protected ledger, bound to a hash of the content signed.
    const sig = ledger.signoffs?.[r.jurist_id];
    if (!sig) {
      err(file, "review-gate", `publish=true but no entry in data/signoffs.json. Run scripts/sign-record.mjs.`);
    } else if (!ledger.curators.includes(sig.reviewer)) {
      err(file, "review-gate", `signed by "${sig.reviewer}", who is not a listed curator`);
    } else if (sig.content_hash !== contentHash(r)) {
      err(file, "review-gate", `sign-off LAPSED: content changed since ${sig.reviewer} signed on ${sig.date}. Re-read the page and sign again.`);
    } else if (bio.reviewer && bio.reviewer !== sig.reviewer) {
      err(file, "review-gate", `record names "${bio.reviewer}" as reviewer but the ledger was signed by "${sig.reviewer}"`);
    }
    for (const [i, o] of opinions.entries()) {
      if (o.verification_status !== "verified") {
        err(file, "review-gate", `opinion[${i}] "${o.caption}" is ${o.verification_status} on a published page`);
      }
      if (!o.reviewer || !o.review_date) {
        err(file, "review-gate", `opinion[${i}] "${o.caption}" has no named reviewer`);
      }
      const mode = o.display || (r.significant_opinions?.includes(o) ? "headnote" : "citation-only");
      if (mode === "headnote" && !o.headnote) {
        err(file, "review-gate", `opinion[${i}] "${o.caption}" claims headnote display but has none`);
      }
      if (mode === "citation-only" && o.headnote) {
        err(file, "review-gate", `opinion[${i}] "${o.caption}" is citation-only but carries a headnote; set display to "headnote"`);
      }
      if (mode === "citation-only" && !o.public_url) {
        err(file, "review-gate", `opinion[${i}] "${o.caption}" is citation-only, so the link is the entire entry and it is missing`);
      }
    }
  }

  // Reader-facing projection: excludes editorial metadata and correction notes,
  // so a correction may name the error it corrects.
  const surface = readerFacingText(r);

  // Gate 3 — Westlaw firewall (applies whether published or not)
  for (const rx of FIREWALL) {
    if (rx.test(surface)) err(file, "firewall", `subscription research service referenced in reader-facing content: ${rx}`);
  }

  // Gate 4 — source allowlist
  for (const o of opinions) {
    if (!o.public_url) {
      if (r.publish === true) err(file, "sources", `"${o.caption}" has no public opinion link`);
      continue;
    }
    const h = hostOf(o.public_url);
    if (!h) { err(file, "sources", `"${o.caption}" has a malformed URL`); continue; }
    if (!ALLOWED_HOSTS.includes(h)) {
      err(file, "sources", `"${o.caption}" links to ${h}. Opinions must come from an official or neutral free repository, not an advocacy, party, commercial-AI or press host.`);
    }
    for (const ah of (o.appellate_history || [])) {
      if (!ah.url) continue;
      const ah_h = hostOf(ah.url);
      if (ah_h && !ALLOWED_HOSTS.includes(ah_h)) {
        err(file, "sources", `appellate link for "${o.caption}" points to ${ah_h}`);
      }
    }
  }
  if (r.biography?.source_url) {
    const h = hostOf(r.biography.source_url);
    if (h && !ALLOWED_HOSTS.includes(h)) {
      err(file, "sources", `biography sourced to ${h}; biographies come from the FJC or the court`);
    }
  }

  // Gate 5 — tone
  const prose = [
    r.biography?.text || "",
    ...opinions.map((o) => `${o.headnote || ""} ${o.selection_basis || ""}`),
  ].join("\n");
  for (const rx of TONE) {
    if (rx.test(prose)) err(file, "tone", `language characterises the judge rather than the holding: ${rx}`);
  }

  // Gate 8 — outcome neutrality (all reader-facing prose)
  for (const rx of [...TALLY, ...OUTCOME_SELECTION]) {
    if (rx.test(surface)) err(file, "neutrality", `tally or outcome-based selection language: ${rx}`);
  }
  for (const o of opinions) {
    if (OUTCOME_SELECTION.some((rx) => rx.test(o.selection_basis || ""))) {
      err(file, "neutrality", `"${o.caption}" selection_basis is stated in terms of outcome`);
    }
  }

  // Gate 9 — tier discipline
  if (tax) {
    const sig = r.significant_opinions || [];
    if (sig.length > tax.tiers.significant.max_per_judge) {
      err(file, "tier", `${sig.length} significant opinions; the credibility tier is capped at ${tax.tiers.significant.max_per_judge}`);
    }
    for (const o of sig) {
      const w = wordCount(o.headnote);
      if (w > tax.tiers.significant.headnote_max_words) {
        err(file, "tier", `"${o.caption}" is a significant-tier entry with a ${w}-word headnote (max ${tax.tiers.significant.headnote_max_words}). These entries move; keep them short.`);
      }
    }
    for (const [cat, list] of Object.entries(r.matter_relevant_opinions || {})) {
      if (!CATEGORY_KEYS.has(cat)) {
        err(file, "tier", `matter_relevant_opinions has category "${cat}", which is not in taxonomy.json`);
      }
      for (const o of list) {
        if (!o.posture || !POSTURE_KEYS.has(o.posture)) {
          err(file, "tier", `"${o.caption}" in ${cat} has no valid posture tag; selection must be by posture and subject`);
        }
        if (o.posture === "institutional") {
          err(file, "tier", `"${o.caption}" is tagged institutional but sits in the matter tier`);
        }
        const mode = o.display || tax.tiers.matter.default_display;
        if (!["citation-only", "headnote"].includes(mode)) {
          err(file, "tier", `"${o.caption}" has unknown display mode "${mode}"`);
        }
        if (mode === "citation-only" && !o.exhaustive_for_category) {
          const m = `"${o.caption}" is citation-only in ${cat} but the category is not marked exhaustive. A partial unsummarized list still implies a choice.`;
          r.publish === true ? err(file, "tier", m) : warn(file, "tier", m);
        }
        if (r.publish !== true || mode !== "headnote") continue;
        const w = wordCount(o.headnote);
        if (w < tax.tiers.matter.headnote_min_words || w > tax.tiers.matter.headnote_max_words) {
          err(file, "tier", `"${o.caption}" headnote is ${w} words; the matter tier requires ${tax.tiers.matter.headnote_min_words}-${tax.tiers.matter.headnote_max_words}`);
        }
      }
    }
  }

  // Gate 6a — a disturbed posture needs a plain statement of what is operative now.
  // Batch 2 established that a correct history is not enough: a reader needs to be
  // told whether the holding is in effect. Stayed mandates are the trap.
  for (const o of opinions) {
    const disturbed = (o.appellate_history || []).some((ah) =>
      DISTURBED.test(`${ah.disposition || ""} ${ah.effect_on_lower_ruling || ""}`));
    if (!disturbed) continue;
    const cp = o.current_posture;
    if (!cp || !cp.statement || !cp.as_of) {
      const m = `"${o.caption}" has a disturbed appellate posture but no current_posture statement`;
      r.publish === true ? err(file, "appellate", m) : warn(file, "appellate", m);
    } else if (daysSince(cp.as_of) > STALE_DAYS) {
      const m = `"${o.caption}" current_posture last stated ${Math.round(daysSince(cp.as_of))} days ago`;
      r.publish === true ? err(file, "appellate", m) : warn(file, "appellate", m);
    }
  }

  // Gate 6 — appellate currency
  for (const o of opinions) {
    if ((o.appellate_history || []).some((ah) =>
      DISTURBED.test(`${ah.disposition || ""} ${ah.effect_on_lower_ruling || ""}`))) disturbedTotal++;
    for (const ah of o.appellate_history || []) {
      const disturbed = DISTURBED.test(`${ah.disposition || ""} ${ah.effect_on_lower_ruling || ""}`);
      if (!disturbed) continue;
      const age = daysSince(ah.status_checked);
      if (age === Infinity) {
        const m = `"${o.caption}" has a disturbed appellate posture with no status_checked date`;
        r.publish === true ? err(file, "appellate", m) : warn(file, "appellate", m);
      } else if (age > STALE_DAYS) {
        const m = `"${o.caption}" appellate status last checked ${Math.round(age)} days ago (limit ${STALE_DAYS})`;
        r.publish === true ? err(file, "appellate", m) : warn(file, "appellate", m);
      }
    }
  }

  // Gate 7 — poison list
  for (const p of poison.entries) {
    if (p.jurist_id && p.jurist_id !== r.jurist_id) continue;
    if (new RegExp(p.pattern, "i").test(surface)) {
      err(file, "poison", `${p.reason}`);
    }
  }

  // Advisory — no corpus can exist yet
  const appt = r.status?.commission_or_appointment_date;
  if (appt && daysSince(appt) < 365 && opinions.length > 0) {
    warn(file, "corpus", `appointed ${appt}; a published opinion corpus is unlikely. Confirm authorship.`);
  }
}

console.log(`review gate: ${files.length} records, ${publishedCount} marked publish=true, ${disturbedTotal} disturbed-posture entries`);
if (tax && disturbedTotal > tax.maintenance_bias.soft_cap_disturbed_entries) {
  warn("(tree)", "maintenance", `${disturbedTotal} disturbed-posture entries exceeds the soft cap of ${tax.maintenance_bias.soft_cap_disturbed_entries}. Each costs a recurring status check forever. Prefer settled opinions.`);
}
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log("  ! " + w);
}
if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error("  x " + e);
  console.error("\nBUILD BLOCKED.");
  process.exit(1);
}
console.log("\nreview gate: passed");
