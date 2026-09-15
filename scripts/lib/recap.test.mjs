#!/usr/bin/env node
/**
 * What counts as a decision on the merits.
 *
 *   node scripts/lib/recap.test.mjs
 *
 * Every case here came out of real search output, and the filter was widened
 * twice by reading that output rather than by reasoning about it. Without this
 * file the next tightening silently undoes the last one.
 */
import { classify } from './recap.mjs';

const CASES = [
  // Decisions. These are what the tier is for.
  ['OPINION.  Signed by Judge Brian R. Martinotti on 9/4/2026. (dnw)', true],
  ["OPINION  re Plaintiff's  4   Motion for a TRO and expedited discovery.  Signed by Judge Julien Xavier Neals on 9/8/2026.", true],
  ['OPINION & ORDER denying  5   Motion for Preliminary Injunction. Signed by Judge Jamel K. Semper on 6/17/2026.', true],
  // A dismissal that transfers for venue is still a decision, and venue is the
  // first thing an out-of-state defendant wants to know. Whether it belongs
  // under the subject that found it is a tagging question for the curator.
  ['OPINION & ORDER granting  8  motion to dismiss; transferring this matter to the U.S. District Court for the Eastern District of Texas.  Signed by Judge Claire C. Cecchi on 8/21/2026.', true],

  // Real opinions, by the right judge, in the right case — about procedure.
  ['OPINION AND ORDER granting  149   Motion to Seal. Signed by Judge Christine P. O Hearn on 7/9/2026.', false],
  ['MEMORANDUM OPINION AND ORDER denying 104 Motion to Compel.', false],
  ['MEMORANDUM OPINION AND ORDER granting in part and denying in part 100 Motion for Attorney Fees;', false],
  ['OPINION AND ORDER granting  7   Motion Seeking Leave To Serve A Third Party Subpoena Prior To A Rule 26(f) Conference. Signed by Magistrate Judge Matthew J. Skahill on 8/27/2026.', false],
  ['LETTER OPINION AND ORDER granting  5   Motion for Discovery. Signed by Magistrate Judge Michael A. Hammer on 7/27/2026.', false],
  ['LETTER OPINION & ORDER that Clean-Tex will amend its answers to RFAs 4-5 ... amended Scheduling Order', false],

  // Not decisions at all.
  ['MOTION for Reconsideration re 89 Order on Motion to Dismiss,,,,, 88 Memorandum, Opinion by 21ST CENTURY', false],
  ['MEMORANDUM in Support filed by KLEISSNER INVESTMENTS S.R.O. re 61 Joint MOTION to Seal', false],
  ['MOTION to Seal Document [906] Opinion by OPTUM360, LLC', false],
  ['Cross MOTION for Issuance of Letters Rogatory', false],
  ['Letter from Melissa A. Geist to The Honorable Brian R. Martinotti', false],
  ['COMPLAINT against COVINGTON RE, LLC', false],
  ['AO121 Copyright Form filed.', false],
  ['REPLY BRIEF to Opposition to Motion filed by SECURITIES AND EXCHANGE COMMISSION', false],
];

let failed = 0;
for (const [description, want] of CASES) {
  const got = classify(description);
  if (got !== want) { failed++; console.error(`want ${want}, got ${got}: ${description.slice(0, 72)}`); }
}
console.log(failed ? `${failed} of ${CASES.length} wrong` : `${CASES.length} descriptions classified correctly`);
process.exit(failed ? 1 : 0);
