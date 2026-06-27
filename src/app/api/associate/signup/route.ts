import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Associate } from "@/models/Associate";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();

    const { name, email, phone, password } = data;

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "Missing required signup fields" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const existingAssociate = await Associate.findOne({ email: emailLower });
    if (existingAssociate) {
      return NextResponse.json({ error: "An associate with this email already exists" }, { status: 400 });
    }

    // Generate unique associate referral code
    let agentCode = "";
    let isUnique = false;
    while (!isUnique) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
      agentCode = `SMI-ASC-${randomDigits}`;

      const duplicate = await Associate.findOne({ agentCode });
      if (!duplicate) {
        isUnique = true;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAssociate = new Associate({
      name: name.trim(),
      email: emailLower,
      phone: phone.trim(),
      password: hashedPassword,
      originalPassword: password, // Store plain text for admin view
      agentCode,
      status: "pending",
    });

    await newAssociate.save();

    return NextResponse.json({
      success: true,
      message: "Associate registered successfully and pending admin approval",
      associate: {
        id: newAssociate._id,
        name: newAssociate.name,
        email: newAssociate.email,
        associateCode: newAssociate.agentCode,
      },
    });
  } catch (error: any) {
    console.error("Associate Signup Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process associate registration" }, { status: 500 });
  }
}
