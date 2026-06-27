import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Settings } from "@/models/Settings";
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

    let settings = await Settings.findOne({});
    let needsSave = false;
    if (!settings) {
      settings = new Settings({
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
        razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || ""
      });
      needsSave = true;
    } else {
      if (!settings.razorpayKeyId && process.env.RAZORPAY_KEY_ID) {
        settings.razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        needsSave = true;
      }
      if (!settings.razorpayKeySecret && process.env.RAZORPAY_KEY_SECRET) {
        settings.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
        needsSave = true;
      }
    }
    if (needsSave) {
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      settings: {
        razorpayKeyId: settings.razorpayKeyId,
        razorpayKeySecret: settings.razorpayKeySecret, // Exposed only in admin dashboard
        whatsappChannelLink: settings.whatsappChannelLink || ""
      }
    });
  } catch (error: any) {
    console.error("Fetch Settings Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { razorpayKeyId, razorpayKeySecret, whatsappChannelLink } = await request.json();

    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings({
        razorpayKeyId: razorpayKeyId ? razorpayKeyId.trim() : "",
        razorpayKeySecret: razorpayKeySecret ? razorpayKeySecret.trim() : "",
        whatsappChannelLink: whatsappChannelLink ? whatsappChannelLink.trim() : "",
        updatedAt: new Date()
      });
    } else {
      settings.razorpayKeyId = razorpayKeyId ? razorpayKeyId.trim() : "";
      settings.razorpayKeySecret = razorpayKeySecret ? razorpayKeySecret.trim() : "";
      settings.whatsappChannelLink = whatsappChannelLink ? whatsappChannelLink.trim() : "";
      settings.updatedAt = new Date();
    }

    await settings.save();

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: {
        razorpayKeyId: settings.razorpayKeyId,
        razorpayKeySecret: settings.razorpayKeySecret,
        whatsappChannelLink: settings.whatsappChannelLink || ""
      }
    });
  } catch (error: any) {
    console.error("Update Settings Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
