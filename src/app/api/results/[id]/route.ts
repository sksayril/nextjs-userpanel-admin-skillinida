import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Result } from "@/models/Result";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";

async function verifyStudent() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded?.id) return decoded;
  } catch {
    return null;
  }
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const student = await verifyStudent();
    if (!student) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const result = await Result.findOne({
      _id: id,
      candidateId: student.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    const obj = result.toObject() as Record<string, unknown>;

    if (!obj.isApproved) {
      return NextResponse.json(
        {
          error:
            "This marksheet is pending administrator approval and cannot be printed yet.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      result: obj,
    });
  } catch (error: any) {
    console.error("Fetch Single Result Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch result" },
      { status: 500 }
    );
  }
}
