/**
 * Loads the content layer. Nothing here decides what is true; data/ does, and
 * scripts/validate-content.mjs decides whether data/ is fit to build. This file
 * only sorts it into what publishes and what does not.
 *
 * The publication rule is one line: a record renders under /judges/ when
 * `publish` is true, and under /drafts/judges/ otherwise. That is deliberately
 * the same flag the review gate keys on, so the gate and the site can never
 * disagree about what is published. The gate already refuses to pass a record
 * with publish=true that lacks a verified status, a named reviewer, and a
 * matching entry in the CODEOWNERS-protected sign-off ledger, so this file does
 * not re-litigate any of that.
 */

// Read at build time through Vite rather than from disk at runtime. The build
// bundles this module into dist/, so a path derived from import.meta.url would
// resolve against the bundle's location instead of the repository root and the
// records would vanish. import.meta.glob is resolved by Vite against this
// source file, which is stable wherever the bundle ends up.
import taxonomyData from "../../data/taxonomy.json";
import rosterManifestData from "../../data/roster-manifest.json";

const judgeModules = import.meta.glob("../../data/judges/*.json", { eager: true });

export const taxonomy = taxonomyData;
export const rosterManifest = rosterManifestData;

/** Every record, sorted by surname then full name. */
export const allJudges = Object.values(judgeModules)
  .map((m) => m.default ?? m)
  .sort((a, b) => surnameOf(a).localeCompare(surnameOf(b), "en") ||
    a.canonical_name.localeCompare(b.canonical_name, "en"));

export const publishedJudges = allJudges.filter((j) => j.publish === true);
export const draftJudges = allJudges.filter((j) => j.publish !== true);

/**
 * Drafts exist because the sign-off procedure requires them: data/signoffs.json
 * says to read the rendered page rather than the JSON before signing. They are
 * built by default because today every record is a draft, and a site with no
 * draft pages gives the curator nothing to review.
 *
 * They carry their own noindex meta tag rather than relying on the edge header,
 * public/robots.launch.txt disallows /drafts/, and every draft page says on its
 * face that it is unreviewed. Set INCLUDE_DRAFTS=0 to drop them from the build
 * entirely — do that before the site is reachable without Cloudflare Access.
 */
export const includeDrafts = process.env.INCLUDE_DRAFTS !== "0";

function surnameOf(judge) {
  // Good enough for a 43-name roster: last whitespace-separated token, with the
  // generational suffix ignored so "James B. Clark III" files under Clark.
  const parts = String(judge.canonical_name || "").trim().split(/\s+/);
  const suffixes = new Set(["Jr.", "Sr.", "II", "III", "IV", "Jr", "Sr"]);
  while (parts.length > 1 && suffixes.has(parts[parts.length - 1])) parts.pop();
  return parts[parts.length - 1] || "";
}

/** Group a set of records by vicinage, in the court's own order. */
export function byVicinage(judges) {
  const order = ["Camden", "Newark", "Trenton"];
  const groups = new Map(order.map((v) => [v, []]));
  for (const j of judges) {
    const v = j.vicinage || "Unassigned";
    if (!groups.has(v)) groups.set(v, []);
    groups.get(v).push(j);
  }
  return [...groups.entries()].filter(([, list]) => list.length > 0);
}

/** Opinions a page will actually render, across both tiers. */
export function opinionsOf(judge) {
  return [
    ...(judge.significant_opinions || []),
    ...Object.values(judge.matter_relevant_opinions || {}).flat(),
  ];
}

/**
 * The template asks for a source label rather than a bare URL. Derive it from
 * the host so the page names the authority — "Federal Judicial Center" reads as
 * a source; "fjc.gov/history/judges/..." reads as a link someone forgot to
 * finish.
 */
export function sourceLabel(url) {
  if (!url) return null;
  let host;
  try {
    host = new URL(url).host.replace(/^www\d?\./, "");
  } catch {
    return null;
  }
  const labels = {
    "fjc.gov": "Federal Judicial Center, Biographical Directory of Article III Judges",
    "njd.uscourts.gov": "U.S. District Court for the District of New Jersey",
    "uscourts.gov": "United States Courts",
    "govinfo.gov": "GovInfo",
    "courtlistener.com": "CourtListener",
    "storage.courtlistener.com": "CourtListener (RECAP)",
    "law.justia.com": "Justia",
    "ca3.uscourts.gov": "U.S. Court of Appeals for the Third Circuit",
    "supremecourt.gov": "Supreme Court of the United States",
  };
  return labels[host] || host;
}

/** Whether a record has anything to say beyond its roster line. */
export function hasSubstance(judge) {
  return Boolean(judge.biography?.text) || opinionsOf(judge).length > 0;
}
