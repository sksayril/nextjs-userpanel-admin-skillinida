import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Settings } from "@/models/Settings";

// Public endpoint - no auth required
// Only exposes non-sensitive settings (whatsappChannelLink)
export async function GET() {
  try {
    await dbConnect();

    const settings = await Settings.findOne({});

    return NextResponse.json({
      success: true,
      settings: {
        whatsappChannelLink: settings?.whatsappChannelLink || "",
      }
    });
  } catch (error: any) {
    console.error("Fetch Public Settings Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 });
  }
}
