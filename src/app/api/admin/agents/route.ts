import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Agent } from "@/models/Agent";
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

export async function GET() {
  try {
    await dbConnect();
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const agents = await Agent.find({}).sort({ createdAt: -1 });

    // Populate each agent with dynamic count of registered candidates
    const populatedAgents = await Promise.all(
      agents.map(async (agentDoc) => {
        const studentCount = await Candidate.countDocuments({ agentCode: agentDoc.agentCode });
        return {
          id: agentDoc._id,
          name: agentDoc.name,
          email: agentDoc.email,
          phone: agentDoc.phone,
          agentCode: agentDoc.agentCode,
          originalPassword: agentDoc.originalPassword,
          status: agentDoc.status,
          createdAt: agentDoc.createdAt,
          studentCount,
        };
      })
    );

    return NextResponse.json({ success: true, agents: populatedAgents });
  } catch (error: any) {
    console.error("Fetch Agents Admin Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch agents list" }, { status: 500 });
  }
}
