import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Settings } from "@/models/Settings";
import { Candidate } from "@/models/Candidate";
import { Course } from "@/models/Course";
import { Coupon } from "@/models/Coupon";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import crypto from "crypto";

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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, couponCode } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required payment verification details" }, { status: 400 });
    }

    let settings = await Settings.findOne({});
    let razorpayKeySecret = settings?.razorpayKeySecret || "";

    if (!razorpayKeySecret && process.env.RAZORPAY_KEY_SECRET) {
      razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
      if (settings) {
        settings.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
        if (process.env.RAZORPAY_KEY_ID && !settings.razorpayKeyId) {
          settings.razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        }
        await settings.save();
      } else {
        const newSettings = new Settings({
          razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
          razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET
        });
        await newSettings.save();
      }
    }

    if (!razorpayKeySecret) {
      return NextResponse.json({ error: "Razorpay payment keys are not configured" }, { status: 500 });
    }

    // Verify Razorpay signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Payment verification failed: invalid signature" }, { status: 400 });
    }

    const candidate = await Candidate.findById(studentDecoded.id);
    if (!candidate) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });
    }

    const courseQuery = candidate.course ? candidate.course.trim() : "";
    const course = await Course.findOne({
      $or: [
        { title: { $regex: new RegExp(`^${courseQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, "i") } },
        { code: { $regex: new RegExp(`^${courseQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, "i") } }
      ]
    });

    const price = course ? course.price : 0;

    // Update candidate payment details
    candidate.isPaid = true;
    candidate.paymentDetails = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount: price,
      paidAt: new Date()
    };

    await candidate.save({ validateBeforeSave: false });

    if (couponCode) {
      try {
        const cleanCode = couponCode.trim().toUpperCase();
        const appliedCoupon = await Coupon.findOne({ code: cleanCode });
        if (appliedCoupon) {
          appliedCoupon.usedCount += 1;
          await appliedCoupon.save();
        }
      } catch (cErr) {
        console.error("Failed to increment coupon count:", cErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully. Enrolled course unlocked.",
      candidate: {
        id: candidate._id,
        isPaid: true
      }
    });

  } catch (error: any) {
    console.error("Verify Payment Route Error:", error);
    return NextResponse.json({ error: error.message || "Failed to verify payment" }, { status: 500 });
  }
}
