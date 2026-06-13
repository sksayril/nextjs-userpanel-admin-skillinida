import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Otp } from "@/models/Otp";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save or update OTP in the database (valid for 5 minutes)
    await Otp.findOneAndUpdate(
      { email },
      { code: otpCode, createdAt: new Date() },
      { upsert: true, new: true }
    );

    let emailSent = false;
    let smtpStatus = "SMTP credentials not provided";

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (user && pass) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });

        await transporter.sendMail({
          from: `"Support Mission India" <${user}>`,
          to: email,
          subject: "Your OTP Verification Code",
          text: `Your OTP code is ${otpCode}. It is valid for 5 minutes.`,
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
              <h2 style="color: #6366f1; text-align: center;">Support Mission India</h2>
              <p>Hello,</p>
              <p>Your verification OTP code is:</p>
              <div style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 4px; padding: 15px; margin: 20px 0; background-color: #f4f4f5; border-radius: 8px; color: #18181b;">
                ${otpCode}
              </div>
              <p style="color: #71717a; font-size: 14px;">This code is valid for 5 minutes. Please do not share it with anyone.</p>
            </div>
          `,
        });
        emailSent = true;
        smtpStatus = "Sent successfully";
      } catch (err: any) {
        console.error("Nodemailer SMTP Error:", err);
        smtpStatus = `Failed to send email: ${err.message}`;
      }
    }

    // Print OTP directly to terminal console for easy developer validation/testing
    console.log(`\n--- [OTP DISPATCH] ---`);
    console.log(`Email: ${email}`);
    console.log(`Code:  ${otpCode}`);
    console.log(`SMTP:  ${smtpStatus}`);
    console.log(`----------------------\n`);

    return NextResponse.json({
      success: true,
      message: emailSent
        ? "OTP sent to your email successfully"
        : `OTP generated. (Fallback: Code is ${otpCode} - check terminal logs. SMTP status: ${smtpStatus})`,
      // For immediate convenience during user testing, return the OTP in the JSON response payload
      otp: otpCode,
    });
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: error.message || "Failed to send OTP" }, { status: 500 });
  }
}
