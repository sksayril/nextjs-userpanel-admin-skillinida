export interface GradedResult {
  quizTitle: string;
  score: number;
  total: number;
  percentage: number;
  grade: string;
  correctCount: number;
  incorrectCount: number;
  answers: number[];
}

export function normalizeTitleForMatch(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/^(module|paper|quiz|exam|subject)\s*\d*\s*[:.\-]?\s*/i, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function findResultForModule<T extends { _id?: string; quizTitle?: string; quizId?: string }>(
  moduleTitle: string,
  moduleIndex: number,
  results: T[],
  usedResultIds: Set<string> = new Set()
): T | undefined {
  const normalizedModule = normalizeTitleForMatch(moduleTitle);
  if (!normalizedModule) return undefined;

  const available = results.filter(
    (result) => result._id && !usedResultIds.has(String(result._id))
  );

  const exactMatch = available.find(
    (result) =>
      result.quizTitle &&
      normalizeTitleForMatch(result.quizTitle) === normalizedModule
  );
  if (exactMatch) return exactMatch;

  const partialMatch = available.find((result) => {
    if (!result.quizTitle) return false;
    const normalizedQuiz = normalizeTitleForMatch(result.quizTitle);
    return (
      normalizedQuiz.includes(normalizedModule) ||
      normalizedModule.includes(normalizedQuiz)
    );
  });
  if (partialMatch) return partialMatch;

  const looseMatch = available.find((result) => {
    if (!result.quizTitle) return false;
    const quizLower = result.quizTitle.toLowerCase();
    const moduleLower = moduleTitle.toLowerCase();
    return quizLower.includes(moduleLower) || moduleLower.includes(quizLower);
  });
  if (looseMatch) return looseMatch;

  if (moduleIndex < available.length) {
    return available[moduleIndex];
  }

  return undefined;
}

export function calculateMarksheetMarks(score: number, total: number) {
  const safeTotal = total || 1;
  const internal = Math.round(score * (30 / safeTotal));
  const external =
    Math.round((total - score) * (70 / safeTotal)) + score * 5;

  return {
    internal: internal > 30 ? 30 : internal,
    external: external > 70 ? 70 : external,
    total: Math.round((score / safeTotal) * 100),
  };
}

export function gradeQuizAnswers(
  quiz: { title: string; questions: Array<{ correctAnswerIndex: number; marks?: number }> },
  answers: number[]
): GradedResult {
  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let totalMarks = 0;

  quiz.questions.forEach((question, index) => {
    const qMarks = question.marks || 1;
    totalMarks += qMarks;
    const studentAnswer = answers[index];
    if (
      studentAnswer !== undefined &&
      studentAnswer !== -1 &&
      studentAnswer === question.correctAnswerIndex
    ) {
      score += qMarks;
      correctCount++;
    } else if (studentAnswer !== undefined && studentAnswer !== -1) {
      incorrectCount++;
    }
  });

  const percentage = parseFloat(((score / (totalMarks || 1)) * 100).toFixed(1));

  let grade = "F";
  if (percentage >= 90) grade = "A+";
  else if (percentage >= 80) grade = "A";
  else if (percentage >= 70) grade = "B+";
  else if (percentage >= 60) grade = "B";
  else if (percentage >= 50) grade = "C";

  return {
    quizTitle: quiz.title,
    score,
    total: totalMarks,
    percentage,
    grade,
    correctCount,
    incorrectCount,
    answers,
  };
}

export function buildResultsDisplayRows(
  modules: Array<{ title: string }> | undefined,
  results: Array<{
    _id?: string;
    quizTitle?: string;
    score?: number;
    total?: number;
    isApproved?: boolean;
    isCertificateApproved?: boolean;
    [key: string]: unknown;
  }>
) {
  const usedResultIds = new Set<string>();

  if (modules && modules.length > 0) {
    const moduleRows = modules.map((mod, index) => {
      const matched = findResultForModule(mod.title, index, results, usedResultIds);
      if (matched?._id) {
        usedResultIds.add(String(matched._id));
      }

      const isApproved = !!matched?.isApproved;
      const marks = isApproved
        ? calculateMarksheetMarks(matched?.score || 0, matched?.total || 1)
        : null;

      return {
        code: `PAPER-${101 + index}`,
        subject: mod.title,
        internal: isApproved ? marks!.internal : "-",
        external: isApproved ? marks!.external : "-",
        total: isApproved ? marks!.total : matched ? "Pending" : "-",
        isApproved,
        isCertificateApproved: !!matched?.isCertificateApproved,
        originalData: matched || null,
      };
    });

    const unmatchedRows = results
      .filter((result) => result._id && !usedResultIds.has(String(result._id)))
      .map((result, index) => {
        const isApproved = !!result.isApproved;
        const marks = isApproved
          ? calculateMarksheetMarks(result.score || 0, result.total || 1)
          : null;

        return {
          code: `QUIZ-${201 + index}`,
          subject: result.quizTitle || "Exam",
          internal: isApproved ? marks!.internal : "-",
          external: isApproved ? marks!.external : "-",
          total: isApproved ? marks!.total : "Pending",
          isApproved,
          isCertificateApproved: !!result.isCertificateApproved,
          originalData: result,
        };
      });

    return [...moduleRows, ...unmatchedRows];
  }

  return results.map((result, index) => {
    const isApproved = !!result.isApproved;
    const marks = isApproved
      ? calculateMarksheetMarks(result.score || 0, result.total || 1)
      : null;

    return {
      code: `QUIZ-${101 + index}`,
      subject: result.quizTitle || "Exam",
      internal: isApproved ? marks!.internal : "-",
      external: isApproved ? marks!.external : "-",
      total: isApproved ? marks!.total : "Pending",
      isApproved,
      isCertificateApproved: !!result.isCertificateApproved,
      originalData: result,
    };
  });
}

export function buildCumulativeMarksheetRows(
  modules: Array<{ title: string }> | undefined,
  results: Array<{
    _id?: string;
    quizTitle?: string;
    score?: number;
    total?: number;
    percentage?: number;
    isApproved?: boolean;
  }>
) {
  const usedResultIds = new Set<string>();

  if (modules && modules.length > 0) {
    return modules.map((mod, index) => {
      const matchedRes = findResultForModule(mod.title, index, results, usedResultIds);
      if (matchedRes?._id) {
        usedResultIds.add(String(matchedRes._id));
      }

      if (matchedRes && matchedRes.isApproved !== false) {
        const marks = calculateMarksheetMarks(
          matchedRes.score || 0,
          matchedRes.total || 1
        );
        return {
          quizTitle: mod.title,
          internal: marks.internal,
          external: marks.external,
          score: matchedRes.score || 0,
          total: matchedRes.total || 0,
          percentage: matchedRes.percentage || marks.total,
          isAttempted: true,
        };
      }

      return {
        quizTitle: mod.title,
        internal: "-",
        external: "-",
        score: 0,
        total: 0,
        percentage: 0,
        isAttempted: !!matchedRes,
        isPending: !!matchedRes && !matchedRes.isApproved,
      };
    });
  }

  return results.map((result) => {
    const marks = calculateMarksheetMarks(result.score || 0, result.total || 1);
    return {
      quizTitle: result.quizTitle || "Exam",
      internal: marks.internal,
      external: marks.external,
      score: result.score || 0,
      total: result.total || 0,
      percentage: result.percentage || marks.total,
      isAttempted: true,
    };
  });
}

export function getResultQuestionCounts(result: {
  correctCount?: number;
  incorrectCount?: number;
  score?: number;
  total?: number;
}) {
  const correctCount = result.correctCount ?? 0;
  const incorrectCount = result.incorrectCount ?? 0;
  const totalQuestions =
    correctCount + incorrectCount > 0
      ? correctCount + incorrectCount
      : result.total || 0;

  return { correctCount, incorrectCount, totalQuestions };
}
