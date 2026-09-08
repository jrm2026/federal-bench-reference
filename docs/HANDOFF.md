# Desktop handoff

Everything below runs at your desk. None of it can run in a chat session:
there are no GitHub credentials there and network egress reaches package
registries only.

## 1. Repository

```sh
cd ~/projects
mkdir federal-bench-reference && cd federal-bench-reference
tar -xzf ~/Downloads/federal-bench-content.tar.gz --strip-components=1

# If the Astro scaffold from the earlier session survived, copy it in now.
# Scaffold and content layer belong in one repository, not two.

git init -b main
git add -A
git commit -m "Content layer, review gate, and deployment config"
```

Create the repository on GitHub under your personal account, **private**,
named `federal-bench-reference`. Section 10 of the build brief puts it under
your account rather than the firm's, and that is the decision that keeps the
asset portable. Then:

```sh
git remote add origin git@github.com:USERNAME/federal-bench-reference.git
git push -u origin main
```

Before anything else, replace `@REPLACE-WITH-GITHUB-USERNAME` in
`.github/CODEOWNERS` with your handle and push again.

## 2. Branch protection

Settings → Branches → add a rule for `main`:

- Require a pull request before merging
- Require status checks to pass: **Review gate / gate**
- Require review from Code Owners
- Include administrators

Without the last box the gate is advisory, and a direct push walks around every
control in this repository. That is the single most important setting here.

## 3. Secrets

Settings → Secrets and variables → Actions:

- `COURTLISTENER_TOKEN`

Never in the tree. `.gitignore` already excludes `.env`.

## 4. Cloudflare Pages

- Workers & Pages → Create → Pages → Connect to Git → select the repository
- Production branch `main`
- Build command and output directory per the Astro config
- Deploy to the `pages.dev` subdomain. **No custom domain yet.**
- Zero Trust → Access → add an application in front of the preview hostname,
  limited to you and anyone reviewing. A preview URL is not a secret.

Then verify the edge headers are live before you look at anything else:

```sh
curl -sI https://PROJECT.pages.dev/ | grep -i x-robots-tag
# expect: x-robots-tag: noindex, nofollow, noarchive
```

If that header is missing, stop and fix it. Forty-three pages of
"Biography in preparation" in Google's index is a problem you cannot quickly
undo.

## 5. First Claude Code session

Start with the link check. It is pure mechanism, it needs network access, and
it will surface dead GovInfo URLs that nothing else can find.

```sh
node scripts/check-links.mjs --archive --concurrency 3
```

Then hand over this brief:

> Read `docs/CORRECTIONS.md`, `docs/SELECTION-SPEC.md` and
> `docs/VERIFICATION-WORKLIST.md` before touching anything. CORRECTIONS records
> errors already found and fixed; `data/poison-list.json` blocks their return
> and the build fails if one reappears.
>
> Work in this order: fix or replace every dead link from
> `data/link-report.json`; then batch 3, the biographies, drafted from the FJC
> for Article III judges and from the court's own profiles and Notices to the
> Bar for magistrate judges; then batch 4, case selection under the selection
> spec.
>
> Batch by source, not by judge. One pass over the FJC covers twenty-four
> records. Working judge by judge means forty-three context switches through the
> same four sources.
>
> Rules that are not negotiable. Never set `verification_status` to `verified`
> and never write to `data/signoffs.json`; those are the curator's, and the gate
> checks the ledger rather than the reviewer field inside a record. Never take a
> fact from the prior research report without reading the primary source, and
> never take count numbers or case postures from press coverage. Run
> `node scripts/validate-content.mjs` before every commit. Small commits, one
> source pass each.
>
> When a source conflicts with another, say so and stop rather than choosing.
> Clark's law school is the live example: it is unresolved on purpose.

## 6. Signing

When a page is ready, read the rendered page rather than the JSON, then:

```sh
node scripts/sign-record.mjs renee-marie-bumb --reviewer "Jay R. McDaniel"
git add data/signoffs.json
git commit -m "Sign off: Bumb"
```

Sign in its own commit, never in the same commit that changes the content being
signed. The sign-off is bound to a hash of the publishable content, so any later
edit lapses it and the build blocks until you sign again.

## 7. What remains open

- Domain choice, still open from Section 15 of the build brief
- Firm block: sponsor name, address, telephone, advertising notice language
- Curator block
- The ownership acknowledgment, best papered before the firm's name is on a
  public URL
- Whether the ECF RSS feed at `ecf.njd.uscourts.gov/cgi-bin/rss_outside.pl`
  replaces the docket alert contemplated for the private pipeline

None of these is a task. They are decisions, and they are yours.
