/**
 * Site-level identity. Three of these blocks are open decisions in
 * docs/LAUNCH-CHECKLIST.md and none of them is Claude's to make, so they ship
 * null rather than invented.
 *
 * The advertising block is not decoration. It does four compliance jobs at
 * once, and a page that publishes without it is worse than a page that does not
 * publish. `assertAdvertisingBlockSettled` below is what stops that happening:
 * drafts render with the block visibly unset, but the build fails if a record
 * is actually published while the firm or curator is still null.
 */

export const site = {
  name: "Federal Bench Reference",
  district: "United States District Court for the District of New Jersey",
  copyright_year: new Date().getUTCFullYear(),
};

/** UNSET — "Firm block settled" in docs/LAUNCH-CHECKLIST.md. */
export const firm = {
  name: null,
  address: null,
  phone: null,
};

/** UNSET — "Curator block settled" in docs/LAUNCH-CHECKLIST.md. */
export const curator = {
  name: null,
};

export const advertisingBlockSettled =
  Boolean(firm.name && firm.address && firm.phone && curator.name);

/**
 * Called from the judges index once the published set is known. Publishing a
 * judge page without a settled advertising block is a compliance failure, not a
 * cosmetic one, so it stops the build rather than warning.
 */
export function assertAdvertisingBlockSettled(publishedCount) {
  if (publishedCount > 0 && !advertisingBlockSettled) {
    const missing = [
      !firm.name && "firm.name",
      !firm.address && "firm.address",
      !firm.phone && "firm.phone",
      !curator.name && "curator.name",
    ].filter(Boolean);
    throw new Error(
      `BUILD BLOCKED: ${publishedCount} record(s) are marked publish=true, but the ` +
        `attorney advertising block is unset (${missing.join(", ")}). ` +
        `Settle the firm and curator blocks in src/config/site.js first — see ` +
        `docs/LAUNCH-CHECKLIST.md, "Decisions that gate the public domain".`,
    );
  }
}
