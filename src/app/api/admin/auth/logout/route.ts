import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_token");
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    console.error("Admin Logout Error:", error);
    return NextResponse.json({ error: error.message || "Failed to logout" }, { status: 500 });
  }
}
