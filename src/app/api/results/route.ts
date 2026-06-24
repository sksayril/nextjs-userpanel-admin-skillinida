import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Result } from "@/models/Result";
import { Quiz } from "@/models/Quiz";
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
    const student = await verifyStudent();
    if (!student) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const rawResults = await Result.find({ candidateId: student.id }).sort({ date: -1 });
    const results = rawResults.map(r => {
      const obj = r.toObject();
      if (!obj.isApproved) {
        // Redact fields until approved
        delete obj.score;
        delete obj.percentage;
        delete obj.grade;
        delete obj.correctCount;
        delete obj.incorrectCount;
        delete obj.answers;
      }
      return obj;
    });

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Fetch Results Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch results" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const student = await verifyStudent();
    if (!student) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { quizId, answers } = await request.json();

    if (!quizId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Quiz ID and answers array are required" }, { status: 400 });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Validate student assignment/eligibility
    const isAssigned = quiz.assignedStudents.some(
      (id: any) => id.toString() === student.id.toString()
    );
    if (!isAssigned) {
      return NextResponse.json({ error: "You are not assigned/eligible for this exam" }, { status: 403 });
    }

    // Validate start time
    if (quiz.scheduledAt && new Date(quiz.scheduledAt) > new Date()) {
      return NextResponse.json({ error: "This exam has not started yet" }, { status: 403 });
    }

    // Calculate score based on custom marks
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let totalMarks = 0;

    quiz.questions.forEach((question: any, index: number) => {
      const qMarks = question.marks || 1;
      totalMarks += qMarks;
      const studentAnswer = answers[index];
      if (studentAnswer !== undefined && studentAnswer === question.correctAnswerIndex) {
        score += qMarks;
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const percentage = parseFloat(((score / totalMarks) * 100).toFixed(1));

    // Determine grade
    let grade = "F";
    if (percentage >= 90) grade = "A+";
    else if (percentage >= 80) grade = "A";
    else if (percentage >= 70) grade = "B+";
    else if (percentage >= 60) grade = "B";
    else if (percentage >= 50) grade = "C";

    // Update or insert result
    const query = { candidateId: student.id, quizId };
    const update = {
      quizTitle: quiz.title,
      score,
      total: totalMarks,
      percentage,
      grade,
      correctCount,
      incorrectCount,
      answers,
      date: new Date(),
    };

    const resultRecord = await Result.findOneAndUpdate(query, update, {
      new: true,
      upsert: true,
    });

    const returnedResult = resultRecord.toObject();
    if (!returnedResult.isApproved) {
      delete returnedResult.score;
      delete returnedResult.percentage;
      delete returnedResult.grade;
      delete returnedResult.correctCount;
      delete returnedResult.incorrectCount;
      delete returnedResult.answers;
    }

    return NextResponse.json({
      success: true,
      message: "Answers submitted and graded successfully",
      result: returnedResult,
    });
  } catch (error: any) {
    console.error("Submit Quiz Error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit quiz" }, { status: 500 });
  }
}
