import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
// 1. Import your custom stateful utils
import { validateIitpEmail, generateActivationToken } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // 2. Run strict RegEx pattern check via your auth-utils
    if (!email || !validateIitpEmail(email)) {
      return NextResponse.json(
        { error: "Access restricted to valid @iitp.ac.in emails." },
        { status: 400 }
      );
    }

    // 3. Generate a secure token that stores state in DB and expires in 10 minutes
    const token = await generateActivationToken(email);
    
    // Fallback to localhost if production URL isn't set yet
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    // Pointing to your client component route path /verify
    const activationUrl = `${baseUrl}/verify-link?token=${token}`;

    // 4. Configure Nodemailer using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Your 16-character Google App Password
      },
    });

    // 5. Construct email layout (Updated to reflect the strict 10-minute constraint)
    const emailBody = `
Dear Student,

You requested an access validation link to configure your student profile with the Campus Utility portal.

Please click the secure activation link below to verify your email ownership and log into the application:

${activationUrl}

This secure activation token is temporary. It will automatically expire in 10 minutes. If you did not initiate this request, you can safely disregard this message.

Warm regards,
Campus Utility

    `;

    // 6. Fire it straight to their official Outlook inbox
    await transporter.sendMail({
      from: `"Campus Utility" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Action Required: Verify your Campus Utility Profile Link",
      text: emailBody,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ Mail dispatch error detailed log:", error);
    return NextResponse.json(
      { error: "Failed to dispatch system email configuration. Check server logs." },
      { status: 500 }
    );
  }
}