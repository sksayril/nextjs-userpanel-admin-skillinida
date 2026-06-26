import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Quiz } from "@/models/Quiz";
import { ExamSession } from "@/models/ExamSession";
import { enrichQuizWithSchedule, getExamWindowEnd, parseScheduledAt } from "@/lib/examSchedule";
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

function validateQuizPayload(body: any) {
  const { title, course, questions, scheduledAt, duration, assignedStudents, examPassword } = body;

  if (!title || !course || !questions || !Array.isArray(questions) || questions.length === 0) {
    return { error: "Title, course, and questions array are required" };
  }

  for (const q of questions) {
    if (
      !q.questionText ||
      !Array.isArray(q.options) ||
      q.options.length < 2 ||
      typeof q.correctAnswerIndex !== "number"
    ) {
      return {
        error: "Each question must have text, at least two options, and a correct answer index",
      };
    }
    if (q.marks !== undefined && (typeof q.marks !== "number" || q.marks < 0)) {
      return { error: "Question marks must be a positive number" };
    }
  }

  return {
    data: {
      title,
      course,
      questions,
      scheduledAt: parseScheduledAt(scheduledAt),
      duration: duration || 30,
      assignedStudents: assignedStudents || [],
      examPassword: examPassword || "",
    },
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const quiz = await Quiz.findById(id).lean();

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      quiz: enrichQuizWithSchedule(quiz as Record<string, unknown>),
    });
  } catch (error: any) {
    console.error("Fetch Quiz Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch quiz" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = validateQuizPayload(body);

    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { data } = validation;

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      id,
      {
        title: data.title,
        course: data.course,
        questions: data.questions,
        scheduledAt: data.scheduledAt,
        duration: data.duration,
        assignedStudents: data.assignedStudents,
        examPassword: data.examPassword,
      },
      { new: true, runValidators: true }
    );

    if (!updatedQuiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const windowEndsAt = getExamWindowEnd(updatedQuiz.scheduledAt, updatedQuiz.duration);
    if (windowEndsAt) {
      await ExamSession.updateMany(
        { quizId: updatedQuiz._id, status: "in_progress" },
        { windowEndsAt }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Quiz updated successfully",
      quiz: enrichQuizWithSchedule(updatedQuiz.toObject() as Record<string, unknown>),
    });
  } catch (error: any) {
    console.error("Update Quiz Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update quiz" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const deletedQuiz = await Quiz.findByIdAndDelete(id);

    if (!deletedQuiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    await ExamSession.deleteMany({ quizId: id });

    return NextResponse.json({
      success: true,
      message: "Quiz deleted successfully",
      quiz: deletedQuiz,
    });
  } catch (error: any) {
    console.error("Delete Quiz Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete quiz" }, { status: 500 });
  }
}
