import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dns from "dns";

// 🌐 Bypass Campus/ISP SRV block issues on local devices (only run in dev, not on cloud serverless like Vercel)
if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
  } catch {
    // Fallback gracefully if runtime doesn't allow custom DNS
  }
}

interface ScheduleRecord {
  day?: string;
  time?: string;
  year?: number | string;
  branch?: string;
  courseCode?: string;
  courseName?: string;
  group?: string[] | string;
  venue?: string;
  type?: string;
  isElective?: boolean;
}

declare global {
  var timetableMongoConn: mongoose.Connection | undefined;
}

// ⚡ Reuse connection across serverless invocations
let cachedConnection: mongoose.Connection | null = global.timetableMongoConn || null;

async function getScheduleCollection() {
  const uri = process.env.MONGO_URI2 || process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI2 is missing from environment variables.");
  }

  if (!cachedConnection || cachedConnection.readyState !== 1) {
    const conn = mongoose.createConnection(uri, {
      dbName: "oneiitp_db",
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await conn.asPromise();
    cachedConnection = conn;
    global.timetableMongoConn = conn;
  }

  return cachedConnection.collection<ScheduleRecord>("schedules");
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collection = await getScheduleCollection();
    const rawRecords = await collection.find({}, { projection: { _id: 0 } }).toArray();

    // Map records to the format expected by the schedule page
    const timetableData = rawRecords.map((item: ScheduleRecord) => ({
      day: item.day || "",
      time: item.time || "",
      year: item.year,
      branch: item.branch || "",
      courseCode:
        item.courseName && item.courseCode && !item.courseCode.includes("~")
          ? `${item.courseCode} ~ ${item.courseName}`
          : item.courseCode || "",
      courseName: item.courseName || "",
      group: item.group || [],
      venue: item.venue || "",
      type: item.type || "Lecture",
      isElective: Boolean(item.isElective),
    }));

    return NextResponse.json(timetableData);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Timetable MongoDB fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable records from MongoDB.", details: errorMessage },
      { status: 500 }
    );
  }
}