import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Candidate } from "@/models/Candidate";
import { Otp } from "@/models/Otp";
import { Associate } from "@/models/Associate";
import bcrypt from "bcryptjs";
import { isValidWestBengalDistrict } from "@/lib/westBengalDistricts";

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
      district,
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
      signatureUrl,
      pincode,
      state,
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
      !district ||
      !pincode ||
      !state ||
      !admitUrl ||
      !qualificationUrl ||
      !profilePicUrl ||
      !signatureUrl ||
      !course ||
      !otp ||
      !password
    ) {
      return NextResponse.json({ error: "Missing required registration fields (Name, PIN Code, State, Documents, Profile Picture, Signature, etc.)" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ error: "Phone number must be exactly 10 digits" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    if (!district || district.trim() === "") {
      return NextResponse.json({ error: "District is required" }, { status: 400 });
    }

    // 2. Validate OTP code from the database
    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord || otpRecord.code !== otp) {
      return NextResponse.json({ error: "Invalid or expired OTP code" }, { status: 400 });
    }

    // Remove used OTP code immediately to prevent double submissions
    await Otp.deleteOne({ email });

    // Validate Agent Code if provided (normalize to uppercase for consistent matching)
    const normalizedAgentCode = agentCode ? agentCode.trim().toUpperCase() : null;
    if (normalizedAgentCode) {
      const agent = await Associate.findOne({ agentCode: normalizedAgentCode });
      if (!agent) {
        return NextResponse.json({ error: "Invalid associate code entered" }, { status: 400 });
      }
      if (agent.status !== "approved") {
        return NextResponse.json({ error: "Associate associated with this code is not approved yet" }, { status: 400 });
      }
    }

    // 3. Prevent duplicate email+course registrations (same email can register for different courses)
    const existingCandidate = await Candidate.findOne({ email, course });
    if (existingCandidate) {
      return NextResponse.json(
        { error: "You have already registered for this course with this email" },
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
      phone: cleanPhone,
      address,
      district,
      admitUrl,
      qualificationUrl,
      extraQualificationUrl: extraQualificationUrl || undefined,
      course,
      category: finalCategory,
      gender: finalGender,
      registrationId,
      password: hashedPassword,
      originalPassword: password,
      agentCode: normalizedAgentCode,
      profilePicUrl: profilePicUrl || null,
      signatureUrl: signatureUrl || null,
      pincode: pincode || undefined,
      state: state || undefined,
    });

    await candidateDoc.save();

    const candidateObject = candidateDoc.toObject();
    delete (candidateObject as { password?: string }).password;
    delete (candidateObject as { originalPassword?: string }).originalPassword;

    return NextResponse.json({
      success: true,
      message: "Candidate registered successfully",
      candidate: candidateObject,
    });
  } catch (error: any) {
    console.error("Registration API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process candidate registration" }, { status: 500 });
  }
}
