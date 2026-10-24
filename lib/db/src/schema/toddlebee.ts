import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const learningSessionsTable = pgTable(
  "toddlebee_learning_sessions",
  {
    id: text("id").primaryKey(),
    language: text("language").notNull(),
    grade: integer("grade").notNull().default(4),
    age: integer("age").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    sectionsCompleted: text("sections_completed")
      .array()
      .notNull()
      .default([]),
    isSample: boolean("is_sample").notNull().default(false),
  },
  (table) => [index("toddlebee_sessions_started_idx").on(table.startedAt)],
);

export const learningEventsTable = pgTable(
  "toddlebee_learning_events",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => learningSessionsTable.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    sectionId: text("section_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("toddlebee_events_session_idx").on(table.sessionId)],
);

export const quizAttemptsTable = pgTable(
  "toddlebee_quiz_attempts",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => learningSessionsTable.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull(),
    concept: text("concept").notNull(),
    selectedAnswer: text("selected_answer").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    attemptNumber: integer("attempt_number").notNull(),
    hintUsed: boolean("hint_used").notNull().default(false),
    responseTimeMs: integer("response_time_ms"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("toddlebee_attempts_session_idx").on(table.sessionId),
    index("toddlebee_attempts_question_idx").on(table.sessionId, table.questionId),
  ],
);

export const agentActivityTable = pgTable(
  "toddlebee_agent_activity",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").references(() => learningSessionsTable.id, {
      onDelete: "set null",
    }),
    provider: text("provider").notNull().default("local_demo"),
    externalRunId: text("external_run_id"),
    status: text("status").notNull(),
    summary: text("summary").notNull(),
    needsHumanReview: boolean("needs_human_review").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("toddlebee_agent_activity_created_idx").on(table.createdAt)],
);

export const educatorReviewsTable = pgTable(
  "toddlebee_educator_reviews",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => learningSessionsTable.id, { onDelete: "cascade" }),
    concept: text("concept").notNull(),
    language: text("language").notNull().default("en"),
    attemptSummary: text("attempt_summary").notNull(),
    proposedExplanation: text("proposed_explanation").notNull(),
    approvedExplanation: text("approved_explanation"),
    reason: text("reason").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    isSample: boolean("is_sample").notNull().default(false),
  },
  (table) => [
    index("toddlebee_reviews_status_idx").on(table.status),
    index("toddlebee_reviews_session_idx").on(table.sessionId),
  ],
);

export const insertLearningSessionSchema = createInsertSchema(
  learningSessionsTable,
).omit({ startedAt: true });
export const insertLearningEventSchema = createInsertSchema(
  learningEventsTable,
).omit({ createdAt: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttemptsTable).omit({
  createdAt: true,
});
export const insertAgentActivitySchema = createInsertSchema(
  agentActivityTable,
).omit({ createdAt: true });
export const insertEducatorReviewSchema = createInsertSchema(
  educatorReviewsTable,
).omit({ createdAt: true, reviewedAt: true });

export type InsertLearningSession = z.infer<typeof insertLearningSessionSchema>;
export type LearningSession = typeof learningSessionsTable.$inferSelect;
export type InsertLearningEvent = z.infer<typeof insertLearningEventSchema>;
export type LearningEvent = typeof learningEventsTable.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttemptsTable.$inferSelect;
export type InsertAgentActivity = z.infer<typeof insertAgentActivitySchema>;
export type AgentActivity = typeof agentActivityTable.$inferSelect;
export type InsertEducatorReview = z.infer<typeof insertEducatorReviewSchema>;
export type EducatorReview = typeof educatorReviewsTable.$inferSelect;
