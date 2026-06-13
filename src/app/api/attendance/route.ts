import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Attendance } from "@/models/Attendance";
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

    const records = await Attendance.find({ candidateId: student.id }).sort({ date: 1 });

    const total = records.length;
    const present = records.filter(r => r.status === "present").length;
    const absent = records.filter(r => r.status === "absent").length;
    const leave = records.filter(r => r.status === "leave").length;
    const percentage = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 100.0;

    // Format day arrays to match dashboard structure
    const days = records.map((r, index) => ({
      day: index + 1,
      date: r.date,
      status: r.status,
      googleMeetLink: r.googleMeetLink || null,
    }));

    return NextResponse.json({
      success: true,
      attendance: {
        percentage,
        present,
        absent,
        leave,
        total,
        days,
      }
    });
  } catch (error: any) {
    console.error("Student Attendance API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch attendance" }, { status: 500 });
  }
}
