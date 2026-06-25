import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Quiz } from "@/models/Quiz";
import { Candidate } from "@/models/Candidate";
import { formatExamSchedule, isExamNotStarted } from "@/lib/examSchedule";
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const studentDecoded = await verifyStudent();
    if (!studentDecoded) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const student = await Candidate.findById(studentDecoded.id);
    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const { id } = await params;

    const quiz = await Quiz.findOne({
      _id: id,
      course: student.course,
      assignedStudents: student._id
    }).lean();

    if (!quiz) {
      return NextResponse.json({ error: "Exam not found or you are not assigned to it" }, { status: 404 });
    }

    if (isExamNotStarted(quiz.scheduledAt)) {
      return NextResponse.json(
        {
          error: `This exam has not started yet. Scheduled for ${formatExamSchedule(quiz.scheduledAt)}.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      quiz,
    });
  } catch (error: any) {
    console.error("Fetch Single Quiz Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch exam details" }, { status: 500 });
  }
}
