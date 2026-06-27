import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Attendance } from "@/models/Attendance";
import { Candidate } from "@/models/Candidate";
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

    const attendanceRecords = await Attendance.find({})
      .populate("candidateId", "name registrationId course")
      .sort({ date: -1, createdAt: -1 });

    return NextResponse.json({ success: true, attendance: attendanceRecords });
  } catch (error: any) {
    console.error("Fetch Attendance Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch attendance records" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { candidateId, date, status, googleMeetLink } = await request.json();

    if (!candidateId || !date || !status) {
      return NextResponse.json({ error: "Candidate, date, and status are required" }, { status: 400 });
    }

    // Verify candidate exists
    const candidateExists = await Candidate.findById(candidateId);
    if (!candidateExists) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Check if attendance already logged for this student at this exact time
    const duplicate = await Attendance.findOne({
      candidateId,
      date: new Date(date),
    });

    if (duplicate) {
      return NextResponse.json(
        { error: `Attendance already logged for this candidate at ${new Date(date).toLocaleString()}` },
        { status: 400 }
      );
    }

    const record = new Attendance({
      candidateId,
      date: new Date(date),
      status,
      googleMeetLink: googleMeetLink || undefined,
    });

    await record.save();

    return NextResponse.json({
      success: true,
      message: "Attendance recorded successfully",
      record,
    });
  } catch (error: any) {
    console.error("Log Attendance Error:", error);
    return NextResponse.json({ error: error.message || "Failed to log attendance" }, { status: 500 });
  }
}
