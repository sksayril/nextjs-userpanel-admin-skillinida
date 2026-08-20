import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Coupon } from "@/models/Coupon";
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
    const data = await request.json();
    const { code, discountAmount, maxUses, course, expiryDate, isActive } = data;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    if (code && code.trim().toUpperCase() !== coupon.code) {
      const cleanCode = code.trim().toUpperCase();
      const existing = await Coupon.findOne({ code: cleanCode });
      if (existing) {
        return NextResponse.json({ error: `Coupon code "${cleanCode}" already exists` }, { status: 400 });
      }
      coupon.code = cleanCode;
    }

    if (discountAmount !== undefined) coupon.discountAmount = Number(discountAmount);
    if (maxUses !== undefined) coupon.maxUses = Number(maxUses);
    if (course !== undefined) coupon.course = course || "ALL";
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (isActive !== undefined) coupon.isActive = Boolean(isActive);

    await coupon.save();

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    console.error("Update Coupon Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(
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
    const deletedCoupon = await Coupon.findByIdAndDelete(id);

    if (!deletedCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Coupon "${deletedCoupon.code}" deleted successfully` });
  } catch (error: any) {
    console.error("Delete Coupon Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete coupon" }, { status: 500 });
  }
}
