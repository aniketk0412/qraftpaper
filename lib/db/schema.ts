import {
  integer,
  index,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import type { QuestionPaper, Quiz, SubjectProfile } from "@/lib/types";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  institution: text("institution"),
  // Education level + grade, captured at signup and effectively locked: a user
  // can change it at most once every ~6 months (enforced in the settings
  // action). educationLevel is "school" | "college"; educationGrade is the
  // class number ("1".."12") for school or a department id ("cse", …) for
  // college. Nullable so pre-existing users (and non-student accounts) simply
  // have no grade set.
  educationLevel: text("education_level"),
  educationGrade: text("education_grade"),
  educationGradeUpdatedAt: timestamp("education_grade_updated_at", {
    withTimezone: true,
  }),
  // Default to "unpaid" — a real plan only unlocks after the LemonSqueezy
  // webhook fires. signupAction sets this explicitly today, but the schema
  // default backs that up against any future insertion path.
  plan: text("plan").notNull().default("unpaid"),
  status: text("status").notNull().default("active"),
  role: text("role").notNull().default("teacher"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  lastLoginIp: text("last_login_ip"),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  domain: text("domain"),
  status: text("status").notNull().default("active"),
  plan: text("plan").notNull().default("unpaid"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("teacher"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("organization_members_org_user_idx").on(
      table.organizationId,
      table.userId,
    ),
    index("organization_members_user_id_idx").on(table.userId),
  ],
);

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    email: text("email").notNull(),
    role: text("role").notNull().default("teacher"),
    tokenHash: text("token_hash").notNull(),
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("invites_token_hash_idx").on(table.tokenHash),
    index("invites_email_idx").on(table.email),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("password_reset_tokens_hash_idx").on(table.tokenHash),
    index("password_reset_tokens_user_created_idx").on(table.userId, table.createdAt),
  ],
);

/** Single-use tokens sent to confirm a new signup owns the email address.
 *  Mirrors passwordResetTokens — hashed at rest, expires fast, marks `usedAt`
 *  on success and re-issues invalidate older unused tokens for the same user. */
export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("email_verification_tokens_hash_idx").on(table.tokenHash),
    index("email_verification_tokens_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code").notNull(),
  profile: jsonb("profile").$type<SubjectProfile>(),
  profileGeneratedAt: timestamp("profile_generated_at", { withTimezone: true }),
  // Optional: when the actual exam happens, drives the "X days to go"
  // countdown on the subject card. Pure date — no need for time-of-day.
  examDate: timestamp("exam_date", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("subjects_user_code_lower_idx").on(
    table.userId,
    sql`lower(${table.code})`,
  ),
]);

/**
 * One row per user per UTC day they did something meaningful (generated a
 * paper, took a quiz, regenerated a question). Used to compute the
 * Duolingo-style streak counter without scanning the entire papers / quizzes
 * history every dashboard render.
 *
 * UNIQUE (user_id, activity_date) — the streak code uses an UPSERT so
 * recording an action twice in the same day is a no-op.
 */
export const studyActivity = pgTable(
  "study_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityDate: timestamp("activity_date", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("study_activity_user_date_idx").on(table.userId, table.activityDate),
    index("study_activity_user_idx").on(table.userId),
  ],
);

/**
 * Server-side record of every shared-quiz attempt. The take/[id] route fires
 * one of these when a user finishes, so the quiz owner can see how many
 * people took their quiz and the score distribution. Anonymous takers get a
 * null userId.
 */
export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id").notNull(),
    // null when an anonymous visitor took a shared quiz link.
    takerUserId: uuid("taker_user_id"),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    durationSeconds: integer("duration_seconds"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("quiz_attempts_quiz_idx").on(table.quizId, table.createdAt),
    index("quiz_attempts_taker_idx").on(table.takerUserId, table.createdAt),
  ],
);

/**
 * Server-backed spaced repetition. One row per (user, origin question) the
 * user has missed — carrying both a SNAPSHOT of the question (so it can be
 * re-served even if the source quiz is deleted) and the SM-2 schedule
 * (ease/interval/reps/dueAt). This is the cross-device promotion of the
 * localStorage drill: study on your phone, the schedule follows you to your
 * laptop, and the per-question miss data becomes a real product signal.
 */
export const questionReviews = pgTable(
  "question_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Origin identifiers — the quiz may later be deleted; we keep the snapshot
    // below regardless, so quizId is a plain column (no FK).
    quizId: text("quiz_id").notNull(),
    questionId: text("question_id").notNull(),
    // Question snapshot — enough to re-render the question in a drill.
    prompt: text("prompt").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    correctIndex: integer("correct_index").notNull(),
    unit: text("unit").notNull(),
    difficulty: text("difficulty").notNull(),
    explanation: text("explanation").notNull(),
    subjectCode: text("subject_code").notNull(),
    // SM-2 schedule (see lib/spaced-repetition).
    ease: real("ease").notNull().default(2.5),
    intervalDays: integer("interval_days").notNull().default(0),
    reps: integer("reps").notNull().default(0),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // One review row per question per user — upserts key on this.
    uniqueIndex("question_reviews_user_question_idx").on(
      table.userId,
      table.quizId,
      table.questionId,
    ),
    // The hot read: "what's due for this user right now", ordered by dueAt.
    index("question_reviews_user_due_idx").on(table.userId, table.dueAt),
  ],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    fileName: text("file_name").notNull(),
    // Vestigial. We used to store the raw PDF as base64 here (multi-MB per
    // row) but nothing ever reads it back — only extractedText is used, for
    // the profile build. Now nullable and left unwritten so new uploads don't
    // bloat the table. Can be dropped entirely in a later migration once
    // existing rows are confirmed unneeded.
    contentBase64: text("content_base64"),
    extractedText: text("extracted_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // Documents are looked up by their parent subject during profile build —
    // small N per subject but every generation needs them.
    index("documents_subject_idx").on(table.subjectId),
  ],
);

export const papers = pgTable(
  "papers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    config: jsonb("config"),
    content: jsonb("content").$type<QuestionPaper>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // Dashboard pulls "recent papers for user, newest first" and the papers
    // page paginates the same way — composite index covers both.
    index("papers_user_created_idx").on(table.userId, table.createdAt),
    // assertSubjectPaperLimit + the per-subject papers list both filter on
    // (userId, subjectId).
    index("papers_user_subject_idx").on(table.userId, table.subjectId),
  ],
);

export const quizzes = pgTable(
  "quizzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: jsonb("content").$type<Quiz>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("quizzes_user_created_idx").on(table.userId, table.createdAt),
    index("quizzes_user_subject_idx").on(table.userId, table.subjectId),
  ],
);

export const usage = pgTable(
  "usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    month: text("month").notNull(),
    generations: integer("generations").notNull().default(0),
  },
  (table) => [uniqueIndex("usage_user_id_month_idx").on(table.userId, table.month)],
);

export const aiUsageEvents = pgTable(
  "ai_usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    subjectId: uuid("subject_id").references(() => subjects.id, {
      onDelete: "set null",
    }),
    paperId: uuid("paper_id").references(() => papers.id, { onDelete: "set null" }),
    quizId: uuid("quiz_id").references(() => quizzes.id, { onDelete: "set null" }),
    operation: text("operation").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
    estimatedCostCents: integer("estimated_cost_cents").notNull().default(0),
    status: text("status").notNull().default("succeeded"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("ai_usage_events_user_created_idx").on(table.userId, table.createdAt),
    index("ai_usage_events_subject_created_idx").on(
      table.subjectId,
      table.createdAt,
    ),
  ],
);

export const generationJobs = pgTable(
  "generation_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    subjectId: uuid("subject_id").references(() => subjects.id, {
      onDelete: "set null",
    }),
    paperId: uuid("paper_id").references(() => papers.id, { onDelete: "set null" }),
    quizId: uuid("quiz_id").references(() => quizzes.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    status: text("status").notNull().default("queued"),
    input: jsonb("input"),
    error: text("error"),
    // Client IP at request time. Nullable (older rows + jobs created off-request
    // have none). Used by the per-IP generation rate limit so abuse can't be
    // spread across freshly-created accounts from a single host.
    ipAddress: text("ip_address"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("generation_jobs_user_created_idx").on(table.userId, table.createdAt),
    index("generation_jobs_status_created_idx").on(table.status, table.createdAt),
    // Backs the per-IP hourly paper limit: count by (ip, type) in a time window.
    index("generation_jobs_ip_created_idx").on(table.ipAddress, table.createdAt),
  ],
);

export const paperVersions = pgTable(
  "paper_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paperId: uuid("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    content: jsonb("content").$type<QuestionPaper>().notNull(),
    reason: text("reason").notNull().default("save"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("paper_versions_paper_created_idx").on(table.paperId, table.createdAt)],
);

export const quizVersions = pgTable(
  "quiz_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    content: jsonb("content").$type<Quiz>().notNull(),
    reason: text("reason").notNull().default("save"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("quiz_versions_quiz_created_idx").on(table.quizId, table.createdAt)],
);

export const subjectProfileVersions = pgTable(
  "subject_profile_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    profile: jsonb("profile").$type<SubjectProfile>().notNull(),
    sourceHash: text("source_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("subject_profile_versions_subject_created_idx").on(
      table.subjectId,
      table.createdAt,
    ),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("audit_logs_user_created_idx").on(table.userId, table.createdAt),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lemonSubscriptionId: text("lemon_subscription_id").notNull(),
    lemonCustomerId: text("lemon_customer_id"),
    lemonVariantId: text("lemon_variant_id"),
    plan: text("plan").notNull().default("educator"),
    status: text("status").notNull().default("active"),
    renewsAt: timestamp("renews_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("subscriptions_lemon_subscription_id_idx").on(
      table.lemonSubscriptionId,
    ),
    index("subscriptions_user_id_idx").on(table.userId),
  ],
);

export const billingEvents = pgTable(
  "billing_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventName: text("event_name").notNull(),
    dedupeKey: text("dedupe_key").notNull(),
    payload: jsonb("payload"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex("billing_events_dedupe_key_idx").on(table.dedupeKey)],
);
