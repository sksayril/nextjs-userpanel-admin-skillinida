import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
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

export async function PATCH(
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
    const candidate = await Candidate.findById(id);

    if (!candidate) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Toggle the isActive field
    candidate.isActive = !candidate.isActive;
    await candidate.save({ validateBeforeSave: false });

    return NextResponse.json({
      success: true,
      message: `Student access ${candidate.isActive ? "enabled" : "disabled"} successfully`,
      isActive: candidate.isActive,
    });
  } catch (error: any) {
    console.error("Toggle Access Error:", error);
    return NextResponse.json({ error: error.message || "Failed to toggle student access" }, { status: 500 });
  }
}
