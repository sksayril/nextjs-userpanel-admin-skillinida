import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Quiz } from "@/models/Quiz";
import { Candidate } from "@/models/Candidate";
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

    // Fetch quizzes belonging to student's course and assigned to this candidate
    const quizzes = await Quiz.find({
      course: student.course,
      assignedStudents: student._id
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      quizzes,
    });
  } catch (error: any) {
    console.error("Student Quizzes Fetch Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch quizzes" }, { status: 500 });
  }
}
