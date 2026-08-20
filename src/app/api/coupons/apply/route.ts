import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Coupon } from "@/models/Coupon";
import { Course } from "@/models/Course";
import { Candidate } from "@/models/Candidate";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";

async function verifyStudent() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.id) {
      return decoded;
    }
  } catch (err) {
    return null;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const studentDecoded = await verifyStudent();
    if (!studentDecoded) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { code, courseTitle } = await request.json();
    if (!code) {
      return NextResponse.json({ error: "Please enter a coupon code" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      return NextResponse.json({ error: "Invalid coupon code entered" }, { status: 400 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: "This coupon is currently inactive" }, { status: 400 });
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: `Coupon code usage limit reached (${coupon.maxUses} uses max)` }, { status: 400 });
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return NextResponse.json({ error: "This coupon code has expired" }, { status: 400 });
    }

    // Check course targeting
    if (coupon.course && coupon.course !== "ALL") {
      const studentCourse = (courseTitle || "").trim().toLowerCase();
      const targetCourse = coupon.course.trim().toLowerCase();

      if (studentCourse !== targetCourse && !studentCourse.includes(targetCourse) && !targetCourse.includes(studentCourse)) {
        return NextResponse.json({ error: `This coupon is valid only for "${coupon.course}" course` }, { status: 400 });
      }
    }

    // Find course details for price calculation
    const candidate = await Candidate.findById(studentDecoded.id);
    const courseName = courseTitle || candidate?.course || "";

    const courseDoc = await Course.findOne({
      $or: [
        { title: { $regex: new RegExp(`^${courseName.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, "i") } },
        { code: { $regex: new RegExp(`^${courseName.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, "i") } }
      ]
    });

    const originalPrice = courseDoc ? courseDoc.price : 500;
    const discountAmount = Math.min(originalPrice, coupon.discountAmount);
    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountAmount: discountAmount,
        originalPrice,
        finalPrice,
        maxUses: coupon.maxUses,
        usedCount: coupon.usedCount,
      },
      message: `Coupon "${coupon.code}" applied! You get ₹${discountAmount} OFF. Payable: ₹${finalPrice}`,
    });
  } catch (error: any) {
    console.error("Apply Coupon Error:", error);
    return NextResponse.json({ error: error.message || "Failed to apply coupon" }, { status: 500 });
  }
}
