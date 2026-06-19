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
          subject: `${otpCode} is your Support Mission India Verification Code`,
          text: `Your OTP code is ${otpCode}. It is valid for 5 minutes.`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div style="background-color: #0c3e8a; padding: 25px 20px; text-align: center; border-bottom: 3px solid #b89047;">
                <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">Support Mission India</h1>
                <span style="color: #b89047; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 5px;">A National Development Initiative</span>
              </div>
              
              <div style="padding: 30px 25px; color: #334155; line-height: 1.6;">
                <h2 style="color: #0c3e8a; margin-top: 0; font-size: 18px; font-weight: 700; text-align: center;">OTP Verification Code</h2>
                <p style="font-size: 14px; color: #475569;">Dear Candidate,</p>
                <p style="font-size: 14px; color: #475569;">You are receiving this email to verify your registration on the <strong>Support Mission India Assessment Portal</strong>. Please use the following One-Time Password (OTP) to complete your verification process:</p>
                
                <div style="font-size: 34px; font-weight: 900; font-family: 'Courier New', Courier, monospace; text-align: center; letter-spacing: 6px; padding: 18px; margin: 25px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; color: #0c3e8a;">
                  ${otpCode}
                </div>
                
                <p style="color: #ef4444; font-size: 12px; font-weight: 600; text-align: center; margin-top: 10px;">• This verification code is valid for exactly 5 minutes.</p>
                <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 5px;">For security reasons, please do not share this OTP with anyone.</p>
              </div>
              
              <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">Support Mission India Program Team</p>
                <p style="color: #94a3b8; font-size: 10px; margin: 5px 0 0 0;">This is an automated system email. Please do not reply to this message.</p>
              </div>
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
