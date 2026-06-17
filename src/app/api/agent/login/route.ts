import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Agent } from "@/models/Agent";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const agent = await Agent.findOne({ email: email.toLowerCase().trim() });
    if (!agent) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, agent.password || "");
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check agent approval status
    if (agent.status === "pending") {
      return NextResponse.json(
        { error: "Your account is pending admin approval. Please wait for an administrator to review your registration." },
        { status: 403 }
      );
    }

    if (agent.status === "rejected") {
      return NextResponse.json(
        { error: "Your agent account application was rejected. Please contact support for more details." },
        { status: 403 }
      );
    }

    const token = jwt.sign(
      {
        id: agent._id,
        email: agent.email,
        name: agent.name,
        agentCode: agent.agentCode,
        role: "agent",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const cookieStore = await cookies();
    cookieStore.set("agent_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Agent logged in successfully",
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        agentCode: agent.agentCode,
      },
    });
  } catch (error: any) {
    console.error("Agent Login Error:", error);
    return NextResponse.json({ error: error.message || "Failed to authenticate agent" }, { status: 500 });
  }
}
