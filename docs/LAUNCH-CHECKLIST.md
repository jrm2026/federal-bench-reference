# Launch checklist

Nothing here is technical except the last item, and the last item is trivial.
That is the point: the site is technically ready long before it is ready.

## Repository

- [ ] Repository created under Jay's personal account, private, named
      `federal-bench-reference`. Not the firm's account. Section 10 of the build
      brief makes this the decision that keeps the asset portable.
- [ ] `.gitignore` committed before the first push, not after.
- [ ] Astro scaffold and this content layer land in the same repository.
- [ ] `COURTLISTENER_TOKEN` in Actions secrets. Never in the tree.
- [ ] Branch protection on `main`: require the Review gate check to pass.
      The gate is worth nothing if a push can go around it.

## Cloudflare

This is a Workers project, not Pages. Pages was the original target and the
difference is not cosmetic: `_headers` and `_redirects` are supported on both,
but Workers allows only relative URLs in `_redirects` and rejects the entire
file over one absolute rule.

- [ ] Workers Builds connected to the repository, production branch `main`.
- [ ] Build command `npm run build`. Deploy command `npx wrangler deploy`.
      The build command runs the review gate first and exit 1 blocks it; with
      the field empty there is no `dist/` and the deploy fails outright.
- [ ] Deploy to the `workers.dev` subdomain only. No custom domain yet.
- [ ] Cloudflare Access in front of the preview, limited to Jay and anyone
      reviewing. A preview URL is not a secret, and non-production branch builds
      mint one per branch.
- [ ] Confirm `public/_headers` is being served: a request to any page returns
      `X-Robots-Tag: noindex`. Verify this before anything else.

## Decisions that gate the public domain

None of these is Claude's to make.

- [ ] Domain chosen. `federalbenchreference.com` recommended in the brief;
      still open in Section 15. Registering it through Cloudflare puts it in an
      account Jay controls at cost.
- [ ] Firm block settled: exact sponsor name, address, telephone, and the
      advertising notice language. That block does four compliance jobs at once
      and it is bracketed in every draft so far. `src/content/config/firm.json`
      currently carries `[address]` and `[phone]`, and they render in the footer
      of every page beside the sponsor's full name. Gate 9 in
      `scripts/gates-compliance.mjs` warns about that while the preview stays
      shut and fails the build the moment either half of the launch gate comes
      off, so this cannot be forgotten at the last step — but it also cannot be
      answered by anyone but Jay.
- [ ] Curator block settled.
- [ ] Ownership acknowledgment executed. The clean moment to paper that this is
      Jay's personal business-development asset, sponsored by the firm during
      employment, is before the firm's name appears on a public URL.
- [ ] `REPLACE-WITH-DOMAIN` replaced in `public/robots.launch.txt`.
- [ ] Secondary domain pointed at the primary in Cloudflare Redirect Rules, so
      `njfederalbench.com` and the `www` forms land on the primary host rather
      than becoming a second indexable copy of the site. This lived in
      `public/_redirects` while the target was Pages. Workers allows only
      relative URLs there and rejects the entire file over a single absolute
      rule, so the cross-host redirects belong in the zone now.

## Content

- [ ] Roster confirmed. Batch 1 is done; recheck the Our Judges page and the
      Notices to the Bar together, because neither alone is current.
- [ ] Appellate postures rechecked. Batch 2 established the current state of the
      four flagship matters; three are suspended and all three will move.
- [ ] Biographies drafted from primary sources and reviewed.
- [ ] Case selection run against `docs/SELECTION-SPEC.md`, in `citation-only`
      display mode. Headnotes are not required at launch and are added per entry
      afterwards. A category published without summaries must be exhaustive —
      `exhaustive_for_category: true` — because a partial unsummarized list
      still implies a choice, and the gate enforces it.
- [ ] Link check run on a machine with open network access. Every opinion URL
      resolves to the correct case, and an archive URL is captured for each.
      The gate checks the host, not that the link works.
- [ ] Curator sign-off. At least one record at `verification_status: verified`
      with a named reviewer and date, or the site has nothing to publish.
- [ ] Read each finished page whole and ask the question the gate cannot:
      looking at this page, would a reader infer a tendency? Selection can imply
      a pattern with no numbers anywhere on it.

## Launch

- [ ] Custom domain attached in Cloudflare, DNS cut over.
- [ ] `public/robots.launch.txt` moved into place as `robots.txt`.
- [ ] `site` set in `astro.config.mjs` and `@astrojs/sitemap` added. It is unset
      on purpose until a domain exists; a canonical URL pointing at a host
      nobody owns is worse than no sitemap.
- [ ] Sitemap generating and referenced.
- [ ] Build with `INCLUDE_DRAFTS=0`. Drafts are rendered by default because the
      sign-off procedure requires reading the page rather than the JSON, and
      today every record is a draft. They carry their own noindex tag and
      `robots.launch.txt` disallows `/drafts/`, but robots is a request, not a
      lock: once the site is reachable without the preview gate, an unreviewed
      page about a sitting judge should not be on it at all.
- [ ] Remove the preview gate: delete `main` and `assets.run_worker_first` from
      `wrangler.jsonc`, and the `worker/` directory with them. Until this is
      done the site asks for a password on every request, which is the point.
      See `docs/PREVIEW-ACCESS.md`.
- [ ] **Remove the `X-Robots-Tag` line from `public/_headers`.**

Those last two lines are the whole gate, and they are two halves of one
decision: the password stops people, the header stops crawlers. Until both are
deleted the site is private no matter what else is true, and deleting them
should be its own commit with its own message, made deliberately and after
everything above.

## After launch

- [ ] Weekly gate run is already scheduled in the workflow; confirm it is
      reporting. Appellate staleness accrues while the repository sits still,
      which is the failure a push-triggered gate cannot see.
- [ ] Roster reconciliation monthly.
- [ ] Full FJC reconciliation, biography audit and link check quarterly.
