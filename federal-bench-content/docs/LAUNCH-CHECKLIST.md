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

- [ ] Pages project connected to the repository, building from `main`.
- [ ] Build command and output directory match the Astro config.
- [ ] Deploy to the `pages.dev` subdomain only. No custom domain yet.
- [ ] Cloudflare Access in front of the preview, limited to Jay and anyone
      reviewing. A preview URL is not a secret.
- [ ] Confirm `public/_headers` is being served: a request to any page returns
      `X-Robots-Tag: noindex`. Verify this before anything else.

## Decisions that gate the public domain

None of these is Claude's to make.

- [ ] Domain chosen. `federalbenchreference.com` recommended in the brief;
      still open in Section 15. Registering it through Cloudflare puts it in an
      account Jay controls at cost.
- [ ] Firm block settled: exact sponsor name, address, telephone, and the
      advertising notice language. That block does four compliance jobs at once
      and it is bracketed in every draft so far.
- [ ] Curator block settled.
- [ ] Ownership acknowledgment executed. The clean moment to paper that this is
      Jay's personal business-development asset, sponsored by the firm during
      employment, is before the firm's name appears on a public URL.
- [ ] `REPLACE-WITH-DOMAIN` replaced in `public/_redirects` and
      `public/robots.launch.txt`.

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
- [ ] Sitemap generating and referenced.
- [ ] **Remove the `X-Robots-Tag` line from `public/_headers`.**

That last line is the whole gate. Until it is deleted the site is private no
matter what else is true, and deleting it should be its own commit with its own
message, made deliberately and after everything above it.

## After launch

- [ ] Weekly gate run is already scheduled in the workflow; confirm it is
      reporting. Appellate staleness accrues while the repository sits still,
      which is the failure a push-triggered gate cannot see.
- [ ] Roster reconciliation monthly.
- [ ] Full FJC reconciliation, biography audit and link check quarterly.
