import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Associate } from "@/models/Associate";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

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
    const { name, email, phone, password, status } = body;

    const associate = await Associate.findById(id);
    if (!associate) {
      return NextResponse.json({ error: "Associate not found" }, { status: 404 });
    }

    if (name) associate.name = name.trim();
    if (email) {
      const emailLower = email.toLowerCase().trim();
      if (associate.email !== emailLower) {
        const existing = await Associate.findOne({ email: emailLower });
        if (existing) {
          return NextResponse.json({ error: "An associate with this email already exists" }, { status: 400 });
        }
        associate.email = emailLower;
      }
    }
    if (phone) associate.phone = phone.trim();
    if (status) {
      const allowedStatus = ["pending", "approved", "rejected"];
      if (allowedStatus.includes(status)) {
        associate.status = status;
      }
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
      }
      associate.password = await bcrypt.hash(password, 10);
      associate.originalPassword = password;
    }

    await associate.save({ validateBeforeSave: false });

    return NextResponse.json({
      success: true,
      message: "Associate updated successfully",
      associate,
    });
  } catch (error: any) {
    console.error("Update Associate Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update associate" }, { status: 500 });
  }
}
