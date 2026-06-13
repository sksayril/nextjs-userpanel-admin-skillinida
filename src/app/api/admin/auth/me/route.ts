import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Admin } from "@/models/Admin";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";

export async function GET() {
  try {
    await dbConnect();
    
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("admin_token");

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: "Session token not found" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tokenCookie.value, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Session token is invalid or expired" }, { status: 401 });
    }

    if (!decoded || !decoded.id || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return NextResponse.json({ error: "Admin profile not found" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      admin,
    });
  } catch (error: any) {
    console.error("Admin Session Check Error:", error);
    return NextResponse.json({ error: error.message || "Failed to check session" }, { status: 500 });
  }
}
