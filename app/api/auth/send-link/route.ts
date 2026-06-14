import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

const LINK_SECRET = process.env.NEXTAUTH_SECRET || "fallback_secret";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // 1. Strict pattern check to make sure it's an IIT Patna account
    if (!email || !email.endsWith("@iitp.ac.in")) {
      return NextResponse.json(
        { error: "Access restricted to valid @iitp.ac.in emails." },
        { status: 400 }
      );
    }

    // 2. Generate a secure crypto token that expires in 15 minutes
    const token = jwt.sign({ email }, LINK_SECRET, { expiresIn: "15m" });
    
    // Fallback to localhost if production URL isn't set yet
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const activationUrl = `${baseUrl}/verify-link?token=${token}`;

    // 3. Configure Nodemailer to log into your personal Gmail account
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Your 16-character Google App Password
      },
    });

    // 4. Construct a formal text block layout to glide past the Outlook firewall
    const emailBody = `
Dear Student,

You requested an access validation link to configure your student profile with the Campus Utility portal for IIT Patna.

Please click the secure activation link below to verify your campus email ownership and log into the application:

${activationUrl}

This secure activation token is temporary and will automatically expire in 15 minutes for safety. If you did not initiate this request, you can safely disregard this message.

Warm regards,
Campus Utility Core Team
IIT Patna
    `;

    // 5. Fire it straight to their official Outlook inbox
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