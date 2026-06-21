import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { PassThrough } from "stream";

// 🟢 NEW OAUTH CONFIGURATION: Replaces the old Service Account logic completely
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || "",
  process.env.GOOGLE_CLIENT_SECRET || "",
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN || "",
});

const drive = google.drive({ version: "v3", auth: oauth2Client });

export async function POST(req: Request) {
  try {
    // 1. Verify user session authentication status
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse file payload from incoming form data
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. Convert blob buffer payload into a stream pipeline
    const buffer = Buffer.from(await file.arrayBuffer());
    const bufferStream = new PassThrough();
    bufferStream.end(buffer);

    // 4. Stream and upload the file data using your Personal OAuth credentials proxy
    const response = await drive.files.create({
      requestBody: {
        name: `profile_${session.user.email.split("@")[0]}`,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      },
      media: {
        mimeType: file.type,
        body: bufferStream,
      },
      fields: "id",
    });

    const fileId = response.data.id;
    if (!fileId) throw new Error("Drive upload failed to return a file ID reference.");

    // 5. Instantly change file permissions so anyone with the link can view it
    await drive.permissions.create({
      fileId: fileId,
      requestBody: { role: "reader", type: "anyone" },
    });
 
    const permanentImageUrl = `/api/user/get-avatar?email=${encodeURIComponent(session.user.email)}`;
    return NextResponse.json({ success: true, imageUrl: permanentImageUrl });



  } catch (error: any) {
    console.error("❌ BACKEND UPLOAD ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}