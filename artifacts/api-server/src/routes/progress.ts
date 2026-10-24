import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Router, type IRouter, type Response } from "express";
import {
  DecideEducatorReviewBody,
  DecideEducatorReviewParams,
  DecideEducatorReviewResponse,
  GetAgentActivityResponse,
  GetLearningProgressResponse,
  ListEducatorReviewsResponse,
} from "@workspace/api-zod";
import {
  agentActivityTable,
  db,
  educatorReviewsTable,
  learningSessionsTable,
  quizAttemptsTable,
} from "@workspace/db";

const router: IRouter = Router();

function invalid(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

const SAMPLE_PROGRESS = {
  lessonsStarted: 2,
  lessonsCompleted: 1,
  questionsAttempted: 6,
  firstAttemptAccuracy: 0.6,
  finalAccuracy: 0.8,
  hintsUsed: 2,
  learningMinutes: 14,
  isSampleData: true,
  concepts: [
    { concept: "fraction parts", status: "improving", attempts: 2 },
    { concept: "numerator", status: "understood", attempts: 1 },
    { concept: "denominator", status: "understood", attempts: 1 },
    { concept: "equivalent fractions", status: "needs_practice", attempts: 2 },
  ],
  recentSessions: [
    {
      id: "sample-fractions-session",
      lessonTitle: "Discover Fractions",
      startedAt: new Date().toISOString(),
      isSample: true,
    },
  ],
};

router.get("/progress", async (req, res): Promise<void> => {
  const rawSessionIds =
    typeof req.query.sessionIds === "string" ? req.query.sessionIds.trim() : "";
  const requestedIds = rawSessionIds
    ? [...new Set(rawSessionIds.split(",").map((id) => id.trim()).filter(Boolean))]
    : [];
  if (requestedIds.length === 0) {
    res.json(GetLearningProgressResponse.parse(SAMPLE_PROGRESS));
    return;
  }
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (
    requestedIds.length > 20 ||
    requestedIds.some((id) => !uuidPattern.test(id))
  ) {
    invalid(res, "Provide up to 20 valid learning session IDs.");
    return;
  }
  const sessions = await db
    .select()
    .from(learningSessionsTable)
    .where(
      and(
        eq(learningSessionsTable.isSample, false),
        inArray(learningSessionsTable.id, requestedIds),
      ),
    )
    .orderBy(desc(learningSessionsTable.startedAt));
  if (sessions.length === 0) {
    res.status(404).json({ error: "No matching learning sessions found." });
    return;
  }
  const attempts = await db
    .select()
    .from(quizAttemptsTable)
    .where(inArray(quizAttemptsTable.sessionId, sessions.map((session) => session.id)))
    .orderBy(desc(quizAttemptsTable.createdAt));
  const sessionIds = new Set(sessions.map((session) => session.id));
  const actualAttempts = attempts.filter((attempt) => sessionIds.has(attempt.sessionId));

  const byQuestion = new Map<string, typeof actualAttempts>();
  for (const attempt of actualAttempts) {
    const key = `${attempt.sessionId}:${attempt.questionId}`;
    const group = byQuestion.get(key) ?? [];
    group.push(attempt);
    byQuestion.set(key, group);
  }
  const firstAttempts = [...byQuestion.values()].map((group) =>
    group.reduce((first, current) =>
      current.attemptNumber < first.attemptNumber ? current : first,
    ),
  );
  const finalAttempts = [...byQuestion.values()].map((group) =>
    group.reduce((last, current) =>
      current.attemptNumber > last.attemptNumber ? current : last,
    ),
  );
  const firstCorrect = firstAttempts.filter((attempt) => attempt.isCorrect).length;
  const finalCorrect = finalAttempts.filter((attempt) => attempt.isCorrect).length;
  const conceptGroups = new Map<string, typeof actualAttempts>();
  for (const attempt of actualAttempts) {
    const group = conceptGroups.get(attempt.concept) ?? [];
    group.push(attempt);
    conceptGroups.set(attempt.concept, group);
  }
  const concepts = [...conceptGroups.entries()].map(([concept, group]) => {
    const latest = group.reduce((last, current) =>
      current.createdAt > last.createdAt ? current : last,
    );
    const hadWrongAnswer = group.some((attempt) => !attempt.isCorrect);
    return {
      concept,
      status: latest.isCorrect
        ? hadWrongAnswer
          ? "improving"
          : "understood"
        : "needs_practice",
      attempts: group.length,
    };
  });
  const learningMinutes = sessions.reduce((total, session) => {
    const end = session.completedAt ?? new Date();
    const minutes = Math.max(
      0,
      Math.min(90, Math.round((end.getTime() - session.startedAt.getTime()) / 60_000)),
    );
    return total + minutes;
  }, 0);

  res.json(
    GetLearningProgressResponse.parse({
      lessonsStarted: sessions.length,
      lessonsCompleted: sessions.filter((session) => session.completedAt).length,
      questionsAttempted: actualAttempts.length,
      firstAttemptAccuracy:
        firstAttempts.length > 0 ? firstCorrect / firstAttempts.length : 0,
      finalAccuracy: finalAttempts.length > 0 ? finalCorrect / finalAttempts.length : 0,
      hintsUsed: actualAttempts.filter((attempt) => attempt.hintUsed).length,
      learningMinutes,
      isSampleData: false,
      concepts,
      recentSessions: sessions.slice(0, 5).map((session) => ({
        id: session.id,
        lessonTitle: "Discover Fractions",
      startedAt: session.startedAt.toISOString(),
        isSample: false,
      })),
    }),
  );
});

router.get("/agent/activity", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(agentActivityTable)
    .orderBy(desc(agentActivityTable.createdAt))
    .limit(30);
  res.json(
    GetAgentActivityResponse.parse(
      rows.map((row) => ({
        id: row.id,
        provider: row.provider === "agenticorg" ? "agenticorg" : "local_demo",
        externalRunId: row.externalRunId,
        status: row.status,
        summary: row.summary,
        createdAt: row.createdAt.toISOString(),
        needsHumanReview: row.needsHumanReview,
      })),
    ),
  );
});

router.get("/educator/reviews", async (_req, res): Promise<void> => {
  const reviews = await db
    .select()
    .from(educatorReviewsTable)
    .orderBy(desc(educatorReviewsTable.createdAt))
    .limit(50);
  res.json(
    ListEducatorReviewsResponse.parse(
      reviews.map((review) => ({
        id: review.id,
        concept: review.concept,
        attemptSummary: review.attemptSummary,
        proposedExplanation: review.proposedExplanation,
        approvedExplanation: review.approvedExplanation,
        reason: review.reason,
        status: review.status,
        createdAt: review.createdAt.toISOString(),
        reviewedAt: review.reviewedAt?.toISOString() ?? null,
        isSample: review.isSample,
      })),
    ),
  );
});

router.post("/educator/reviews/:id/decision", async (req, res): Promise<void> => {
  const params = DecideEducatorReviewParams.safeParse(req.params);
  const body = DecideEducatorReviewBody.safeParse(req.body);
  if (!params.success) {
    invalid(res, params.error.message);
    return;
  }
  if (!body.success) {
    invalid(res, body.error.message);
    return;
  }
  if (body.data.decision === "edit" && !body.data.explanation?.trim()) {
    invalid(res, "Add an explanation before saving an edited recommendation.");
    return;
  }
  const [existing] = await db
    .select()
    .from(educatorReviewsTable)
    .where(eq(educatorReviewsTable.id, params.data.id))
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "Educator review not found" });
    return;
  }
  const status =
    body.data.decision === "approve"
      ? "approved"
      : body.data.decision === "edit"
        ? "edited"
        : "rejected";
  const approvedExplanation =
    body.data.decision === "approve"
      ? existing.proposedExplanation
      : body.data.decision === "edit"
        ? body.data.explanation!.trim()
        : null;
  const [updated] = await db
    .update(educatorReviewsTable)
    .set({ status, approvedExplanation, reviewedAt: new Date() })
    .where(eq(educatorReviewsTable.id, existing.id))
    .returning();

  await db.insert(agentActivityTable).values({
    id: randomUUID(),
    sessionId: existing.sessionId,
    provider: "local_demo",
    externalRunId: null,
    status: "human_reviewed",
    summary: `Educator ${status} a locally simulated intervention.`,
    needsHumanReview: false,
  });
  res.json(
    DecideEducatorReviewResponse.parse({
      id: updated.id,
      concept: updated.concept,
      attemptSummary: updated.attemptSummary,
      proposedExplanation: updated.proposedExplanation,
      approvedExplanation: updated.approvedExplanation,
      reason: updated.reason,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      reviewedAt: updated.reviewedAt?.toISOString() ?? null,
      isSample: updated.isSample,
    }),
  );
});

export default router;
