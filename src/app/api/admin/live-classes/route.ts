import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { LiveClass } from "@/models/LiveClass";
import { parseScheduledAt } from "@/lib/examSchedule";
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

    const classes = await LiveClass.find({})
      .populate("students", "name email registrationId")
      .sort({ startTime: 1 });

    return NextResponse.json({ success: true, classes });
  } catch (error: any) {
    console.error("Fetch Live Classes Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch live classes" }, { status: 550 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const data = await request.json();
    const { className, course, students, startTime, endTime, meetLink } = data;

    if (!className || !course || !students || !students.length || !startTime || !endTime || !meetLink) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newLiveClass = new LiveClass({
      className,
      course,
      students,
      startTime: parseScheduledAt(startTime),
      endTime: parseScheduledAt(endTime),
      meetLink,
    });

    await newLiveClass.save();

    return NextResponse.json({ success: true, liveClass: newLiveClass });
  } catch (error: any) {
    console.error("Create Live Class Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create live class" }, { status: 500 });
  }
}
