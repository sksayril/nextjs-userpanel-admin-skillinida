import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Associate } from "@/models/Associate";
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
    const { status } = await request.json();

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value. Must be 'approved' or 'rejected'." }, { status: 400 });
    }

    const associate = await Associate.findById(id);
    if (!associate) {
      return NextResponse.json({ error: "Associate not found" }, { status: 404 });
    }

    associate.status = status;
    await associate.save();

    return NextResponse.json({
      success: true,
      message: `Associate account has been successfully ${status}`,
      agent: associate,
      associate,
    });
  } catch (error: any) {
    console.error("Admin Associate Approval Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update associate status" }, { status: 500 });
  }
}
