import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { QuestionPaper } from "@/models/QuestionPaper";
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const deletedPaper = await QuestionPaper.findByIdAndDelete(id);

    if (!deletedPaper) {
      return NextResponse.json({ error: "Question paper not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Question paper deleted successfully",
      paper: deletedPaper
    });
  } catch (error: any) {
    console.error("Delete Question Paper Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete question paper" }, { status: 500 });
  }
}
