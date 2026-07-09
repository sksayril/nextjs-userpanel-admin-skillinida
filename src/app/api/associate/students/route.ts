import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Candidate } from "@/models/Candidate";
import { Associate } from "@/models/Associate";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";

function mapStudentForAssociate(student: {
  _id: unknown;
  name: string;
  fatherName: string;
  motherName: string;
  dob: Date;
  email: string;
  phone: string;
  address: string;
  district: string;
  state?: string;
  pincode?: string;
  course: string;
  category: string;
  gender: string;
  registrationId: string;
  agentCode?: string | null;
  isPaid: boolean;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    id: String(student._id),
    name: student.name,
    fatherName: student.fatherName,
    motherName: student.motherName,
    dob: student.dob,
    email: student.email,
    phone: student.phone,
    address: student.address,
    district: student.district,
    state: student.state || "",
    pincode: student.pincode || "",
    course: student.course,
    category: student.category,
    gender: student.gender,
    registrationId: student.registrationId,
    agentCode: student.agentCode,
    isPaid: student.isPaid,
    isActive: student.isActive,
    createdAt: student.createdAt,
  };
}

export async function GET() {
  try {
    await dbConnect();

    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("associate_token");

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: "Session token not found" }, { status: 401 });
    }

    let decoded: { id?: string; role?: string };
    try {
      decoded = jwt.verify(tokenCookie.value, JWT_SECRET) as { id?: string; role?: string };
    } catch {
      return NextResponse.json({ error: "Session token is invalid or expired" }, { status: 401 });
    }

    if (!decoded?.id || decoded.role !== "associate") {
      return NextResponse.json({ error: "Token payload is invalid" }, { status: 401 });
    }

    const associate = await Associate.findById(decoded.id);
    if (!associate) {
      return NextResponse.json({ error: "Associate profile not found" }, { status: 401 });
    }

    if (associate.status !== "approved") {
      return NextResponse.json({ error: "Associate is not approved" }, { status: 403 });
    }

    const students = await Candidate.find({ agentCode: associate.agentCode })
      .select(
        "name fatherName motherName dob email phone address district state pincode course category gender registrationId agentCode isPaid isActive createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    const mappedStudents = students.map(mapStudentForAssociate);

    return NextResponse.json({
      success: true,
      students: mappedStudents,
      count: mappedStudents.length,
      associateCode: associate.agentCode,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch associate students";
    console.error("Associate Students API Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
