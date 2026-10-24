import { randomUUID } from "node:crypto";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { Router, type IRouter, type Response } from "express";
import {
  CreateLearningSessionBody,
  CreateLearningSessionResponse,
  ExplainConceptBody,
  ExplainConceptResponse,
  GetFractionsLessonQueryParams,
  GetFractionsLessonResponse,
  ListLessonsResponse,
  ListQuizQuestionsQueryParams,
  ListQuizQuestionsResponse,
  RecordLearningEventBody,
  RecordLearningEventParams,
  RecordLearningEventResponse,
  RequestInterventionBody,
  RequestInterventionResponse,
  SubmitQuizAnswerBody,
  SubmitQuizAnswerResponse,
} from "@workspace/api-zod";
import {
  agentActivityTable,
  db,
  educatorReviewsTable,
  learningEventsTable,
  learningSessionsTable,
  quizAttemptsTable,
} from "@workspace/db";
import {
  getAlternative,
  getLesson,
  getQuestion,
  getQuizQuestions,
  type Language,
} from "../lib/toddlebee-content";
import { requestAgenticOrgExplanation } from "../lib/agenticorg";

const router: IRouter = Router();

function invalid(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

router.get("/lessons", (_req, res): void => {
  res.json(
    ListLessonsResponse.parse([
      {
        id: "fractions-grade-4",
        title: "Discover Fractions",
        grade: 4,
        subject: "Mathematics",
        durationMinutes: 12,
      },
    ]),
  );
});

router.get("/lessons/fractions", (req, res): void => {
  const query = GetFractionsLessonQueryParams.safeParse(req.query);
  if (!query.success) {
    invalid(res, query.error.message);
    return;
  }
  res.json(GetFractionsLessonResponse.parse(getLesson(query.data.language as Language)));
});

router.get("/quiz/questions", (req, res): void => {
  const query = ListQuizQuestionsQueryParams.safeParse(req.query);
  if (!query.success) {
    invalid(res, query.error.message);
    return;
  }
  res.json(
    ListQuizQuestionsResponse.parse(
      getQuizQuestions(query.data.language as Language),
    ),
  );
});

router.post("/sessions", async (req, res): Promise<void> => {
  const body = CreateLearningSessionBody.safeParse(req.body);
  if (!body.success) {
    invalid(res, body.error.message);
    return;
  }
  const id = randomUUID();
  const [session] = await db
    .insert(learningSessionsTable)
    .values({
      id,
      language: body.data.language,
      grade: body.data.grade,
      age: body.data.age,
      sectionsCompleted: [],
      isSample: false,
    })
    .returning();
  req.log.info({ sessionId: session.id }, "Learning session started");
  res.status(201).json(
    CreateLearningSessionResponse.parse({
      id: session.id,
      language: session.language,
      grade: session.grade,
      age: session.age,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
      completedSections: session.sectionsCompleted,
      isSample: session.isSample,
    }),
  );
});

router.post("/sessions/:id/events", async (req, res): Promise<void> => {
  const params = RecordLearningEventParams.safeParse(req.params);
  const body = RecordLearningEventBody.safeParse(req.body);
  if (!params.success) {
    invalid(res, params.error.message);
    return;
  }
  if (!body.success) {
    invalid(res, body.error.message);
    return;
  }
  const [session] = await db
    .select()
    .from(learningSessionsTable)
    .where(eq(learningSessionsTable.id, params.data.id))
    .limit(1);
  if (!session) {
    res.status(404).json({ error: "Learning session not found" });
    return;
  }
  if (body.data.type === "language_changed" && !body.data.language) {
    invalid(res, "Choose a language for this learning session.");
    return;
  }
  const [event] = await db
    .insert(learningEventsTable)
    .values({
      id: randomUUID(),
      sessionId: session.id,
      type: body.data.type,
      sectionId: body.data.sectionId ?? null,
    })
    .returning();

  const sectionsCompleted = [...session.sectionsCompleted];
  if (
    body.data.type === "section_completed" &&
    body.data.sectionId &&
    !sectionsCompleted.includes(body.data.sectionId)
  ) {
    sectionsCompleted.push(body.data.sectionId);
  }
  const completedAt =
    body.data.type === "lesson_completed" ? new Date() : session.completedAt;
  if (sectionsCompleted.length || completedAt) {
    await db
      .update(learningSessionsTable)
      .set({
        sectionsCompleted,
        completedAt,
        ...(body.data.type === "language_changed" && body.data.language
          ? { language: body.data.language }
          : {}),
      })
      .where(eq(learningSessionsTable.id, session.id));
  } else if (body.data.type === "language_changed" && body.data.language) {
    await db
      .update(learningSessionsTable)
      .set({ language: body.data.language })
      .where(eq(learningSessionsTable.id, session.id));
  }
  res.status(201).json(
    RecordLearningEventResponse.parse({
      id: event.id,
      sessionId: event.sessionId,
      type: event.type,
      sectionId: event.sectionId,
      createdAt: event.createdAt.toISOString(),
    }),
  );
});

router.post("/quiz/submit", async (req, res): Promise<void> => {
  const body = SubmitQuizAnswerBody.safeParse(req.body);
  if (!body.success) {
    invalid(res, body.error.message);
    return;
  }
  const [session] = await db
    .select()
    .from(learningSessionsTable)
    .where(eq(learningSessionsTable.id, body.data.sessionId))
    .limit(1);
  if (!session) {
    res.status(404).json({ error: "Learning session not found" });
    return;
  }
  const question = getQuestion(body.data.questionId);
  if (!question || !question.options.some((option) => option.id === body.data.selectedAnswerId)) {
    invalid(res, "Choose an answer from the available options.");
    return;
  }

  const prior = await db
    .select({ total: count() })
    .from(quizAttemptsTable)
    .where(
      and(
        eq(quizAttemptsTable.sessionId, session.id),
        eq(quizAttemptsTable.questionId, question.id),
      ),
    );
  const attemptNumber = Number(prior[0]?.total ?? 0) + 1;
  const isCorrect = body.data.selectedAnswerId === question.correctAnswerId;
  const needsHumanReview = !isCorrect && attemptNumber >= 3;
  const hintUsed =
    body.data.hintUsed === true || (!isCorrect && attemptNumber === 1);
  const language = session.language as Language;
  const nextAction = isCorrect
    ? "next_question"
    : needsHumanReview
      ? "educator_review"
      : attemptNumber === 1
        ? "retry"
        : "try_visual";
  const hint = isCorrect
    ? null
    : attemptNumber === 1
      ? question.hint[language]
      : getAlternative(
          question.concept === "numerator"
            ? "numerator-denominator"
            : question.concept === "denominator"
              ? "numerator-denominator"
              : question.concept === "equivalent fractions"
                ? "equivalent-fractions"
                : "pizza-fourths",
          language,
        ) ?? question.hint[language];

  await db.insert(quizAttemptsTable).values({
    id: randomUUID(),
    sessionId: session.id,
    questionId: question.id,
    concept: question.concept,
    selectedAnswer: body.data.selectedAnswerId,
    isCorrect,
    attemptNumber,
    hintUsed,
    responseTimeMs: body.data.responseTimeMs ?? null,
  });

  if (needsHumanReview) {
    const [existingReview] = await db
      .select({ id: educatorReviewsTable.id })
      .from(educatorReviewsTable)
      .where(
        and(
          eq(educatorReviewsTable.sessionId, session.id),
          eq(educatorReviewsTable.concept, question.concept),
          eq(educatorReviewsTable.status, "pending"),
        ),
      )
      .limit(1);
    if (!existingReview) {
      await db.insert(educatorReviewsTable).values({
        id: randomUUID(),
        sessionId: session.id,
        concept: question.concept,
        language: session.language,
        attemptSummary: `${attemptNumber} attempts on ${question.concept}; answer history is stored without a learner name.`,
        proposedExplanation: hint ?? question.hint[language],
        reason: "Repeated difficulty on this concept; educator review is recommended.",
        status: "pending",
        isSample: false,
      });
    }
  }

  await db.insert(agentActivityTable).values({
    id: randomUUID(),
    sessionId: session.id,
    provider: "local_demo",
    externalRunId: null,
    status: "completed",
    summary: needsHumanReview
      ? "Local demo coach noticed repeated difficulty and requested educator review."
      : isCorrect
        ? "Local demo coach recorded a correct answer and encouraged the learner to continue."
        : "Local demo coach selected a supportive hint; no diagnosis was made.",
    needsHumanReview,
  });

  const feedback = isCorrect
    ? question.correctFeedback[language]
    : question.incorrectFeedback[language];
  res.json(
    SubmitQuizAnswerResponse.parse({
      isCorrect,
      attemptNumber,
      hintUsed,
      feedback,
      hint,
      nextAction,
      repeatedDifficulty: needsHumanReview,
    }),
  );
});

router.post("/tutor/explain", async (req, res): Promise<void> => {
  const body = ExplainConceptBody.safeParse(req.body);
  if (!body.success) {
    invalid(res, body.error.message);
    return;
  }
  const [session] = await db
    .select({ id: learningSessionsTable.id })
    .from(learningSessionsTable)
    .where(eq(learningSessionsTable.id, body.data.sessionId))
    .limit(1);
  if (!session) {
    res.status(404).json({ error: "Learning session not found" });
    return;
  }
  const curatedExplanation = getAlternative(
    body.data.sectionId,
    body.data.language as Language,
  );
  if (!curatedExplanation) {
    invalid(res, "Unknown lesson section.");
    return;
  }
  const conceptsForSection =
    body.data.sectionId === "numerator-denominator"
      ? ["numerator", "denominator"]
      : body.data.sectionId === "equivalent-fractions"
        ? ["equivalent fractions"]
        : body.data.sectionId === "everyday-challenge"
          ? ["fractions in daily life"]
          : ["fraction parts"];
  const [approvedReview] = await db
    .select()
    .from(educatorReviewsTable)
    .where(
      and(
        eq(educatorReviewsTable.sessionId, session.id),
        eq(educatorReviewsTable.language, body.data.language),
        inArray(educatorReviewsTable.concept, conceptsForSection),
        inArray(educatorReviewsTable.status, ["approved", "edited"]),
      ),
    )
    .orderBy(desc(educatorReviewsTable.reviewedAt))
    .limit(1);
  const agenticOrgResult = approvedReview?.approvedExplanation
    ? null
    : await requestAgenticOrgExplanation({
        language: body.data.language as Language,
        sectionId: body.data.sectionId,
        referenceExplanation: curatedExplanation,
      });
  if (
    agenticOrgResult &&
    !agenticOrgResult.ok &&
    agenticOrgResult.reason !== "missing_api_key"
  ) {
    req.log.warn(
      {
        provider: "agenticorg",
        reason: agenticOrgResult.reason,
        status: agenticOrgResult.status,
      },
      "AgenticOrg explanation unavailable; using curated fallback",
    );
  }
  const explanation =
    approvedReview?.approvedExplanation ??
    (agenticOrgResult?.ok ? agenticOrgResult.explanation : curatedExplanation);
  const mode = agenticOrgResult?.ok && !approvedReview?.approvedExplanation
    ? "agenticorg"
    : "curated";
  await db.insert(learningEventsTable).values({
    id: randomUUID(),
    sessionId: session.id,
    type: "alternative_explanation",
    sectionId: body.data.sectionId,
  });
  res.json(ExplainConceptResponse.parse({ explanation, mode }));
});

router.post("/agent/intervene", async (req, res): Promise<void> => {
  const body = RequestInterventionBody.safeParse(req.body);
  if (!body.success) {
    invalid(res, body.error.message);
    return;
  }
  const [session] = await db
    .select()
    .from(learningSessionsTable)
    .where(eq(learningSessionsTable.id, body.data.sessionId))
    .limit(1);
  if (!session) {
    res.status(404).json({ error: "Learning session not found" });
    return;
  }
  const attempts = await db
    .select()
    .from(quizAttemptsTable)
    .where(eq(quizAttemptsTable.sessionId, session.id))
    .orderBy(desc(quizAttemptsTable.createdAt));
  const incorrect = attempts.filter((attempt) => !attempt.isCorrect);
  const mostRecent = incorrect[0];
  const needsHumanReview =
    mostRecent !== undefined &&
    incorrect.filter((attempt) => attempt.concept === mostRecent.concept).length >= 3;
  const pattern = needsHumanReview
    ? `Repeated errors were recorded for ${mostRecent.concept}; this is a support signal, not a diagnosis.`
    : "There is not enough answer history to infer a learning pattern.";
  const explanation =
    getAlternative(
      mostRecent?.concept === "numerator" || mostRecent?.concept === "denominator"
        ? "numerator-denominator"
        : mostRecent?.concept === "equivalent fractions"
          ? "equivalent-fractions"
          : "fraction-whole",
      session.language as Language,
    ) ?? "Let’s use a picture and count the equal parts together.";
  await db.insert(agentActivityTable).values({
    id: randomUUID(),
    sessionId: session.id,
    provider: "local_demo",
    externalRunId: null,
    status: "completed",
    summary: "Local demo intervention reviewed the learner's recent answer history.",
    needsHumanReview,
  });
  res.json(
    RequestInterventionResponse.parse({
      concept: mostRecent?.concept ?? "fractions",
      observedPattern: pattern,
      confidence: needsHumanReview ? 0.7 : 0.25,
      teachingStrategy: needsHumanReview ? "visual_example_and_educator_review" : "encouraging_practice",
      explanation,
      nextAction: needsHumanReview ? "educator_review" : "show_visual_example",
      needsHumanReview,
      providerMode: "local_demo",
    }),
  );
});

export default router;
