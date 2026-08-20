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

export async function GET() {
  try {
    await dbConnect();
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    console.error("Fetch Coupons Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch coupons" }, { status: 500 });
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
    const { code, discountAmount, maxUses, course, expiryDate } = data;

    if (!code || !discountAmount || !maxUses) {
      return NextResponse.json({ error: "Coupon code, discount amount, and max uses limit are required" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const numDiscount = Number(discountAmount);
    const numMaxUses = Number(maxUses);

    if (isNaN(numDiscount) || numDiscount <= 0) {
      return NextResponse.json({ error: "Discount amount must be greater than 0" }, { status: 400 });
    }

    if (isNaN(numMaxUses) || numMaxUses <= 0) {
      return NextResponse.json({ error: "Max usage limit must be at least 1" }, { status: 400 });
    }

    // Check duplicate code
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return NextResponse.json({ error: `Coupon code "${cleanCode}" already exists` }, { status: 400 });
    }

    const newCoupon = new Coupon({
      code: cleanCode,
      discountAmount: numDiscount,
      maxUses: numMaxUses,
      usedCount: 0,
      course: course || "ALL",
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isActive: true,
      createdAt: new Date(),
    });

    await newCoupon.save();

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error: any) {
    console.error("Create Coupon Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create coupon" }, { status: 500 });
  }
}
