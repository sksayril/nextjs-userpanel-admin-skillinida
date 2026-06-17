import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Candidate } from "@/models/Candidate";
import { Agent } from "@/models/Agent";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";

export async function GET() {
  try {
    await dbConnect();

    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("agent_token");

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: "Session token not found" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tokenCookie.value, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Session token is invalid or expired" }, { status: 401 });
    }

    if (!decoded || !decoded.id || decoded.role !== "agent") {
      return NextResponse.json({ error: "Token payload is invalid" }, { status: 401 });
    }

    const agent = await Agent.findById(decoded.id);
    if (!agent) {
      return NextResponse.json({ error: "Agent profile not found" }, { status: 401 });
    }

    if (agent.status !== "approved") {
      return NextResponse.json({ error: "Agent is not approved" }, { status: 403 });
    }

    // Retrieve students registered with this agent's code
    const students = await Candidate.find({ agentCode: agent.agentCode })
      .select("-password")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      students,
      count: students.length,
    });
  } catch (error: any) {
    console.error("Agent Students API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch agent students" }, { status: 500 });
  }
}
