import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { LiveClass } from "@/models/LiveClass";
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

import { parseScheduledAt } from "@/lib/examSchedule";

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
    const data = await request.json();
    const { className, course, students, startTime, endTime, meetLink } = data;

    if (!className || !course || !students || !students.length || !startTime || !endTime || !meetLink) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedClass = await LiveClass.findByIdAndUpdate(
      id,
      {
        className,
        course,
        students,
        startTime: parseScheduledAt(startTime),
        endTime: parseScheduledAt(endTime),
        meetLink,
      },
      { new: true }
    ).populate("students", "name email registrationId");

    if (!updatedClass) {
      return NextResponse.json({ error: "Live class session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, liveClass: updatedClass });
  } catch (error: any) {
    console.error("Update Live Class Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update live class" }, { status: 500 });
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
    const deletedClass = await LiveClass.findByIdAndDelete(id);

    if (!deletedClass) {
      return NextResponse.json({ error: "Live class session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Live class session deleted successfully" });
  } catch (error: any) {
    console.error("Delete Live Class Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete live class" }, { status: 500 });
  }
}
