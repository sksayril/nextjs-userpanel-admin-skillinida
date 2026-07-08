import "server-only";

import mongoose from "mongoose";
import { Quiz } from "@/models/Quiz";
import { Result } from "@/models/Result";
import { ExamSession } from "@/models/ExamSession";
import { isExamWindowClosed } from "@/lib/examSchedule";
import { normalizeSavedAnswers } from "@/lib/examSessionHelpers";
import { gradeQuizAnswers } from "@/lib/resultHelpers";

export async function autoSubmitPendingExamSessions(
  candidateId: string | mongoose.Types.ObjectId
) {
  const sessions = await ExamSession.find({
    candidateId,
    status: { $in: ["in_progress", "expired"] },
  });

  for (const session of sessions) {
    const existingResult = await Result.findOne({
      candidateId,
      quizId: session.quizId,
    });
    if (existingResult) {
      if (session.status !== "submitted") {
        session.status = "submitted";
        await session.save();
      }
      continue;
    }

    const quiz = await Quiz.findById(session.quizId);
    if (!quiz || !quiz.questions?.length) continue;

    const duration = quiz.duration || 30;
    const windowClosed = isExamWindowClosed(quiz.scheduledAt, duration);
    const sessionExpired =
      session.windowEndsAt && new Date(session.windowEndsAt) < new Date();

    if (!windowClosed && !sessionExpired && session.status === "in_progress") {
      continue;
    }

    const answers = normalizeSavedAnswers(
      session.answers,
      quiz.questions.length
    );

    const graded = gradeQuizAnswers(quiz, answers);

    await Result.findOneAndUpdate(
      { candidateId, quizId: session.quizId },
      {
        quizTitle: graded.quizTitle,
        score: graded.score,
        total: graded.total,
        percentage: graded.percentage,
        grade: graded.grade,
        correctCount: graded.correctCount,
        incorrectCount: graded.incorrectCount,
        answers: graded.answers,
        date: new Date(),
      },
      { upsert: true, new: true }
    );

    session.status = "submitted";
    session.answers = answers;
    session.lastSavedAt = new Date();
    await session.save();
  }
}
