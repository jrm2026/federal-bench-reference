import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

import taxonomy from './content/config/taxonomy.json';
const SUBJECT = taxonomy.subject.all as string[];
const PROC = taxonomy.procedural.all as string[];

const judges = defineCollection({
  loader: glob({ pattern: '**/judges/*.json', base: './src/content/districts' }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    district: z.string(),
    home_district: z.string(),
    designations: z.array(z.string()).default([]),
    canonical: z.boolean().default(true),
    office: z.enum(['district', 'magistrate', 'magistrate_part_time', 'magistrate_recalled']),
    roster_group: z.string().nullable(),
    vicinage: z.string().nullable(),
    roster_sources: z.array(z.string()),
    render_section: z.enum(['current_bench', 'fjc_reconciliation']),
    service_line_reviewed: z.string().nullable(),
    record_status: z.enum(['represented', 'developing', 'none_identified']),
    record_status_note: z.string().nullable(),
    declared_selected_count: z.number().nullable(),
    actual_selected_count: z.number(),
    link_from_mail: z.boolean(),
    role_line: z.string().optional(),
    biography: z.object({
      text: z.string(),
      education_sentences: z.array(z.string()).default([]),
      confidence: z.enum(['verified', 'partial', 'conflicted']),
      source_note: z.string().nullable(),
      sources: z.array(z.string().url()),
      source_labels: z.array(z.string()),
      last_verified: z.string(),
    }).optional(),
    other_writings: z.array(z.object({
      text: z.string(), url: z.string().url().nullable(),
    })).default([]),
    research_cutoff: z.string(),
  }),
});

const opinions = defineCollection({
  loader: glob({ pattern: '**/opinions/*.json', base: './src/content/districts' }),
  schema: z.object({
    id: z.string(),
    district: z.string(),
    judge_slug: z.string(),
    judge_name: z.string(),
    judge_office: z.enum(['district', 'magistrate']),
    caption: z.string(),
    citation_line: z.string(),
    // One docket field could hold either court's number, and a Third Circuit
    // docket came to stand in for the district one across a dozen records.
    // Identity and the district-decision rule both key on district_docket.
    district_docket: z.string().nullable(),
    appellate_docket: z.string().nullable(),
    additional_dockets: z.array(z.string()).default([]),
    // Which document on the district docket is the decision, and who signed it.
    // A docket's assigned judge is who holds the case now; the signature line on
    // the entry is who decided. Only the latter may attribute an entry.
    decision_ecf_number: z.string().nullable().default(null),
    decision_date: z.string().nullable().default(null),
    // Why this ECF number and not another on the same docket. Present only
    // where a curator chose among several reasoned opinions — the docket text
    // says what each document is, never which one an entry is about.
    decision_selection_note: z.string().nullable().default(null),
    authored_by: z.string().nullable().default(null),
    authorship_source: z.enum([
      'docket_entry_signature',   // "Signed by Judge X on DATE" on the docket
      'appellate_cover_page',     // "District Judge: Honorable X" on the appeal
      'opinion_text',             // the decision itself names its author
      'unverified',               // nothing above — may not publish
    ]).default('unverified'),
    reporter_cite: z.string().nullable(),
    court: z.string(),
    tier: z.enum(['significant', 'recent']),
    document_type: z.enum(['opinion', 'order', 'report_recommendation']),
    rr_disposition: z.enum(['adopted', 'modified', 'rejected', 'pending']).nullable(),
    headnote_district_ruling: z.string().nullable(),
    qualification_rationale: z.string().nullable(),
    appellate_posture_note: z.string().nullable(),
    headnote_status: z.enum(['draft', 'in_review', 'published', 'rejected']),
    public_url: z.string().url().nullable(),
    links: z.array(z.object({ anchor: z.string(), url: z.string().url() })),
    link_level: z.enum(['district', 'appellate_only', 'unlabeled']).nullish(),
    classification: z.enum(['major', 'noteworthy', 'qualifying', 'supplemental']).nullable(),
    score_total: z.number().nullable(),
    components: z.record(z.number()).default({}),
    subject_screen: z.enum(['qualifying', 'excluded']),
    subject_label: z.string().nullable(),
    subject_screen_exclusion_reason: z.string().nullish(),
    screen_score: z.number().nullish(),
    screen_classification: z.enum(['principal', 'useful', 'supplemental']).nullish(),
    screen_components: z.record(z.number()).nullish(),
    publish_subject_index: z.boolean(),
    subject_primary: z.enum(SUBJECT as [string, ...string[]]),
    subject_secondary: z.array(z.enum(SUBJECT as [string, ...string[]])).max(2),
    subject_index_only: z.boolean().default(false),
    procedural_tags: z.array(z.enum(PROC as [string, ...string[]])),
    motion_type: z.string().nullable(),
    disposition: z.string().nullable(),
    taxonomy_gap: z.string().nullable(),
    classification_pass: z.string().optional(),
    research_cutoff: z.string(),
    status_checked: z.string(),
    last_verified: z.string(),
  }),
});

export const collections = { judges, opinions };
