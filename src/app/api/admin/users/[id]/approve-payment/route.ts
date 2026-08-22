import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
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

export async function POST(
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
    const body = await request.json().catch(() => ({}));
    const student = await Candidate.findById(id);

    if (!student) {
      return NextResponse.json({ error: "Student account not found" }, { status: 404 });
    }

    // Target status: if explicitly passed use that, otherwise toggle or default to true (Approve)
    const targetStatus = body.isPaid !== undefined ? !!body.isPaid : (student.isPaid ? false : true);

    student.isPaid = targetStatus;
    if (targetStatus) {
      student.paymentDetails = {
        orderId: student.paymentDetails?.orderId || `MANUAL-${Date.now()}`,
        paymentId: student.paymentDetails?.paymentId || `PAY-ADMIN-GRANT-${Date.now()}`,
        signature: student.paymentDetails?.signature || "MANUAL_APPROVAL_ADMIN",
        amount: student.paymentDetails?.amount || student.registeredPrice || 0,
        paidAt: new Date(),
      };
    }

    await student.save({ validateBeforeSave: false });

    return NextResponse.json({
      success: true,
      message: `Payment status for ${student.name} updated to ${targetStatus ? "Paid / Approved" : "Pending"}`,
      student,
    });
  } catch (error: any) {
    console.error("Approve Payment Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update payment status" }, { status: 500 });
  }
}
