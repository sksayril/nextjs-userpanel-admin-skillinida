import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { LiveClass } from "@/models/LiveClass";
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

    const now = new Date();
    // Return all classes where this student is assigned and class hasn't ended yet
    const classes = await LiveClass.find({
      students: student.id,
      endTime: { $gt: now }
    }).sort({ startTime: 1 });

    return NextResponse.json({ success: true, classes });
  } catch (error: any) {
    console.error("Fetch Candidate Live Classes Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch live classes" }, { status: 550 });
  }
}
