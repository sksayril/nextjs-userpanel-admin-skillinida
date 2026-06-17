import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Agent } from "@/models/Agent";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();

    const { name, email, phone, password } = data;

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "Missing required signup fields" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const existingAgent = await Agent.findOne({ email: emailLower });
    if (existingAgent) {
      return NextResponse.json({ error: "An agent with this email already exists" }, { status: 400 });
    }

    // Generate unique agent referral code
    let agentCode = "";
    let isUnique = false;
    while (!isUnique) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
      agentCode = `SMI-AGT-${randomDigits}`;

      const duplicate = await Agent.findOne({ agentCode });
      if (!duplicate) {
        isUnique = true;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAgent = new Agent({
      name: name.trim(),
      email: emailLower,
      phone: phone.trim(),
      password: hashedPassword,
      originalPassword: password, // Store plain text for admin view
      agentCode,
      status: "pending",
    });

    await newAgent.save();

    return NextResponse.json({
      success: true,
      message: "Agent registered successfully and pending admin approval",
      agent: {
        id: newAgent._id,
        name: newAgent.name,
        email: newAgent.email,
        agentCode: newAgent.agentCode,
      },
    });
  } catch (error: any) {
    console.error("Agent Signup Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process agent registration" }, { status: 500 });
  }
}
