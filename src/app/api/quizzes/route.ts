import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Quiz } from "@/models/Quiz";
import { Candidate } from "@/models/Candidate";
import { ExamSession } from "@/models/ExamSession";
import { Result } from "@/models/Result";
import { enrichQuizWithSchedule } from "@/lib/examSchedule";
import { buildExamSessionPayload } from "@/lib/examSessionHelpers";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";

async function verifyStudent() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.id) {
      return decoded;
    }
  } catch (err) {
    return null;
  }
  return null;
}

export async function GET() {
  try {
    await dbConnect();
    const studentDecoded = await verifyStudent();
    if (!studentDecoded) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const student = await Candidate.findById(studentDecoded.id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const quizzes = await Quiz.find({
      course: student.course,
      assignedStudents: student._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    const [sessions, submittedResults] = await Promise.all([
      ExamSession.find({ candidateId: student._id }).lean(),
      Result.find({ candidateId: student._id }).select("quizId").lean(),
    ]);

    await ExamSession.updateMany(
      {
        candidateId: student._id,
        status: "in_progress",
        windowEndsAt: { $lt: new Date() },
      },
      { status: "expired" }
    );

    const sessionMap = new Map(sessions.map((session) => [session.quizId.toString(), session]));
    const submittedQuizIds = new Set(submittedResults.map((result) => result.quizId.toString()));

    const sanitizedQuizzes = quizzes.map((quiz: any) => {
      const questionCount = quiz.questions?.length || 0;
      const enriched = enrichQuizWithSchedule({ ...quiz, questionCount });
      const session = sessionMap.get(quiz._id.toString()) ?? null;
      const examMeta = buildExamSessionPayload(
        { ...quiz, questionCount },
        session as Record<string, unknown> | null
      );

      return {
        ...enriched,
        questions: [],
        isSubmitted: submittedQuizIds.has(quiz._id.toString()),
        examMeta,
      };
    });

    return NextResponse.json({
      success: true,
      quizzes: sanitizedQuizzes,
    });
  } catch (error: any) {
    console.error("Student Quizzes Fetch Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch quizzes" }, { status: 500 });
  }
}
