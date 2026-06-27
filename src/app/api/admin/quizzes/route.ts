import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Quiz } from "@/models/Quiz";
import { enrichQuizWithSchedule, parseScheduledAt } from "@/lib/examSchedule";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.role === "admin") {
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
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const quizzes = await Quiz.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      success: true,
      quizzes: quizzes.map((quiz) => enrichQuizWithSchedule(quiz as Record<string, unknown>)),
    });
  } catch (error: any) {
    console.error("Fetch Quizzes Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch quizzes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { title, course, questions, scheduledAt, duration, assignedStudents, examPassword, showResultToStudent, enableCertificate } = await request.json();

    if (!title || !course || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Title, course, and questions array are required" }, { status: 400 });
    }

    // Validate questions structure
    for (const q of questions) {
      if (!q.questionText || !Array.isArray(q.options) || q.options.length < 2 || typeof q.correctAnswerIndex !== "number") {
        return NextResponse.json({ error: "Each question must have text, at least two options, and a correct answer index" }, { status: 400 });
      }
      if (q.marks !== undefined && (typeof q.marks !== "number" || q.marks < 0)) {
        return NextResponse.json({ error: "Question marks must be a positive number" }, { status: 400 });
      }
    }

    const quiz = new Quiz({
      title,
      course,
      questions,
      scheduledAt: parseScheduledAt(scheduledAt),
      duration: duration || 30,
      assignedStudents: assignedStudents || [],
      examPassword: examPassword || "",
      showResultToStudent: showResultToStudent !== false,
      enableCertificate: enableCertificate !== false,
    });

    await quiz.save();

    return NextResponse.json({
      success: true,
      message: "Quiz created successfully",
      quiz: enrichQuizWithSchedule(quiz.toObject() as Record<string, unknown>),
    });
  } catch (error: any) {
    console.error("Create Quiz Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create quiz" }, { status: 500 });
  }
}
