import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Settings } from "@/models/Settings";
import { Candidate } from "@/models/Candidate";
import { Course } from "@/models/Course";
import { Coupon } from "@/models/Coupon";
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

    let reqBody: any = {};
    try {
      reqBody = await request.json();
    } catch (e) {
      // optional body
    }
    const { couponCode } = reqBody;

    const candidate = await Candidate.findById(studentDecoded.id);
    if (!candidate) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });
    }

    // Try to find course in database matching the candidate's registered course string
    const course = await Course.findOne({
      $or: [
        { title: candidate.course },
        { code: candidate.course }
      ]
    });

    if (!course) {
      return NextResponse.json({ error: "Enrolled course details not found" }, { status: 404 });
    }

    if (!course.isPaid || course.price === 0) {
      return NextResponse.json({ error: "This course is free, no payment is required" }, { status: 400 });
    }

    if (candidate.isPaid || candidate.isFreeRegistration || candidate.registeredPrice === 0) {
      return NextResponse.json({ error: "You have already been granted full access to this course (no payment required)" }, { status: 400 });
    }

    let payableAmount = course.price;
    let appliedCouponDoc: any = null;

    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      appliedCouponDoc = await Coupon.findOne({ code: cleanCode });
      if (appliedCouponDoc && appliedCouponDoc.isActive && appliedCouponDoc.usedCount < appliedCouponDoc.maxUses) {
        const discount = appliedCouponDoc.discountAmount || 0;
        payableAmount = Math.max(0, course.price - discount);
      }
    }

    if (payableAmount === 0) {
      // 100% Free with Coupon!
      candidate.isPaid = true;
      candidate.paymentDetails = {
        orderId: `COUPON_${appliedCouponDoc?.code || "FREE"}`,
        paymentId: `PAY_${Date.now()}`,
        signature: "COUPON_100_PERCENT_DISCOUNT",
        amount: 0,
        paidAt: new Date(),
      };
      await candidate.save();

      if (appliedCouponDoc) {
        appliedCouponDoc.usedCount += 1;
        await appliedCouponDoc.save();
      }

      return NextResponse.json({
        success: true,
        isFreeWithCoupon: true,
        message: "100% Discount coupon applied! Full course access granted.",
      });
    }

    let settings = await Settings.findOne({});
    let razorpayKeyId = settings?.razorpayKeyId || "";
    let razorpayKeySecret = settings?.razorpayKeySecret || "";

    let settingsModified = false;
    if (!razorpayKeyId && process.env.RAZORPAY_KEY_ID) {
      razorpayKeyId = process.env.RAZORPAY_KEY_ID;
      if (settings) {
        settings.razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        settingsModified = true;
      }
    }
    if (!razorpayKeySecret && process.env.RAZORPAY_KEY_SECRET) {
      razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
      if (settings) {
        settings.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
        settingsModified = true;
      }
    }
    if (settingsModified && settings) {
      await settings.save();
    } else if (!settings && razorpayKeyId) {
      const newSettings = new Settings({
        razorpayKeyId,
        razorpayKeySecret
      });
      await newSettings.save();
    }

    console.log("[Create Order] Resolved Razorpay Key ID:", razorpayKeyId ? razorpayKeyId.slice(0, 10) + "..." : "EMPTY");
    console.log("[Create Order] Resolved Razorpay Key Secret:", razorpayKeySecret ? razorpayKeySecret.slice(0, 5) + "..." : "EMPTY");

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json({ error: "Razorpay payment keys are not configured" }, { status: 500 });
    }

    const amountInPaise = Math.round(payableAmount * 100);
    const receiptId = `rcpt_${candidate._id.toString().slice(-6)}_${Date.now().toString().slice(-6)}`;

    // Call Razorpay API directly using fetch
    const authString = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");
    const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: receiptId
      })
    });

    const orderData = await rzpResponse.json();

    if (!rzpResponse.ok) {
      console.error("Razorpay Order Creation Error:", orderData);
      return NextResponse.json({ error: orderData.error?.description || "Failed to create Razorpay order" }, { status: rzpResponse.status });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        key: razorpayKeyId
      }
    });

  } catch (error: any) {
    console.error("Create Order Route Error:", error);
    return NextResponse.json({ error: error.message || "Failed to initialize payment order" }, { status: 500 });
  }
}
