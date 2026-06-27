import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Associate } from "@/models/Associate";
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

    const associates = await Associate.find({}).sort({ createdAt: -1 });

    // Populate each associate with dynamic count of registered candidates
    const populatedAssociates = await Promise.all(
      associates.map(async (associateDoc) => {
        const studentCount = await Candidate.countDocuments({ agentCode: associateDoc.agentCode });
        return {
          id: associateDoc._id,
          name: associateDoc.name,
          email: associateDoc.email,
          phone: associateDoc.phone,
          agentCode: associateDoc.agentCode,
          originalPassword: associateDoc.originalPassword,
          status: associateDoc.status,
          createdAt: associateDoc.createdAt,
          studentCount,
        };
      })
    );

    return NextResponse.json({ success: true, agents: populatedAssociates, associates: populatedAssociates });
  } catch (error: any) {
    console.error("Fetch Associates Admin Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch associates list" }, { status: 500 });
  }
}
