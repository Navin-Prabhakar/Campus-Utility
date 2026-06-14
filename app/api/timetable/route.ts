import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // 🔒 Locates the file exactly where your custom Vercel command copies it
    const filePath = path.join(process.cwd(), "secret-data", "timetable.json");
    
    if (!fs.existsSync(filePath)) {
      console.error("Timetable database file missing in compilation workspace context.");
      return NextResponse.json({ error: "Database mapping file missing." }, { status: 404 });
    }

    const rawData = fs.readFileSync(filePath, "utf-8").trim();
    if (!rawData) {
      return NextResponse.json([]);
    }

    const timetableData = JSON.parse(rawData);
    return NextResponse.json(timetableData);

  } catch (error) {
    console.error("Secure Timetable Pipeline error hook:", error);
    return NextResponse.json({ error: "Internal Server Processing Error." }, { status: 500 });
  }
}