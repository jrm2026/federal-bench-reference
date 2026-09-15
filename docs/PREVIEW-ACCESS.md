# Preview access

The site is not launched, and until it is, nobody reaches it without
credentials. `worker/index.js` requires HTTP Basic authentication on every
request — pages, stylesheets, favicon, `robots.txt`, all of it — and only then
hands the request to the static assets. What renders behind the gate is the
finished site, byte for byte, because the gate sits in front of the same build
that will eventually be public.

This replaces the vaguer plan recorded in the launch checklist, which spoke of
putting the site behind Cloudflare Access. Access is the better long-term
answer if more than one person needs in, because it authenticates against an
identity rather than a shared string and it logs who looked. For one reviewer it
is more machinery than the job needs.

## Setting the credentials

Two Workers secrets, `PREVIEW_USER` and `PREVIEW_PASSWORD`. Neither is in this
repository and neither should ever be. From a machine logged in to Cloudflare:

    npx wrangler secret put PREVIEW_USER
    npx wrangler secret put PREVIEW_PASSWORD

Each command prompts, reads the value without echoing it, and stores it
encrypted against the `federal-bench-reference` Worker. The same thing can be
done in the dashboard under Workers & Pages → federal-bench-reference →
Settings → Variables and Secrets → Add → Secret.

Secrets survive a redeploy. Set them once.

A Worker deployed without both secrets serves `503` to everyone, including
anyone holding the right password. That is deliberate. The only way a mistake
here can fall is closed.

## Reviewing

Open the site's URL. The browser asks for a name and password; the name is the
email the credentials were issued to. The browser then holds them for the rest
of the session, so the prompt appears once. Closing the browser ends it.

To review a change before it deploys, run the gate locally instead:

    cp .dev.vars.example .dev.vars     # fill in any values you like
    npm run build
    npx wrangler dev

`.dev.vars` is gitignored. Use throwaway values there; the real password has no
reason to sit on a laptop in a file.

## What the gate does to the security headers

Workers applies `public/_headers` to assets it serves directly, and stops
applying it to anything that passes through a Worker script. Adding this gate
would therefore have silently dropped the `X-Robots-Tag: noindex` header, which
is the launch switch.

So the Worker sets those headers itself, reading them from
`public/_headers` — `scripts/gen-edge-headers.mjs` compiles that file into
`worker/edge-headers.generated.js` on every build. There is still one place the
switch lives, and it is still `public/_headers`. Edit it and the Worker follows.

## Removing the gate at launch

Delete `main` and `assets.run_worker_first` from `wrangler.jsonc`, in a
deliberate commit of its own. Assets then serve directly again and `_headers`
applies to them the ordinary way, so `worker/` and the generator can go with it.

Deleting the secrets does not open the site — it takes the site down. That is
the intended asymmetry and not a bug to route around.

Do not do either before the last item on `docs/LAUNCH-CHECKLIST.md`. Removing
the password and removing the noindex header are two halves of the same
decision, and neither is Claude's to make.
