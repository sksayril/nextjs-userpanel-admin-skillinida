import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Candidate } from "@/models/Candidate";
import { Attendance } from "@/models/Attendance";
import { Result } from "@/models/Result";
import { autoSubmitPendingExamSessions } from "@/lib/resultHelpers";
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;

    const student = await Candidate.findById(id).select("-password");
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await autoSubmitPendingExamSessions(id);

    const attendance = await Attendance.find({ candidateId: id }).sort({ date: -1 });
    const results = await Result.find({ candidateId: id }).sort({ date: -1 });

    return NextResponse.json({
      success: true,
      student,
      attendance,
      results,
    });
  } catch (error: any) {
    console.error("Fetch Student Details Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch student details" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const student = await Candidate.findById(id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

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
      profilePicUrl,
      signatureUrl,
      course,
      category,
      gender,
      password,
      pincode,
      state,
    } = body;

    if (name) student.name = name;
    if (fatherName) student.fatherName = fatherName;
    if (motherName) student.motherName = motherName;
    if (dob) student.dob = new Date(dob);
    if (address) student.address = address;
    if (pincode !== undefined) student.pincode = pincode;
    if (state !== undefined) student.state = state;
    if (admitUrl) student.admitUrl = admitUrl;
    if (qualificationUrl) student.qualificationUrl = qualificationUrl;
    if (profilePicUrl) student.profilePicUrl = profilePicUrl;
    if (signatureUrl) student.signatureUrl = signatureUrl;
    if (extraQualificationUrl !== undefined) student.extraQualificationUrl = extraQualificationUrl;

    if (email) {
      student.email = email.toLowerCase().trim();
    }

    if (phone) student.phone = phone;

    if (district) {
      if (district.trim() === "") {
        return NextResponse.json({ error: "District cannot be empty" }, { status: 400 });
      }
      student.district = district;
    }

    if (course) student.course = course;

    if (category) {
      const allowedCategories = ["GEN", "OBC", "SC", "ST"];
      if (allowedCategories.includes(category)) {
        student.category = category;
      }
    }

    if (gender) {
      const allowedGenders = ["MALE", "FEMALE", "OTHER"];
      if (allowedGenders.includes(gender.toUpperCase())) {
        student.gender = gender.toUpperCase();
      }
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
      }
      student.password = await bcrypt.hash(password, 10);
      student.originalPassword = password;
    }

    await student.save({ validateBeforeSave: false });

    return NextResponse.json({
      success: true,
      message: "Student profile updated successfully",
      student,
    });
  } catch (error: any) {
    console.error("Update Student Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update student profile" }, { status: 500 });
  }
}
