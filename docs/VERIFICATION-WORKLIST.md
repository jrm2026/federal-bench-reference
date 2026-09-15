# Verification worklist

## Where this stands

41 judge records and 95 decision records are in the tree. Every biography is
drafted from primary sources and carries a confidence value and a check date.
The gates pass. No record carries a curator sign-off, so nothing here has been
read by a human on the rendered page, which is the thing the gates cannot do.

Sections 1 and 3 below were written against the earlier scaffold, where the
biographies were empty. The content build closed most of both. What survives of
them is listed here, and sections 2, 4, 5 and 6 stand as written.

Open, in the order I would take them:

1. **Antar v. Borgata has no district-level link.** The 1 February 2024 letter
   order was cited to a gambling-trade press copy, which the sources gate
   refuses, and the record carries no docket to resolve one by. The entry is
   marked `appellate_only` and renders the warning strip. Find the docket, or
   drop the entry and adjust Arleo's declared count.
2. **Ireland v. Hegseth points at a docket, not the order.** The order itself
   was cited to FindLaw. FindLaw is not an advocacy, party or press host, so the
   stated rule does not plainly refuse it, but it is a Thomson Reuters property
   on a site whose premise is a Westlaw firewall. Decide it. If it is allowed,
   add the host to the allowlist in `scripts/gates-compliance.mjs` and restore
   the link alongside the docket.
3. **Sixteen biography sources sit outside the free-public list.** They warn
   rather than block: AP, three law-firm biographies, a bar association, a law
   school, Martindale, attorneys.org, Ballotpedia and the Sedona Conference.
   Martindale and Ballotpedia are the weak ones. Replace or accept each.
4. **44 records lack a district-level link.** `scripts/resolve-links.mjs` is
   written and has never been run against the live APIs. It needs
   `COURTLISTENER_TOKEN`; the free tier throttles at five requests a minute.
5. **The matter-relevant tier does not exist.** It is what the mail campaign
   actually needs. Section 4 below governs the selection.
6. **`firm.json` still holds `[address]` and `[phone]`.** The contact page
   suppresses the block rather than print the brackets, but the site should not
   go live with them unset.

Work in this order.

---

## 1. Roster confirmation (largely closed by the content build)

Confirm from the court and the FJC, not from the prior report:

- Hammer's original appointment date and current term expiry.
- Pascal's appointment date. The report shrugs at "on bench by August 2022" and
  falls back on Martindale. The court publishes a Notice to the Bar and a merit
  selection panel notice for every magistrate appointment.
- Espinosa's appointment day, not just the month.
- Clark's law school. The report flags a conflict between St. John's and Seton
  Hall and correctly declines to choose. A merit selection notice or the court's
  profile resolves it. If it does not, publish the fact as disputed or omit it.
- Senior status dates for Chesler, Hayden and Martini, which the roster carries
  as original commission dates pending FJC reconciliation.
- Whether Cooper, Thompson, Sheridan and McNulty have received an assignment in
  the last twelve months. Docket evidence, then a status sentence.

## 2. Appellate currency (blocks the four flagship pages)

The gate treats any vacated, reversed, stayed or remanded posture as stale after
45 days. Four entries need a certiorari docket check before launch and on a
standing schedule after it:

- *ANJRPC v. Platkin* — Third Circuit judgment stayed 4 Aug 2026 pending New
  Jersey's petition. Has the petition been filed or acted on?
- *Khalil* — mandate stayed 26 May 2026 pending certiorari. Same question.
- *Koons v. Platkin* — appellate scope and any Supreme Court activity were not
  re-verified. Read the 10 Sept 2025 opinion and state precisely which
  provisions survived.
- *McIver* — Count Three is on remand to Judge Semper. Track it.

## 3. Biographies and page spine (drafted; sign-off outstanding)

Move the practice information block and the appearing-from-out-of-state material
above the case list on the judge page template. Those sections are complete for
every judge on day one and carry the pages of the newest judges, who have no
corpus and who will nonetheless receive mail.



Draft from the FJC for Article III judges and from the court's profile and
Notices to the Bar for magistrate judges. Nothing from the prior report goes in
without a primary-source read. Bumb is done to `source-checked` as the pattern
to follow; she still needs a curator sign-off to publish.

Kill the "Other writings" field from the published site. Thirty-odd repetitions
of "no separately authored publication was located" tells a reader nothing and
implies a deficiency in the judge. Keep the search result in the data layer.

## 4. Case selection (the real work)

Governed by docs/SELECTION-SPEC.md. The short version: select at the
intersection of early-stage procedure and the six matter types, not on the
matter types alone. Personal jurisdiction first, then venue and transfer, then
injunction practice, then arbitration and forum selection, then remand, then
Rule 12(b)(6). Summary judgment last. Criminal, MDL and off-taxonomy statutory
work come out entirely.

Treat the magistrate pages as equal in priority to the district judge pages.
The mail piece names both, this reader will see the magistrate more in year one,
and magistrate output is procedural, which is both what the reader needs and the
easiest thing to summarize without characterizing anyone.

Two tiers with different rules, enforced by gate 9. Significant opinions: three
per judge maximum, sixty words each, existing for credibility. Matter-relevant
opinions: the full 250 to 500 word headnote, tagged with a posture from
taxonomy.json.

Bias toward settled opinions. Every disturbed-posture entry is a recurring
status check forever, and the gate warns past twelve across the tree.

Never select by outcome. Gate 8 catches tallies and outcome-phrased selection
bases, but the gate is a backstop. Publish the criteria on the methodology page.

Do not gate launch on headnotes. Gate launch on the roster and the bios.

## 5. Link durability

GovInfo `USCOURTS-...-0.pdf` package URLs are brittle and the suffix is not
stable. Before launch, run the full link check on a machine with open network
access, capture an archive URL for every opinion, and store both. The allowlist
in the gate checks the host; it does not check that the link resolves.

## 6. Ingest, once the above is stable

Three feeds, in ascending order of cost:

- The court's public ECF RSS feed at `ecf.njd.uscourts.gov/cgi-bin/rss_outside.pl`
  gives new filings free, with no editorial content and no subscription-service
  exposure. Evaluate it against the docket alert currently contemplated for the
  private pipeline; it may replace it.
- Notices to the Bar, for roster and procedure changes. Weekly.
- CourtListener, for opinions by judge and by category. Draft-only, pull request
  only, as specified.

## Standing cadence

Daily or weekly: new opinions, MDL orders, appellate dispositions.
Monthly: roster, designation page, chambers links, judicial preferences.
Quarterly: full FJC reconciliation, biography source audit, link check, and a
rerun of every "not located" search.
Event-driven: appointment, elevation, chief judge change, senior status, recall,
retirement, resignation, death, reassignment, recusal, appellate mandate.
