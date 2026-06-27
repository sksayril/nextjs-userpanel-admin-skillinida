import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Associate } from "@/models/Associate";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";

export async function GET() {
  try {
    await dbConnect();

    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("associate_token");

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: "Session token not found" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tokenCookie.value, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Session token is invalid or expired" }, { status: 401 });
    }

    if (!decoded || !decoded.id || decoded.role !== "associate") {
      return NextResponse.json({ error: "Token payload is invalid" }, { status: 401 });
    }

    const associate = await Associate.findById(decoded.id).select("-password -originalPassword");
    if (!associate) {
      return NextResponse.json({ error: "Associate profile not found" }, { status: 401 });
    }

    if (associate.status !== "approved") {
      return NextResponse.json({ error: "Associate status is not approved" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      agent: associate, // Keep key name 'agent' in response JSON so dashboard frontend doesn't need field changes, or update both! Let's return both or update the frontend! Returning both `agent` and `associate` keys is extremely robust!
      associate,
    });
  } catch (error: any) {
    console.error("Associate Session Check Error:", error);
    return NextResponse.json({ error: error.message || "Failed to check session" }, { status: 500 });
  }
}
