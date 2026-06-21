import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || "",
  process.env.GOOGLE_CLIENT_SECRET || "",
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN || "",
});

const drive = google.drive({ version: "v3", auth: oauth2Client });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return new Response("Email parameter is required", { status: 400 });
    }

    const emailPrefix = email.split("@")[0];
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // 1. Search for the absolute most recent avatar image file matching the student
    const searchResponse = await drive.files.list({
      q: `'${folderId}' in parents and name contains 'profile_${emailPrefix}' and trashed = false`,
      fields: "files(id, mimeType, createdTime)",
      orderBy: "createdTime desc",
      pageSize: 1,
    });

    const files = searchResponse.data.files || [];

    // If no custom picture is found, return a clean 404
    if (files.length === 0) {
      return new Response("Avatar not found", { status: 404 });
    }

    const targetFile = files[0];
    const fileId = targetFile.id;
    const mimeType = targetFile.mimeType || "image/jpeg";

    // 2. Stream the binary image chunks safely
    // Wrapped in a nested try-catch in case the file metadata exists but the actual object was deleted from Drive
    try {
      const driveFileResponse = await drive.files.get(
        { 
          fileId: fileId || undefined, 
          alt: "media" 
        },
        { responseType: "stream" }
      );

      const driveStream = driveFileResponse.data as Readable;

      // 3. Convert Node.js stream to Web API ReadableStream
      const webStream = new ReadableStream({
        start(controller) {
          driveStream.on("data", (chunk) => controller.enqueue(chunk));
          driveStream.on("end", () => controller.close());
          driveStream.on("error", (err) => controller.error(err));
        },
      });

      // 4. Return the raw binary stream directly to the browser
      return new Response(webStream, {
        headers: {
          "Content-Type": mimeType,
          // Lowering max-age to 60 seconds so changes propagate faster during testing/deletion
          "Cache-Control": "public, max-age=60, stale-while-revalidate=30",
        },
      });

    } catch (driveErr) {
      console.warn("⚠️ File metadata existed, but fetching binary media failed (likely deleted):", driveErr);
      return new Response("Avatar media missing", { status: 404 });
    }

  } catch (error: any) {
    console.error("❌ IMAGE STREAMING ERROR:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}