import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Associate } from "@/models/Associate";
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

    const associate = await Associate.findOne({ email: email.toLowerCase().trim() });
    if (!associate) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, associate.password || "");
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check associate approval status
    if (associate.status === "pending") {
      return NextResponse.json(
        { error: "Your account is pending admin approval. Please wait for an administrator to review your registration." },
        { status: 403 }
      );
    }

    if (associate.status === "rejected") {
      return NextResponse.json(
        { error: "Your associate account application was rejected. Please contact support for more details." },
        { status: 403 }
      );
    }

    const token = jwt.sign(
      {
        id: associate._id,
        email: associate.email,
        name: associate.name,
        agentCode: associate.agentCode,
        role: "associate",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const cookieStore = await cookies();
    cookieStore.set("associate_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Associate logged in successfully",
      agent: {
        id: associate._id,
        name: associate.name,
        email: associate.email,
        agentCode: associate.agentCode,
      },
      associate: {
        id: associate._id,
        name: associate.name,
        email: associate.email,
        associateCode: associate.agentCode,
      },
    });
  } catch (error: any) {
    console.error("Associate Login Error:", error);
    return NextResponse.json({ error: error.message || "Failed to authenticate associate" }, { status: 500 });
  }
}
