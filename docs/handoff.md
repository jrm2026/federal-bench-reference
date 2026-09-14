# Federal Bench Reference — Implementation Handoff

**Target:** a static, agent-maintained neutral reference to the federal bench, District of New Jersey first. Supports a direct-mail program by giving each recipient a credible page about the judge and magistrate judge assigned to his case.

**Audience for this document:** the coding agent or developer building the site. Self-contained. Read it end to end before writing code.

**Owner:** Jay R. McDaniel. **Sponsor of record:** Scarinci Hollenbeck, LLC. **Version 1.0, 12 September 2026.**

---

## 0. How to use this document

Sections 1 through 12 are the specification. Section 13 is the model and effort recommendation for the agent doing this work and for the ingestion pipeline. Section 14 lists what is still undecided.

Two inputs accompany this document and outrank it on their own subjects:

- `fedbenchjudgetemplate.html` — the visual source of truth. Extract its tokens and layout; do not redesign.
- `District_of_New_Jersey_Judges_Research_Report_2026-09-03.docx` — the verified seed data. Every judge, every biography, every source link, every case entry in the initial build comes from here or from the primary source it cites. Nothing else.

One rule governs everything: **no unverified fact about a sitting judge ever renders.** Where content is missing, the page says so. That discipline is not editorial fussiness — it is what keeps the site inside RPC 8.4(e) and 8.2, and it is the reason the empty states in Section 6 are a feature.

---

## 1. What you are building

A static site, ~50 judge pages, six topic pages, a bench index, and two compliance pages. Content lives in the repo as structured data. A scheduled job proposes additions; a human approves them; the site rebuilds.

The reader is an out-of-state general counsel or business owner who has just been served in a federal case in New Jersey and has not yet retained local counsel. He arrives from a letter, on a phone, looking for one specific judge. Optimize for that path: fast first paint, legible at 380px, and a page that answers "who is this judge and what has she decided in cases like mine" without scrolling past filler.

The register is a reference work. Dispassionate, factual, institutional. Never persuasive.

---

## 2. Stack, repo, and hosting

Astro, static output. GitHub Pages. GitHub Actions for scheduled ingestion and build. No CMS — a CMS cannot be agent-updated and would destroy the automation the project depends on.

Repository and Actions live under **Jay's personal GitHub account**, not the firm's. Domain registered to Jay or a personal holding LLC. CourtListener and PACER credentials in accounts Jay controls. Store API keys as repository secrets; never in the repo.

```
/
├── src/
│   ├── content/
│   │   ├── districts/
│   │   │   ├── dnj/
│   │   │   │   ├── district.json   name, court, vicinages, roster sources
│   │   │   │   ├── judges/         one file per judge, slug-named
│   │   │   │   └── opinions/       one file per opinion entry
│   │   │   ├── sdny/               later phase, same shape
│   │   │   └── edny/               later phase, same shape
│   │   └── config/
│   │       ├── firm.json     sponsor block — base + per-district overrides
│   │       ├── curator.json  curator block — swappable, separate from firm
│   │       ├── taxonomy.json subject + procedural vocabularies, shared
│   │       └── policy.json   lookback windows, entry caps, shared
│   ├── components/
│   │   ├── AdvertBanner.astro
│   │   ├── SiteHeader.astro
│   │   ├── JudgeHeader.astro
│   │   ├── Biography.astro
│   │   ├── OpinionEntry.astro
│   │   ├── AppellateStatus.astro
│   │   ├── EmptyState.astro
│   │   ├── TagGrid.astro
│   │   ├── CoverageNote.astro
│   │   └── AdvertFooter.astro
│   ├── layouts/
│   │   └── Base.astro        banner + header + footer, wraps every page
│   └── pages/
│       ├── index.astro                          national landing, district picker
│       ├── districts/[district]/index.astro     bench index
│       ├── districts/[district]/judges/[slug].astro
│       ├── districts/[district]/topics/[topic].astro
│       ├── about.astro                          one copy, all districts
│       └── attorney-advertising.astro           base + per-district variants
├── scripts/
│   ├── ingest-courtlistener.mjs
│   ├── ingest-fjc.mjs
│   ├── draft-headnotes.mjs
│   ├── check-appellate-history.mjs
│   ├── check-links.mjs
│   └── lib/
├── review/
│   └── pending/              proposed entries awaiting approval
└── .github/workflows/
    ├── build.yml
    ├── ingest-daily.yml
    ├── verify-weekly.yml
    └── audit-quarterly.yml
```

`Base.astro` carries the advertising banner and the footer attribution block so they travel with every page automatically. No page may opt out.


### Multi-district structure

The site will expand to the Southern and Eastern Districts of New York, and possibly further. Build for that now; retrofitting after launch costs redirect work and forfeits accrued authority.

**Subdirectories, never subdomains.** A subdomain is treated as a separate property, so authority earned by the New Jersey pages would not pass to a New York subdomain and each district would restart its credibility clock. Subdirectories consolidate everything under one domain, and they keep one Astro build, one Actions workflow, one footer component, and one Pages configuration instead of one set per district.

```
federalbenchreference.com/
  /districts/dnj/                       bench index
  /districts/dnj/judges/<slug>/         judge page
  /districts/dnj/topics/<topic>/        topic index, scoped to the district
  /districts/sdny/ …
  /districts/edny/ …
  /about/                               methodology, one copy
  /attorney-advertising/                notice, with per-district variants
```

Use the abbreviations litigators type: `dnj`, `sdny`, `edny`, later `edpa`, `dct`. Point `njfederalbench.com` at `/districts/dnj/`, not at the root.

**Judges sitting in more than one district get exactly one page.** Cheryl Pollak is already in the dataset — an EDNY magistrate judge appearing on the D.N.J. designation page. If district lives only in the URL hierarchy, she gets two pages and they drift; one will carry a stale appellate status while the other is current. Every judge record therefore carries `home_district`, a `designations` array, and a `canonical` boolean. The canonical page renders at the home district; the other district's bench index links to it as a labeled cross-reference. A CI check fails the build if any judge slug is canonical in two districts.

**The firm block takes per-district overrides.** New York's advertising rules are not New Jersey's, and the disclosed office and phone may differ by jurisdiction. Structure `firm.json` as a base block plus district overrides now, while there is one district and the refactor is free. The New York thirty-day solicitation moratorium is specific to personal-injury and wrongful-death matters and does not reach commercial defendants, but the labeling and RPC 7.3 record-retention obligations do.

**Taxonomy and lookback policy stay global.** One subject vocabulary, one procedural vocabulary, one set of windows. A tag that means one thing in Newark and another in Brooklyn is not a tag.

**Actions runs a matrix keyed on district**, so a CourtListener rate limit in SDNY cannot block the New Jersey build.

**Add a district only when the prior one is in steady state.** SDNY and EDNY each carry roughly twice the New Jersey district bench plus a larger magistrate corps. Ingestion cost triples and nobody notices. The human approving sitting-judge pages also triples, and that is what actually stalls the program.

---

## 3. Content model

Model facts, opinions, and status history separately so a later appeal or a senior-status change does not overwrite the source record.

### Judge

```json
{
  "slug": "jamel-k-semper",
  "name": "Jamel K. Semper",
  "district": "dnj",
  "home_district": "dnj",
  "designations": [],
  "canonical": true,
  "honorific": "Hon.",
  "office": "district",
  "title": "United States District Judge",
  "status": "active",
  "vicinage": "Newark",
  "commission_date": "2023-12-01",
  "appointment_date": null,
  "chief_judge_since": null,
  "senior_status_since": null,
  "appointing_president": "Joseph R. Biden Jr.",
  "roster_sources": ["dnj_directory", "fjc"],
  "biography": {
    "text": "…",
    "education": ["B.A., Hampton University (2003)", "J.D., Rutgers Law School–Newark (2007)"],
    "prior_service": ["…"],
    "confidence": "verified",
    "source_note": null,
    "sources": ["https://www.fjc.gov/node/13761371", "https://www.njd.uscourts.gov/content/jamel-k-semper"],
    "last_verified": "2026-09-12"
  },
  "other_writings": [],
  "coverage_note": null,
  "publish": true,
  "link_from_mail": true
}
```

Field notes:

- `office` — `district` | `magistrate` | `magistrate_part_time` | `magistrate_recalled`. Drives which page template renders.
- `status` — `active` | `senior` | `senior_inactive` | `part_time` | `recalled`.
- `roster_sources` — which sources list this judge. The four FJC-only senior judges (Cooper, Thompson, Sheridan, McNulty) carry `["fjc"]` and render in a separately labeled section, never mixed into the current bench.
- `biography.confidence` — `verified` | `partial` | `conflicted`. `partial` renders the sourcing caution block (Pascal, Bongiovanni). `conflicted` renders both competing facts and says so (Clark's law school). Never silently pick.
- `link_from_mail` — false for judges whose pages are mostly empty states (Silagi, Hougah, Fais). They publish, because a bench index must be complete, but no letter links to them.
- `home_district` / `designations` / `canonical` — the multi-district fields. `canonical: true` renders a full page; a judge sitting by designation in a second district carries `canonical: false` there and appears on that bench index as a cross-reference only.

### Opinion

```json
{
  "id": "njd-semper-2025-1113-mciver",
  "district": "dnj",
  "judge_slug": "jamel-k-semper",
  "caption": "United States v. McIver",
  "docket": "2:25-cr-00373",
  "court": "D.N.J.",
  "date": "2025-11-13",
  "reporter_cite": null,
  "public_url": "https://…",
  "repository": "other_public",
  "document_type": "opinion",
  "tier": "significant",
  "selection_reason": "Speech or Debate Clause challenge by a sitting member of Congress; sustained national coverage; appellate treatment.",
  "subject_primary": "criminal-public-corruption",
  "subject_secondary": [],
  "procedural_tags": ["rule-12-dismissal"],
  "motion_type": "motion to dismiss indictment",
  "disposition": "denied",
  "headnote": "…",
  "headnote_status": "published",
  "standard_flag": null,
  "appellate_history": [
    {
      "court": "3d Cir.",
      "docket": "25-3573",
      "date": "2026-08-26",
      "disposition": "Affirmed as to Counts One and Two; vacated and remanded Count Three; balance dismissed for lack of jurisdiction.",
      "effect": "partially_vacated",
      "url": "https://www2.ca3.uscourts.gov/opinarch/253573p.pdf"
    }
  ],
  "status_checked": "2026-09-12",
  "last_verified": "2026-09-12"
}
```

Field notes:

- `document_type` — `opinion` | `order` | `report_recommendation`. On magistrate pages this renders as a visible chip. An R&R additionally requires `rr_disposition`: `adopted` | `modified` | `rejected` | `pending`. Never present an unadopted recommendation as the court's ruling.
- `tier` — `significant` | `recent`. Significant has no date cutoff; recent is windowed per Section 5.
- `repository` — `govinfo` | `courtlistener` | `justia` | `court` | `pacer` | `other_public`. Prefer GovInfo or the issuing court. Record it; the About page explains the preference order.
- `disposition` — a short factual phrase drawn from the opinion's own language. No adjectives, no characterization of the judge.
- `standard_flag` — free text for a governing-standard caveat, e.g. `"Decided under pre-2015 Rule 26(b)(1) text"` or `"Decided under pre-December 2023 Rule 702"`. Renders as a chip.
- `headnote_status` — `draft` | `in_review` | `published` | `rejected`. Only `published` renders prose. `draft` and `in_review` render the review-pending state.
- `effect` in appellate history — `affirmed` | `reversed` | `vacated` | `partially_vacated` | `remanded` | `superseded` | `cert_pending` | `cert_denied`. Anything other than `affirmed` renders the warning strip above the fold of the entry.

### Headnote standard

250 to 500 words. Three moves, in order: the factual background, the issues presented, the holdings. Written from the public opinion, never from a commercial summary. No characterization of the judge, no prediction, no commentary on quality or tendency. Close appellate history goes in the structured field, not the prose.

---

## 4. Tag vocabularies

Fixed and capped. A model applies twenty stable tags reliably and sixty unreliably, and the review gate can only audit a vocabulary a human can hold in mind. Do not extend without a decision from Jay.

### Subject matter

`trade-secrets` · `restrictive-covenants` · `trademark-unfair-competition` · `copyright` · `commercial-contract` · `business-torts` · `closely-held-fiduciary` · `franchise-distribution` · `securities` · `consumer-fraud` · `employment` · `insurance-coverage` · `data-privacy-cybersecurity` · `patent` · `products-liability-mdl` · `civil-rights` · `criminal-public-corruption` · `immigration` · `election-law` · `antitrust`

The first thirteen are the intake filter and drive the topic pages. The remainder exist because the D.N.J. bench decides them and a reference work that omitted them would read as incomplete; they are indexed but get no topic page in Phase 1.

### Procedural

`personal-jurisdiction` · `venue-transfer` · `subject-matter-jurisdiction-removal` · `arbitration-forum-selection` · `rule-12-dismissal` · `rule-9b-particularity` · `default-and-vacatur` · `injunctive-relief` · `discovery-scope` · `privilege-work-product` · `protective-orders-sealing` · `spoliation-sanctions` · `expert-daubert` · `summary-judgment` · `class-certification` · `case-management` · `report-recommendation-practice` · `fees-and-costs` · `interlocutory-appeal`

### Assignment rules

One `subject_primary`. Up to two `subject_secondary`. As many `procedural_tags` as the document genuinely decides — and no more; an opinion that mentions a standard in passing has not decided it. Record a one-line `selection_reason` for every entry so the reviewer checks a citation rather than a judgment call.

---

## 5. Lookback policy

Store in `policy.json` and render the governing window as a line under each section heading, so the reader can calibrate what he is looking at.

| Content | Window |
|---|---|
| Significant decisions | No cutoff. Institutional consequence does not decay. |
| Recent, by subject (district judges) | Rolling 5 years, floored at `commission_date` |
| Recent, by procedure (district judges) | Rolling 3 years |
| Daubert / Rule 702 entries | Floor at 2023-12-01. Earlier entries require `standard_flag`. |
| Discovery-scope entries | Entries before 2015-12-01 require `standard_flag`. |
| Magistrate judges, all categories | Count cap: 5 most recent verified per tag. No date cutoff. |
| Senior judges not on the court directory | Frozen. Label "last located opinion." No rolling claim. |
| Mail-linked pages | Prefer entries within 3 years. A 2009 citation in a 2026 letter reads as padding. |

Ten of the active Article III judges were commissioned between 2021 and 2024, so for most of the bench the commission-date floor, not the five-year window, is the operative constraint. Magistrate judges get a count cap because Bongiovanni has twenty-three years of discovery output and a date cap would either bury her page or empty it.

Every windowed entry carries a standing obligation to recheck appellate history. That cost scales with entry count, which is the real reason for the caps.

---

## 6. Page templates

### District judge page

Order, top to bottom: advertising banner, site header, breadcrumb, judge header (name, title, court, vicinage chip, commission chip), biography with source line, significant decisions, recent decisions by subject, recent decisions by procedure, footer attribution.

Opinion entry anatomy: caption as a link to the free public copy; citation line with docket, court, and date; chips for motion type, disposition, and any `standard_flag`; the headnote or the review-pending state; the appellate-status strip when `effect` is anything but `affirmed`; a source line naming the repository.

The appellate-status strip sits inside the entry, above the fold of that entry — never in a footnote. A reader who takes in a headnote without seeing that a count was vacated has read something misleading.

Procedural categories with no entries render as a two-column tag grid showing counts, including zeros. That reads as a reference work stating its coverage, which is the correct register, and it removes any temptation to pad.

### Magistrate judge page

Five structural differences, each forced by what the office is.

1. A **role-on-the-docket** block sits above the biography. It explains that the magistrate judge manages scheduling and discovery, conducts settlement conferences, handles criminal initial proceedings, and decides dispositive matters on referral or consent. Neutral, and the most useful paragraph on the page for an out-of-state reader.
2. **Procedure leads.** Rulings group by procedural tag first; subject matter becomes a secondary index that files a discovery ruling by the underlying dispute.
3. **No significant tier.** Use `tier: "recent"` throughout with the count cap. A frequently-cited procedural ruling may be surfaced first within its category but is not labeled significant.
4. **Order versus recommendation** is a visible chip on every entry, and the R&R category's empty state states that entries will note whether the district judge adopted, modified, or rejected the recommendation.
5. A **coverage note** closes the page: magistrate work is underrepresented in free repositories, many orders exist only on the docket, and the absence of an entry is not evidence that no ruling was made. On a district judge page this would read as excuse-making. Here it is simply true, and it inoculates every empty state above it.

### Newly appointed judges

Silagi (sworn 2026-09-01), Hougah (2026-07-23), and Fais (2025-09-03) get a biography, a role block, a coverage note, and an explicit line giving the appointment date and stating that no authored ruling has yet been located in the reviewed public repositories. `publish: true`, `link_from_mail: false`.

### Two empty states, used distinctly

- **"No verified entries yet"** — the category is live and nothing has cleared review.
- **"Headnote drafted · awaiting editorial review"** — the gate is holding a specific, named item.

A reader who returns in a month can tell the site is maintained. That is the whole point of distinguishing them.

### Bench index

Grouped by vicinage (Camden, Newark, Trenton, Fort Dix), then district judges before magistrate judges, then the FJC-reconciliation section under its own heading and explanation, then the recalled-by-designation entry. No commentary anywhere.

### Topic index

A one-line standing description of the matter type, then opinions aggregated across the whole bench, each as citation plus link. A clearly labeled and visually separated "Commentary" area may link out to Jay's firm-side writing on that topic, marked as attorney advertising.

**Aggregate only across the bench, never per judge.** See Section 10.

### About / Methodology

Sources and their preference order. The verification standard: every headnote written from the public opinion, every link verified to resolve to the correct case. The lookback policy in plain terms. The independence disclaimer, expanded. The limitations paragraph: the site does not claim completeness for sealed matters, unpublished minute entries, oral decisions, subscription databases, or PACER-only documents, and a "none located" statement records a search result as of a date, not an enduring negative fact.

---

## 7. Design tokens

Extract from `fedbenchjudgetemplate.html`. Do not substitute.

```
--page:    #f4f5f7    --card:  #ffffff
--ink:     #1c2530    --muted: #5c6672    --faint: #8a929c
--line:    #dce0e6    --accent: #1f3a5f
--advert:  #7a5a12    --advert-bg: #fbf4e2
--serif:   Georgia, "Times New Roman", serif
--sans:    system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif
```

Serif for captions and judge names; sans for everything else. Content column max 900px. Section cards: white, 1px `--line`, 8px radius. Empty states: dashed border, `#fafbfc` fill. The advertising banner is `--advert-bg` with `--advert` text, full width, above the fold.

Quality floor: responsive to 380px, visible keyboard focus, no motion, WCAG AA contrast throughout. No web fonts — system stack only, for first-paint speed on mobile.

---

## 8. Ingestion pipeline

Always-on ingestion lives in GitHub Actions, not in an interactive session. Sessions are ephemeral; Actions is durable and free.

**Daily.** Pull new D.N.J. opinions from the CourtListener API. Filter to the judges on the roster. For each new document: resolve a free public copy, verify the link resolves to the correct case, extract docket, date, document type, motion type, and disposition, then classify against the two vocabularies. Write a proposed entry to `review/pending/` with `headnote_status: "draft"`. Never write directly to `src/content/`.

**Weekly.** Recheck appellate history for every entry inside a rolling window. Update `appellate_history` and `status_checked`. Any change in `effect` flags the entry for human re-review before the page rebuilds.

**Monthly.** Reconcile the court directory, the designation page, and chambers links. Flag roster deltas — new appointments, elevations, senior status, retirements — as a pull request, not an automatic merge.

**Quarterly.** Full FJC reconciliation, biography source audit, broken-link sweep, and a rerun of every "no writing located" search.

**PACER** runs as a separate authenticated step for gap-fill only, with per-page cost, and never on a schedule that could run away.

### The Westlaw firewall — absolute

Westlaw and its editorial content — headnotes, synopses, alert summary text, key numbers — feed **only** the private solicitation pipeline and never touch this repository. *Thomson Reuters v. Ross Intelligence* (D. Del., Feb. 2025) held West headnotes copyrightable and rejected the fair-use defense. On the public site, case authority is a citation plus a link to a free public copy: the citation is a freely usable fact, the linked opinion is public-domain judicial text. Enforce this in code review and in the ingestion scripts' allowed-source list.

---

## 9. The review gate

**Nothing about a sitting judge publishes unverified.** This is the single most important operational control in the system.

Implement it as the boundary between `review/pending/` and `src/content/`. The build reads only `src/content/`. Moving a file across that boundary requires a pull request approved by the review-gate owner. Ingestion opens the PR; a human merges it.

The reviewer checks four things and nothing else, so the job stays under two minutes per entry: the link resolves to the correct case; the citation, docket, and date match the document; the headnote contains no characterization of the judge and no prediction; the appellate history is current as of the check date.

Record the approver and the approval date in the entry. Jay signs off on the initial full-bench build; name a standing owner and a turnaround commitment before Phase 2.

---

## 10. Hard compliance rules

These are constraints on the code, not preferences. Encode them as tests where you can.

1. **Neutral and informational.** Describe what a judge has done. Never state or imply an ability to influence any court or judge. No adjectives in dispositions.
2. **Never per-judge aggregation.** Do not compute, store, or render grant rates, reversal rates, average time-to-ruling, ideological scoring, or any per-judge statistic — however framed, however sourced. This is the one feature that would convert a record of what a judge has done into a prediction of what a judge will do, and it would cost the entire site its neutrality defense. Topic-page aggregation across the whole bench is fine. Add a CI check that fails on a per-judge aggregate field.
3. **Attorney-advertising designation and firm attribution on every page**, via `Base.astro`. No opt-out.
4. **Independence disclaimer** in every footer, expanded on the About page: not affiliated with, endorsed by, or authorized by the United States courts or any judge.
5. **Citation plus link to a free public copy.** Never host a commercial version of an opinion.
6. **No characterization from appellate opinions.** Never describe an appellate opinion as authored by the district judge; state plainly when it is supplied only to show later history.
7. **No ideological inference** from an appointing president or a small sample of rulings.
8. **Nothing implying official status.** No court seals, no judicial photographs taken from court sites without a license, no "uscourts" in the domain, no typography imitating court letterhead.

---

## 11. Ownership and attribution

Three roles, independently swappable.

**Jay owns the infrastructure** — domain, registrar account, GitHub repository and Actions, and the CourtListener and PACER credentials.

**The firm is the sponsor of record.** It supplies the advertising attribution and carries the RPC 7.3 record-retention obligation. That sponsorship lives entirely in `firm.json`, consumed by one footer component, so it re-attaches to whatever firm employs Jay. Neutral tone does not exempt the site from the advertising rules.

**Jay rides as curator**, in `curator.json`, kept separate from the firm block so it persists when the firm block changes.

The footer block does four compliance jobs at once — discloses the advertising nature, names the curator, names the responsible sponsor, and disclaims any official or influence relationship:

> *Attorney Advertising. This independent reference is maintained by Jay R. McDaniel and sponsored by Scarinci Hollenbeck, LLC, [address], [phone]. It is not affiliated with, endorsed by, or authorized by the United States courts or any judge. Content is compiled from public sources; opinion summaries are written from the public opinions and are provided for general information, not as legal advice. Prior results do not guarantee a similar outcome. © 2026.*

---

## 12. Build order

1. Scaffold Astro, extract the tokens, build `Base.astro` with the banner and footer, and stand up `firm.json` and `curator.json`.
2. Define the content collections and schemas, partitioned by district from the first commit. Validate with Astro's content-collection typing so a malformed entry fails the build rather than rendering. Port the seed parser's quality-control gates into CI, including the cross-district canonical check.
3. Build the district judge template against Semper as the reference case — one significant decision with a partially-vacated appellate strip, one commercial entry in review, empty states elsewhere.
4. Build the magistrate template against Bongiovanni — partial biography confidence, order chips, count-capped categories, coverage note.
5. Load the validated seed into `src/content/districts/dnj/`: 24 judge records and 42 scored decisions, plus biographies, sources, and confidence flags from the research report.
6. Bench index, About, Attorney Advertising. Ship Phase 1.
7. Topic pages and the six intake-filter topics.
8. Ingestion scripts and the `review/pending/` gate. Phase 2.
9. Appellate-history and link-check jobs.
10. News module, behind the same gate. Phase 3.

Phase 1 ships with district-judge biographies and the report's verified decisions. Magistrate biographies are a fast-follow if they slow the launch.

---

## 13. Model and effort recommendation

Anthropic's current lineup, from the platform docs: Claude Opus 5 (`claude-opus-5`, $5/$25 per MTok, 1M context, 128K max output, May 2026 cutoff), Claude Sonnet 5 (`claude-sonnet-5`, $2/$10, 1M context), Claude Haiku 4.5 (`claude-haiku-4-5`, $1/$5, 200K context), and Claude Fable 5.1 above Opus at $10/$50. Model IDs carry no date suffix. Thinking is adaptive and on by default on the 5-series; `effort` is the recommended control for depth, and it defaults to `high`.

Effort levels run `low`, `medium`, `high`, `xhigh`, `max`. Effort governs every output token, including tool calls, so lower effort also means fewer and terser tool calls.

### For the build agent in Claude Code

**Opus 5 at `xhigh`** for the scaffold-through-templates work in steps 1 through 6. This is multi-file agentic coding with a long horizon, which is what `xhigh` exists for. Set `max_tokens` large — 64k is a reasonable starting point — because at `xhigh` the model needs room to think and act across tool calls, and note that thinking cannot be disabled at `xhigh` or `max` on Opus 5.

Step down to **Sonnet 5 at `high`** for well-scoped follow-on work: a single component, a unit test, a copy fix, a link-checker script. Sonnet 5 is 2.5x cheaper at intro pricing and holds quality on bounded tasks.

Do not use `max` here. On structured-output work it adds cost for small gains and can lead to overthinking.

### For the ingestion pipeline

Tier by task, because the token weight is wildly uneven. A full opinion in context is 5k to 40k input tokens; a headnote is 350 to 700 output tokens. Classification needs the metadata and the first few pages; headnote drafting needs the whole document.

| Job | Model | Effort | Why |
|---|---|---|---|
| Tag classification, disposition extraction | Haiku 4.5 | n/a | High volume, tight output schema, cheapest per call. Haiku does not take the effort parameter. |
| Headnote drafting, routine opinion | Sonnet 5 | `medium` | The token hog. A tight template plus the fixed style guide makes this structured extraction, where `medium` holds. |
| Headnote drafting, complex opinion | Opus 5 | `high` | Escalate on MDL, consolidated captions, multi-count criminal, or length over ~60 pages. |
| Appellate-history recheck | Sonnet 5 | `low` | Lookup plus structured output. |
| Link resolution and verification | Sonnet 5 | `low` | Mechanical. |
| Quarterly QC audit sampling published headnotes against their opinions | Opus 5 | `high` | Adversarial reading; worth the ceiling. |

### Token economics

Three levers, in order of size.

**Batch the initial backfill.** Roughly 200 to 400 headnotes at launch, with no latency requirement. The Message Batches API takes 50% off input and output. Run the full seed through it.

**Cache the prompt prefix.** The style guide, the two tag vocabularies, and the headnote template run to well over the 512-token minimum and are identical on every call. Cache reads cost $0.50/MTok against $5 input on Opus 5 — a 10x reduction on the fixed portion of every request.

**Hold effort constant within a cached conversation.** Changing top-level effort between requests invalidates the cache. Vary effort across workloads, not within one. Opus 5 does support per-message effort changes that preserve the cache, behind the `mid-conversation-output-config-2026-07-01` beta header, if a run genuinely needs to shift mid-session.

Two operating notes. Run a fresh effort sweep on your own evals rather than carrying settings over from an earlier model. And on Opus 5, effort controls thinking volume, not visible response length — prompt for the 250-to-500-word headnote length explicitly; do not expect a lower effort setting to produce it.

Sources: `platform.claude.com/docs/en/models/opus-5/overview`, `platform.claude.com/docs/en/build-with-claude/effort`, `platform.claude.com/docs/en/build-with-claude/prompt-caching`, `platform.claude.com/docs/en/build-with-claude/batch-processing`.

---

## 14. Open decisions

- **Domain.** `federalbenchreference.com` recommended; point `njfederalbench.com` at `/districts/dnj/`; `thefederalbench.com` as fallback.
- **District order and timing** after D.N.J. — SDNY or EDNY first, and what "steady state" means before the next one starts.
- **Whether the classification label renders publicly.** Recommendation: publish the qualification rationale, suppress both the numerical score and the band label.
- **Magistrate biographies at launch,** or fast-follow.
- **CourtListener membership tier,** which sets the API rate limit.
- **Firm block contents** — exact sponsor name, address, phone, and advertising-notice language.
- **Review-gate owner and turnaround.**
- **Whether the district judge page leads with significant or with matter-relevant decisions.** The mockups lead with significant; the letter's reader may be better served by matter-relevant first.
- **Topic pages in Phase 1,** or with the ingestion pipeline in Phase 2.

---

*Confirm Section 14, then build in the Section 12 order. Where this document and `fedbenchjudgetemplate.html` differ on appearance, the template wins. Where this document and the research report differ on fact, the report wins.*
