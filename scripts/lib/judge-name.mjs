/**
 * Is this the same judge, written two ways?
 *
 * The clerk's signature line and the judge's record do not agree on middle
 * names. "Signed by Judge Julien Xavier Neals" sits on a page headed Julien X.
 * Neals; Mary L. Cooper signs what the roster calls Mary Little Cooper. String
 * equality reads both as an attribution error and blocks a correct record.
 *
 * So compare what identifies a person: the surname and the given name must
 * match, and any middle names present in both must agree on their first letter,
 * which is all an initial discloses. A middle name on one side and nothing on
 * the other is not a conflict — it is the same judge written shorter.
 *
 * This still catches the case the gate exists for. Brian Trematore Plumbing is
 * filed under Martinotti and its 2021 opinion is signed by Vazquez; no
 * normalisation makes those one person.
 */

const clean = (s) => (s ?? '')
  .toLowerCase()
  // O'Hearn is written with a straight apostrophe by one source and a curly one
  // by another, and those are different characters. Drop them all; no two judges
  // on a federal bench are told apart by punctuation.
  .replace(/['\u2018\u2019\u02bc\u0060]/g, '')
  .replace(/\b(the\s+)?(honorable|hon|chief|senior|u\.?s\.?|district|magistrate|judge)\b\.?/g, ' ')
  .replace(/[.,]/g, ' ')
  .replace(/\b(jr|sr|ii|iii|iv)\b/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export function nameParts(s) {
  const p = clean(s).split(' ').filter(Boolean);
  if (p.length < 2) return null;
  return { first: p[0], middles: p.slice(1, -1), last: p[p.length - 1] };
}

export function sameJudge(a, b) {
  const x = nameParts(a), y = nameParts(b);
  if (!x || !y) return false;
  if (x.last !== y.last || x.first !== y.first) return false;
  // Compare only as far as both sides disclose. "xavier" and "x" agree.
  const n = Math.min(x.middles.length, y.middles.length);
  for (let i = 0; i < n; i++) if (x.middles[i][0] !== y.middles[i][0]) return false;
  return true;
}
