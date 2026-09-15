/**
 * Preview gate for the Federal Bench Reference.
 *
 * The site is not launched. Forty-one pages about sitting judges, none of them
 * yet carrying a curator sign-off, should not be reachable by anyone who has
 * not been handed the credentials. `X-Robots-Tag: noindex` asks crawlers to
 * stay away; this makes them, and everyone else, unable to read it at all.
 *
 * HTTP Basic authentication over TLS, checked against two Workers secrets.
 * Nothing about the credentials lives in this repository — see
 * docs/PREVIEW-ACCESS.md for how they are set.
 *
 * Two properties worth keeping if this is ever edited.
 *
 * It fails closed. A Worker deployed without its secrets serves 503 to
 * everybody rather than serving the site to everybody. That is the same rule
 * scripts/gates-compliance.mjs applies to a missing gate file, and it is the
 * only safe direction for a mistake to fall.
 *
 * It sets the security headers itself. Workers stops applying `public/_headers`
 * to responses once a Worker script is in front of the assets, so the noindex
 * header would silently disappear the day this file was added. The rules are
 * compiled from that same file by scripts/gen-edge-headers.mjs on every build,
 * so `public/_headers` remains the one place the launch switch lives.
 *
 * Remove this gate at launch by deleting `main` and `run_worker_first` from
 * wrangler.jsonc. Deleting the secrets alone would take the site down, not open
 * it, which is the intended direction.
 */
import { EDGE_HEADER_RULES } from './edge-headers.generated.js';

const REALM = 'Federal Bench Reference — preview';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const user = env.PREVIEW_USER;
    const password = env.PREVIEW_PASSWORD;
    if (!user || !password) {
      return finish(url, new Response(
        'This preview has no credentials configured, so it serves nothing.\n',
        { status: 503, headers: plain() }));
    }

    if (!(await authorized(request, user, password))) {
      return finish(url, new Response('Authentication required.\n', {
        status: 401,
        headers: {
          ...plain(),
          'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
        },
      }));
    }

    return finish(url, await env.ASSETS.fetch(request));
  },
};

const plain = () => ({
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-store',
});

async function authorized(request, user, password) {
  const header = request.headers.get('Authorization') ?? '';
  const space = header.indexOf(' ');
  if (space < 0 || header.slice(0, space).toLowerCase() !== 'basic') return false;

  let decoded;
  try {
    const bytes = Uint8Array.from(atob(header.slice(space + 1)), (c) => c.charCodeAt(0));
    decoded = new TextDecoder().decode(bytes);
  } catch {
    return false;
  }

  const colon = decoded.indexOf(':');
  if (colon < 0) return false;

  // Both halves are always compared, and each comparison is over a digest of
  // fixed length, so neither the time nor the failure tells a caller which half
  // was wrong.
  const nameOk = await constantTimeEqual(decoded.slice(0, colon), user);
  const passOk = await constantTimeEqual(decoded.slice(colon + 1), password);
  return nameOk && passOk;
}

async function constantTimeEqual(a, b) {
  const encoder = new TextEncoder();
  const [x, y] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);
  const left = new Uint8Array(x);
  const right = new Uint8Array(y);
  let differences = 0;
  for (let i = 0; i < left.length; i++) differences |= left[i] ^ right[i];
  return differences === 0;
}

// `_headers` supports a splat at the end of a pattern and exact paths. Nothing
// in this repository uses more than `/*`, and the generator refuses a pattern
// this matcher cannot honour rather than letting one through unapplied.
function finish(url, response) {
  const out = new Response(response.body, response);
  for (const [pattern, headers] of EDGE_HEADER_RULES) {
    const matches = pattern.endsWith('*')
      ? url.pathname.startsWith(pattern.slice(0, -1))
      : url.pathname === pattern;
    if (!matches) continue;
    for (const [name, value] of headers) out.headers.set(name, value);
  }
  return out;
}
