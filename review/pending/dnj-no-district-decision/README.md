# Held: no district-court decision available

Forty-five entries were removed from the significant tier on 14 September 2026
under the rule that an entry belongs on a judge's page only when the district
court's own decision is available. An appellate opinion shows what the circuit
did, not what the judge did, and this reference does not list a district judge's
work from it.

Nothing here renders. `src/content` is the published tree; this directory is not
in the content collections.

Of the forty-five, by how recoverable each is — the full inventory, with every
citation, is in `docs/HELD-ENTRIES.md`:

- **21 carry a district docket.** `scripts/resolve-links.mjs` was written for
  exactly these; GovInfo package IDs are deterministic from the docket.
- **12 carry an appellate docket where the district docket belongs.** That defect
  was already on the worklist. One lookup each.
- **2 name a published district decision with no docket** — *NCAA v. Governor of
  New Jersey*, 926 F. Supp. 2d 551, and *ANJRPC v. Platkin*, 742 F. Supp. 3d 421.
  Findable by citation.
- **7 carry only an appellate citation.** As written, the entry is the appeal.
  Re-research from the district docket or drop it.
- **3 carry neither a docket nor a reporter citation.**

Thirty-five of the forty-five come back with a lookup. Ten need research.

To restore one: resolve a district-level link, set `link_level` to `district`,
move the file back into `src/content/districts/dnj/opinions/`, and raise the
judge's `actual_selected_count` and `declared_selected_count` to match. The gate
checks the count against the files on disk, so it will catch a mismatch.

To discard them instead, delete this directory.
