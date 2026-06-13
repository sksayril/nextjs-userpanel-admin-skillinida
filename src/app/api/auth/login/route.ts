import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Candidate } from "@/models/Candidate";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { identifier, password } = await request.json();
 
     if (!identifier || !password) {
       return NextResponse.json({ error: "Registration ID/Email and Password are required" }, { status: 400 });
     }
 
     // Find candidate by registrationId or email
     const candidate = await Candidate.findOne({
       $or: [
         { registrationId: identifier.trim() },
         { email: identifier.trim().toLowerCase() }
       ]
     });
 
     if (!candidate) {
       return NextResponse.json({ error: "Invalid registration details" }, { status: 401 });
     }
 
     // Verify Password
     const isPasswordMatch = await bcrypt.compare(password, candidate.password || "");
     if (!isPasswordMatch) {
       return NextResponse.json({ error: "Invalid password entered" }, { status: 401 });
     }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: candidate._id,
        registrationId: candidate.registrationId,
        email: candidate.email,
        name: candidate.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" } // 7 Days expiry
    );

    // Set cookie using Next.js native cookies store
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      candidate: {
        id: candidate._id,
        registrationId: candidate.registrationId,
        name: candidate.name,
        email: candidate.email,
      }
    });
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to authenticate candidate" }, { status: 500 });
  }
}
