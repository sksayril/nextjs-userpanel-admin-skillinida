import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Candidate } from "@/models/Candidate";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { isValidWestBengalDistrict } from "@/lib/westBengalDistricts";

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

    const students = await Candidate.find({}).select("-password").sort({ createdAt: -1 });
    return NextResponse.json({ success: true, students });
  } catch (error: any) {
    console.error("Fetch Students Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch candidates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

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
      password,
    } = data;

    // Check required fields
    if (
      !name ||
      !fatherName ||
      !motherName ||
      !dob ||
      !email ||
      !phone ||
      !address ||
      !district ||
      !admitUrl ||
      !qualificationUrl ||
      !course ||
      !password
    ) {
      return NextResponse.json({ error: "Missing required registration fields" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    if (!isValidWestBengalDistrict(district)) {
      return NextResponse.json({ error: "Please select a valid West Bengal district" }, { status: 400 });
    }

    // Check duplicate email
    const existingCandidate = await Candidate.findOne({ email: email.toLowerCase().trim() });
    if (existingCandidate) {
      return NextResponse.json({ error: "A student with this email has already been registered" }, { status: 400 });
    }

    // Generate Registration ID
    let registrationId = "";
    let isUnique = false;
    const currentYear = new Date().getFullYear();

    while (!isUnique) {
      const randomFourDigits = Math.floor(1000 + Math.random() * 9000).toString();
      registrationId = `SMI-${currentYear}-${randomFourDigits}`;

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

    const student = new Candidate({
      name,
      fatherName,
      motherName,
      dob: new Date(dob),
      email: email.toLowerCase().trim(),
      phone,
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
    });

    await student.save();

    const studentObject = student.toObject();
    delete (studentObject as { password?: string }).password;
    delete (studentObject as { originalPassword?: string }).originalPassword;

    return NextResponse.json({
      success: true,
      message: "Student registered successfully",
      student: studentObject,
    });
  } catch (error: any) {
    console.error("Admin Student Creation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create student account" }, { status: 500 });
  }
}
