# Held: no district-court decision available

Forty-five entries were removed from the significant tier on 14 September 2026
under the rule that an entry belongs on a judge's page only when the district
court's own decision is available. An appellate opinion shows what the circuit
did, not what the judge did, and this reference does not list a district judge's
work from it.

Nothing here renders. `src/content` is the published tree; this directory is not
in the content collections.

Of the forty-five:

- **33 carry a district docket number** and are re-sourceable. Twenty-one are in
  the deterministic GovInfo package form (`USCOURTS-njd-<vicinage>_<docket>`).
  `scripts/resolve-links.mjs` is written for exactly this and has never been run
  against the live APIs.
- **12 carry no docket.** Several of those have an `F. Supp.` reporter citation,
  which means a district decision was published and can be found by citation —
  *NCAA v. Governor of New Jersey* (Shipp, 926 F. Supp. 2d 551) and *ANJRPC v.
  Platkin* (Sheridan, 742 F. Supp. 3d 421) among them. The rest carry only an
  `F.3d` cite, which means the record as written is the appellate opinion.

To restore one: resolve a district-level link, set `link_level` to `district`,
move the file back into `src/content/districts/dnj/opinions/`, and raise the
judge's `actual_selected_count` and `declared_selected_count` to match. The gate
checks the count against the files on disk, so it will catch a mismatch.

To discard them instead, delete this directory.
