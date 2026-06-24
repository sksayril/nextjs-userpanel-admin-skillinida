import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Candidate } from "@/models/Candidate";
import { Otp } from "@/models/Otp";
import { Agent } from "@/models/Agent";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();

    const {
      name,
      fatherName,
      motherName,
      dob,
      email,
      phone,
      address,
      admitUrl,
      qualificationUrl,
      extraQualificationUrl,
      course,
      category,
      gender,
      otp,
      password,
      agentCode,
      profilePicUrl,
    } = data;

    // 1. Check required fields
    if (
      !name ||
      !fatherName ||
      !motherName ||
      !dob ||
      !email ||
      !phone ||
      !address ||
      !admitUrl ||
      !qualificationUrl ||
      !profilePicUrl ||
      !course ||
      !otp ||
      !password
    ) {
      return NextResponse.json({ error: "Missing required registration fields (Name, Documents, Profile Picture, etc.)" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    // 2. Validate OTP code from the database
    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord || otpRecord.code !== otp) {
      return NextResponse.json({ error: "Invalid or expired OTP code" }, { status: 400 });
    }

    // Remove used OTP code immediately to prevent double submissions
    await Otp.deleteOne({ email });

    // Validate Agent Code if provided
    if (agentCode) {
      const agent = await Agent.findOne({ agentCode: agentCode.trim() });
      if (!agent) {
        return NextResponse.json({ error: "Invalid agent code entered" }, { status: 400 });
      }
      if (agent.status !== "approved") {
        return NextResponse.json({ error: "Agent associated with this code is not approved yet" }, { status: 400 });
      }
    }

    // 3. Prevent duplicate email registrations
    const existingCandidate = await Candidate.findOne({ email });
    if (existingCandidate) {
      return NextResponse.json(
        { error: "Candidate with this email has already been registered" },
        { status: 400 }
      );
    }

    // 4. Generate a collision-free unique Registration ID
    let registrationId = "";
    let isUnique = false;
    const currentYear = new Date().getFullYear();

    while (!isUnique) {
      const randomFourDigits = Math.floor(1000 + Math.random() * 9000).toString();
      registrationId = `SMI-${currentYear}-${randomFourDigits}`;

      // Check for collision in MongoDB
      const duplicate = await Candidate.findOne({ registrationId });
      if (!duplicate) {
        isUnique = true;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const allowedCategories = ["GEN", "OBC", "SC", "ST"];
    const finalCategory = allowedCategories.includes(category) ? category : "GEN";

    const allowedGenders = ["MALE", "FEMALE", "OTHER"];
    const finalGender = allowedGenders.includes(gender?.toUpperCase()) ? gender.toUpperCase() : "MALE";

    // 5. Store Candidate Document in MongoDB
    const candidateDoc = new Candidate({
      name,
      fatherName,
      motherName,
      dob: new Date(dob),
      email,
      phone,
      address,
      admitUrl,
      qualificationUrl,
      extraQualificationUrl: extraQualificationUrl || undefined,
      course,
      category: finalCategory,
      gender: finalGender,
      registrationId,
      password: hashedPassword,
      originalPassword: password,
      agentCode: agentCode ? agentCode.trim() : null,
      profilePicUrl: profilePicUrl || null,
    });

    await candidateDoc.save();

    return NextResponse.json({
      success: true,
      message: "Candidate registered successfully",
      candidate: candidateDoc,
    });
  } catch (error: any) {
    console.error("Registration API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process candidate registration" }, { status: 500 });
  }
}
