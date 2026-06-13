import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { QuestionPaper } from "@/models/QuestionPaper";
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

    const papers = await QuestionPaper.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, papers });
  } catch (error: any) {
    console.error("Fetch Papers Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch question papers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { title, course, fileUrl, status, score } = await request.json();

    if (!title || !course || !fileUrl) {
      return NextResponse.json({ error: "Title, course, and question paper file URL are required" }, { status: 400 });
    }

    const paper = new QuestionPaper({
      title,
      course,
      fileUrl,
      status: status || "pending",
      score: score || "--",
    });

    await paper.save();

    return NextResponse.json({
      success: true,
      message: "Question paper uploaded successfully",
      paper,
    });
  } catch (error: any) {
    console.error("Create Question Paper Error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload question paper" }, { status: 500 });
  }
}
