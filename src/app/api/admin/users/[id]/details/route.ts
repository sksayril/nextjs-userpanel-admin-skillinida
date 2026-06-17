import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Candidate } from "@/models/Candidate";
import { Attendance } from "@/models/Attendance";
import { Result } from "@/models/Result";
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

export async function GET(
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

    const student = await Candidate.findById(id).select("-password");
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const attendance = await Attendance.find({ candidateId: id }).sort({ date: -1 });
    const results = await Result.find({ candidateId: id }).sort({ date: -1 });

    return NextResponse.json({
      success: true,
      student,
      attendance,
      results,
    });
  } catch (error: any) {
    console.error("Fetch Student Details Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch student details" }, { status: 500 });
  }
}
