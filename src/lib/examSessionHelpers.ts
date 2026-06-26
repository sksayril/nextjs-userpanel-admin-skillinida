import {
  enrichQuizWithSchedule,
  getExamRemainingSeconds,
  getExamWindowEnd,
  isExamNotStarted,
  isExamWindowClosed,
} from "@/lib/examSchedule";

export function sanitizeQuizQuestions(questions: Array<Record<string, unknown>>) {
  return questions.map((question) => ({
    questionText: question.questionText,
    options: question.options,
    marks: question.marks ?? 1,
  }));
}

export function countAnsweredQuestions(answers: number[]) {
  return answers.filter((answer) => answer !== -1 && answer !== undefined).length;
}

export function buildEmptyAnswers(questionCount: number) {
  return Array.from({ length: questionCount }, () => -1);
}

export function normalizeSavedAnswers(
  savedAnswers: number[] | undefined,
  questionCount: number
) {
  const answers = buildEmptyAnswers(questionCount);

  if (Array.isArray(savedAnswers)) {
    savedAnswers.forEach((answer, index) => {
      if (index < questionCount) {
        answers[index] = typeof answer === "number" ? answer : -1;
      }
    });
  }

  return answers;
}

export function buildExamSessionPayload(
  quiz: Record<string, unknown>,
  session: Record<string, unknown> | null,
  now = new Date()
) {
  const scheduledAt = quiz.scheduledAt as string | Date;
  const duration = (quiz.duration as number) || 30;
  const questionCount =
    typeof quiz.questionCount === "number"
      ? quiz.questionCount
      : Array.isArray(quiz.questions)
        ? quiz.questions.length
        : 0;

  const remainingSeconds = getExamRemainingSeconds(scheduledAt, duration, now);
  const windowEndsAt = getExamWindowEnd(scheduledAt, duration);

  return {
    questionCount,
    isNotStarted: isExamNotStarted(scheduledAt, now),
    isWindowClosed: isExamWindowClosed(scheduledAt, duration, now),
    remainingSeconds,
    windowEndsAt: windowEndsAt?.toISOString() ?? null,
    sessionStatus: session?.status ?? null,
    answeredCount: session?.answers
      ? countAnsweredQuestions(session.answers as number[])
      : 0,
    canResume: session?.status === "in_progress" && remainingSeconds > 0,
  };
}

export function buildQuizResponse(quiz: Record<string, unknown>) {
  const enriched = enrichQuizWithSchedule(quiz);
  const questions = Array.isArray(enriched.questions) ? enriched.questions : [];

  return {
    ...enriched,
    questions: sanitizeQuizQuestions(questions as Array<Record<string, unknown>>),
    questionCount: questions.length,
  };
}
