import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Candidate } from "@/models/Candidate";
import { Associate } from "@/models/Associate";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";

export async function GET() {
  try {
    await dbConnect();

    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("associate_token");

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: "Session token not found" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tokenCookie.value, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Session token is invalid or expired" }, { status: 401 });
    }

    if (!decoded || !decoded.id || decoded.role !== "associate") {
      return NextResponse.json({ error: "Token payload is invalid" }, { status: 401 });
    }

    const associate = await Associate.findById(decoded.id);
    if (!associate) {
      return NextResponse.json({ error: "Associate profile not found" }, { status: 401 });
    }

    if (associate.status !== "approved") {
      return NextResponse.json({ error: "Associate is not approved" }, { status: 403 });
    }

    // Retrieve students registered with this associate's code
    const students = await Candidate.find({ agentCode: associate.agentCode })
      .select("-password")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      students,
      count: students.length,
    });
  } catch (error: any) {
    console.error("Associate Students API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch associate students" }, { status: 500 });
  }
}
