# Proposed: dnj recent tier, trade secrets, 15 September 2026

Four candidates from CourtListener's RECAP document index. Nothing here
renders; nothing here is finished.

Each was found by full-text search for the taxonomy's trade-secrets terms,
restricted to D.N.J., filed since 2019, with a retrievable PDF — then filtered
down to documents that are decisions on the merits. The judge, the date and the
ECF number come from the clerk's signature line on the docket entry, so each
carries `docket_entry_signature` rather than an inference.

Both judges have thin pages, which is the point of the tier. Neals had one
published entry and Semper none.

## What each still needs

1. **A headnote**, written from the public opinion. Deliberately null here.
   No automated process writes what a judge decided, and a commercial headnote
   never enters this repo at all.
2. **Procedural tags** from `taxonomy.json`.
3. **The link verified** to resolve to the right document.
4. **The judge's counts raised** in `src/content/districts/dnj/judges/`.

Then `npm run validate` and move the file into
`src/content/districts/dnj/opinions/`.

## What the search taught

A full-text query for a subject matches every document in a case about that
subject. The obvious noise is easy — complaints, motions, letters. The
expensive noise is not: a trade-secrets case generates opinions on sealing, on
compelling discovery, on attorney's fees, each a real opinion by the right
judge in the right case, and none of them a decision about trade secrets.

Of thirty results, four survived. The filter in `scripts/lib/recap.mjs` asks
what the document is, not what the case is about. Procedural rulings are not
discarded from the site — they have their own section and their own tags — but
they do not belong under a matter type a reader chose because it matches the
complaint they were served with.

`H&U v. Komolo` is worth noting: an opinion on a TRO and expedited discovery in
a trade-secrets case, decided a week ago. That is the thing CLAUDE.md describes
as "exactly the ordinary trade-secrets TRO the recipient wants to see", and the
career screen would have rejected it without a second look.
