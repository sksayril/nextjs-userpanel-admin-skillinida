import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Settings } from "@/models/Settings";
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

export async function GET() {
  try {
    await dbConnect();
    const student = await verifyStudent();
    if (!student) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    let settings = await Settings.findOne({});
    let razorpayKeyId = settings?.razorpayKeyId || "";
    
    if (!razorpayKeyId && process.env.RAZORPAY_KEY_ID) {
      razorpayKeyId = process.env.RAZORPAY_KEY_ID;
      if (settings) {
        settings.razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        if (process.env.RAZORPAY_KEY_SECRET && !settings.razorpayKeySecret) {
          settings.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
        }
        await settings.save();
      } else {
        const newSettings = new Settings({
          razorpayKeyId: process.env.RAZORPAY_KEY_ID,
          razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || ""
        });
        await newSettings.save();
      }
    }

    return NextResponse.json({
      success: true,
      keyId: razorpayKeyId
    });
  } catch (error: any) {
    console.error("Fetch Razorpay Key Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch Razorpay Key ID" }, { status: 500 });
  }
}
