import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("associate_token");

    return NextResponse.json({
      success: true,
      message: "Associate logged out successfully",
    });
  } catch (error: any) {
    console.error("Associate Logout Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process logout" }, { status: 500 });
  }
}
