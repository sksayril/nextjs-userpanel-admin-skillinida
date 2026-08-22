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
    const body = await request.json();
    const { title, description, duration, code, modules, isPaid, price, isActive } = body;

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Quick toggle mode: if only isActive is passed
    if (isActive !== undefined && !title && !code) {
      course.isActive = !!isActive;
      await course.save();
      return NextResponse.json({
        success: true,
        message: `Course ${course.isActive ? "activated" : "deactivated"} successfully`,
        course,
      });
    }

    if (!title || !description || !duration || !code) {
      return NextResponse.json({ error: "Title, description, duration, and code are required" }, { status: 400 });
    }

    // Check code uniqueness (if code is changed)
    const normalizedCode = code.toUpperCase().trim();
    if (course.code !== normalizedCode) {
      const existingCode = await Course.findOne({ code: normalizedCode });
      if (existingCode) {
        return NextResponse.json({ error: "Course code must be unique" }, { status: 400 });
      }
    }

    // Check title uniqueness (if title is changed)
    const normalizedTitle = title.trim();
    if (course.title !== normalizedTitle) {
      const existingTitle = await Course.findOne({ title: normalizedTitle });
      if (existingTitle) {
        return NextResponse.json({ error: "Course title must be unique" }, { status: 400 });
      }
    }

    course.title = normalizedTitle;
    course.description = description;
    course.duration = duration;
    course.code = normalizedCode;
    if (modules) course.modules = modules;
    course.isPaid = !!isPaid;
    course.price = price ? Number(price) : 0;
    if (isActive !== undefined) course.isActive = !!isActive;

    await course.save();

    return NextResponse.json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error: any) {
    console.error("Update Course Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update course" }, { status: 500 });
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
    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete Course Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete course" }, { status: 500 });
  }
}
