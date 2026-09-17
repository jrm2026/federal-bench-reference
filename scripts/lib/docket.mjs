/**
 * Docket numbers, written the several ways lawyers write them.
 *
 * A D.N.J. civil docket looks like 2:22-cv-05785, but the leading digit is only
 * the vicinage — Newark, Trenton, Camden — and is dropped as often as it is
 * written. The clerk zero-pads the sequence and nobody else does. So one case
 * appears as
 *
 *     2:22-cv-05785    22-cv-05785    2:22-cv-5785    22-cv-5785
 *
 * and a matcher comparing strings sees four cases. That is not hypothetical:
 * searching for Antar under the padded form found nothing, and the entry sat
 * in the corpus for a week as "no docket, nothing to resolve from".
 *
 * Compare on the parts that identify the case — year, type, sequence — and
 * treat the vicinage as what it is, a filing location that can change when a
 * case is transferred. ANJRPC is carried by GovInfo under both 1_ and 3_ for
 * exactly that reason.
 */

const PARTS = /(?:(\d):)?(\d{2})-([a-z]{2,3})-0*(\d+)/i;

/** "2:22-cv-05785" -> { vicinage: "2", year: "22", type: "cv", seq: "5785" } */
export function parseDocket(s) {
  const m = PARTS.exec(s ?? '');
  if (!m) return null;
  return { vicinage: m[1] ?? null, year: m[2], type: m[3].toLowerCase(), seq: String(Number(m[4])) };
}

/** The identity of a docket, ignoring vicinage and zero-padding: "22-cv-5785". */
export function normalizeDocket(s) {
  const p = parseDocket(s);
  return p ? `${p.year}-${p.type}-${p.seq}` : null;
}

/** Same case? Vicinage differs when a case is transferred, so it is not part of this. */
export function sameDocket(a, b) {
  const x = normalizeDocket(a), y = normalizeDocket(b);
  return Boolean(x && y && x === y);
}

/** Every form worth searching for, longest first. */
export function docketVariants(s) {
  const p = parseDocket(s);
  if (!p) return [];
  const padded = p.seq.padStart(5, '0');
  const out = new Set();
  for (const seq of [padded, p.seq]) {
    out.add(`${p.year}-${p.type}-${seq}`);
    if (p.vicinage) out.add(`${p.vicinage}:${p.year}-${p.type}-${seq}`);
  }
  return [...out];
}
