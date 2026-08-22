import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Course } from "@/models/Course";
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
    const courses = await Course.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, courses });
  } catch (error: any) {
    console.error("Fetch Courses Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { title, description, duration, code, modules, isPaid, price, isActive } = await request.json();

    if (!title || !description || !duration || !code) {
      return NextResponse.json({ error: "Title, description, duration, and code are required" }, { status: 400 });
    }

    // Check code or title uniqueness
    const existingCode = await Course.findOne({ code: code.toUpperCase().trim() });
    if (existingCode) {
      return NextResponse.json({ error: "Course code must be unique" }, { status: 400 });
    }

    const newCourse = new Course({
      title,
      description,
      duration,
      code: code.toUpperCase().trim(),
      modules: modules || [],
      isPaid: !!isPaid,
      price: price ? Number(price) : 0,
      isActive: isActive !== undefined ? !!isActive : true,
    });

    await newCourse.save();

    return NextResponse.json({
      success: true,
      message: "Course created successfully",
      course: newCourse,
    });
  } catch (error: any) {
    console.error("Create Course Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create course" }, { status: 500 });
  }
}
