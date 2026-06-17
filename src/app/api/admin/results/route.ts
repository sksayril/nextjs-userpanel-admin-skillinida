import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Result } from "@/models/Result";
import { Candidate } from "@/models/Candidate"; // Ensure Candidate model is registered
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
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Load Candidate model explicitly to register it in Mongoose models dictionary
    // so populate("candidateId") works correctly.
    const results = await Result.find({})
      .populate("candidateId", "name email registrationId course")
      .sort({ date: -1 });

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Admin Fetch Results Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch results" }, { status: 500 });
  }
}
