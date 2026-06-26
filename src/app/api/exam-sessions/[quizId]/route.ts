import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Quiz } from "@/models/Quiz";
import { Candidate } from "@/models/Candidate";
import { ExamSession } from "@/models/ExamSession";
import { Result } from "@/models/Result";
import {
  formatExamSchedule,
  formatExamWindowEnd,
  getExamRemainingSeconds,
  getExamWindowEnd,
  isExamNotStarted,
  isExamWindowClosed,
} from "@/lib/examSchedule";
import {
  buildEmptyAnswers,
  buildQuizResponse,
  countAnsweredQuestions,
  normalizeSavedAnswers,
} from "@/lib/examSessionHelpers";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";

async function verifyStudent() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded?.id) {
      return decoded;
    }
  } catch {
    return null;
  }

  return null;
}

async function getEligibleQuiz(quizId: string, studentId: string) {
  const student = await Candidate.findById(studentId);
  if (!student) {
    return { error: "Student profile not found", status: 404 as const };
  }

  const quiz = await Quiz.findOne({
    _id: quizId,
    course: student.course,
    assignedStudents: student._id,
  }).lean();

  if (!quiz) {
    return { error: "Exam not found or you are not assigned to it", status: 404 as const };
  }

  return { quiz, student };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    await dbConnect();
    const studentDecoded = await verifyStudent();
    if (!studentDecoded) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { quizId } = await params;
    const eligible = await getEligibleQuiz(quizId, studentDecoded.id);
    if ("error" in eligible) {
      return NextResponse.json({ error: eligible.error }, { status: eligible.status });
    }

    const { quiz } = eligible;
    const duration = quiz.duration || 30;

    if (isExamNotStarted(quiz.scheduledAt)) {
      return NextResponse.json(
        {
          error: `This exam has not started yet. Scheduled for ${formatExamSchedule(quiz.scheduledAt)}.`,
        },
        { status: 403 }
      );
    }

    if (isExamWindowClosed(quiz.scheduledAt, duration)) {
      return NextResponse.json(
        {
          error: `Exam window has ended. It was open until ${formatExamWindowEnd(quiz.scheduledAt, duration)}.`,
        },
        { status: 403 }
      );
    }

    const existingResult = await Result.findOne({
      candidateId: studentDecoded.id,
      quizId: quiz._id,
    }).lean();

    if (existingResult) {
      return NextResponse.json(
        { error: "You have already submitted this exam." },
        { status: 403 }
      );
    }

    const now = new Date();
    const windowEndsAt = getExamWindowEnd(quiz.scheduledAt, duration);
    if (!windowEndsAt) {
      return NextResponse.json({ error: "Invalid exam schedule." }, { status: 400 });
    }

    const questionCount = quiz.questions.length;
    let session = await ExamSession.findOne({
      candidateId: studentDecoded.id,
      quizId: quiz._id,
    });

    if (session?.status === "submitted") {
      return NextResponse.json(
        { error: "You have already submitted this exam." },
        { status: 403 }
      );
    }

    if (session?.status === "expired") {
      return NextResponse.json(
        {
          error: `Exam window has ended. It was open until ${formatExamWindowEnd(quiz.scheduledAt, duration)}.`,
        },
        { status: 403 }
      );
    }

    const answers = session
      ? normalizeSavedAnswers(session.answers, questionCount)
      : buildEmptyAnswers(questionCount);

    if (!session) {
      session = await ExamSession.create({
        candidateId: studentDecoded.id,
        quizId: quiz._id,
        answers,
        startedAt: now,
        lastSavedAt: now,
        windowEndsAt,
        status: "in_progress",
      });
    } else {
      session.answers = answers;
      session.windowEndsAt = windowEndsAt;
      session.status = "in_progress";
      session.lastSavedAt = now;
      await session.save();
    }

    const remainingSeconds = getExamRemainingSeconds(quiz.scheduledAt, duration, now);

    return NextResponse.json({
      success: true,
      resumed: countAnsweredQuestions(answers) > 0,
      quiz: buildQuizResponse(quiz as Record<string, unknown>),
      session: {
        id: session._id,
        answers,
        startedAt: session.startedAt,
        lastSavedAt: session.lastSavedAt,
        windowEndsAt: session.windowEndsAt,
        status: session.status,
        answeredCount: countAnsweredQuestions(answers),
        totalQuestions: questionCount,
      },
      remainingSeconds,
      expiresAt: windowEndsAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Start Exam Session Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start exam session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    await dbConnect();
    const studentDecoded = await verifyStudent();
    if (!studentDecoded) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { quizId } = await params;
    const { answers } = await request.json();

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Answers array is required" }, { status: 400 });
    }

    const eligible = await getEligibleQuiz(quizId, studentDecoded.id);
    if ("error" in eligible) {
      return NextResponse.json({ error: eligible.error }, { status: eligible.status });
    }

    const { quiz } = eligible;
    const duration = quiz.duration || 30;

    if (isExamWindowClosed(quiz.scheduledAt, duration)) {
      await ExamSession.updateOne(
        { candidateId: studentDecoded.id, quizId: quiz._id, status: "in_progress" },
        { status: "expired" }
      );

      return NextResponse.json(
        { error: "Exam time has expired. Your answers could not be saved." },
        { status: 403 }
      );
    }

    const session = await ExamSession.findOne({
      candidateId: studentDecoded.id,
      quizId: quiz._id,
      status: "in_progress",
    });

    if (!session) {
      return NextResponse.json({ error: "No active exam session found." }, { status: 404 });
    }

    const normalizedAnswers = normalizeSavedAnswers(answers, quiz.questions.length);
    session.answers = normalizedAnswers;
    session.lastSavedAt = new Date();
    await session.save();

    const remainingSeconds = getExamRemainingSeconds(quiz.scheduledAt, duration);

    return NextResponse.json({
      success: true,
      answeredCount: countAnsweredQuestions(normalizedAnswers),
      totalQuestions: quiz.questions.length,
      remainingSeconds,
      expiresAt: session.windowEndsAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Save Exam Session Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save exam progress" },
      { status: 500 }
    );
  }
}
