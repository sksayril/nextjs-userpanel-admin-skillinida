import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Result } from "@/models/Result";
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
    const body = await request.json();
    const { isApproved, isCertificateApproved } = body;

    const updateFields: any = {};
    if (typeof isApproved === "boolean") {
      updateFields.isApproved = isApproved;
    }
    if (typeof isCertificateApproved === "boolean") {
      updateFields.isCertificateApproved = isCertificateApproved;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
    }

    const updatedResult = await Result.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).populate("candidateId", "name email registrationId course");

    if (!updatedResult) {
      return NextResponse.json({ error: "Result record not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Result status updated successfully",
      result: updatedResult,
    });
  } catch (error: any) {
    console.error("Admin Update Result Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update result" }, { status: 500 });
  }
}
