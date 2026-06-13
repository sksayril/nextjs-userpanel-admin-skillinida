import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Candidate } from "@/models/Candidate";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";

export async function GET() {
  try {
    await dbConnect();
    
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token");

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: "Session token not found" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tokenCookie.value, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Session token is invalid or expired" }, { status: 401 });
    }

    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: "Token payload is invalid" }, { status: 401 });
    }

    // Retrieve full candidate profile from database
    const candidate = await Candidate.findById(decoded.id);

    if (!candidate) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      candidate,
    });
  } catch (error: any) {
    console.error("Session Check Error:", error);
    return NextResponse.json({ error: error.message || "Failed to check session" }, { status: 500 });
  }
}
