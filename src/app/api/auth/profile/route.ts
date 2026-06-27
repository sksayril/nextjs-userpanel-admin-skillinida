import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Candidate } from "@/models/Candidate";
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

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const student = await verifyStudent();
    if (!student) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { phone, address, district } = await request.json();

    // Only allow updating phone, address, district
    const updateFields: Record<string, string> = {};
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (address !== undefined) updateFields.address = address.trim();
    if (district !== undefined) updateFields.district = district.trim();

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
    }

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      student.id,
      updateFields,
      { new: true, runValidators: true }
    ).select("-password -originalPassword");

    if (!updatedCandidate) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      candidate: updatedCandidate,
    });
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
