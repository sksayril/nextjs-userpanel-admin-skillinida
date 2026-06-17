import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Course } from "@/models/Course";

export async function GET() {
  try {
    await dbConnect();
    const courses = await Course.find({}).sort({ title: 1 });
    return NextResponse.json({ success: true, courses });
  } catch (error: any) {
    console.error("Public Fetch Courses Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
