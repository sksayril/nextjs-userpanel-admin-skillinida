import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Admin } from "@/models/Admin";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existingAdmin) {
      return NextResponse.json({ error: "An admin account with this email already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    await admin.save();

    return NextResponse.json({
      success: true,
      message: "Admin registered successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error: any) {
    console.error("Admin Signup API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to register admin" }, { status: 500 });
  }
}
