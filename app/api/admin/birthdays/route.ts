import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import fs from "fs";
import path from "path";

const ALLOWED_DEVELOPERS = ["navin_2503ai02@iitp.ac.in"];

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Firewall Security Gate
    if (!session?.user?.email || !ALLOWED_DEVELOPERS.includes(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    // 2. Extract the search term from the URL query parameters
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("query")?.trim().toLowerCase() || "";

    // 3. Identify and read the secure offline dataset
    const filePath = path.join(process.cwd(), "secret-data", "birthdays.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Database file missing." }, { status: 404 });
    }

    const rawData = fs.readFileSync(filePath, "utf-8").trim();
    if (!rawData) return NextResponse.json({ success: true, filteredResults: [] });

    const students = JSON.parse(rawData);

    // 4. If search bar is completely empty, don't waste power sending 3,000 rows
    if (!searchTerm) {
      return NextResponse.json({ success: true, filteredResults: [] });
    }

    // 5. Universal Deep Search Filtering
    const filteredResults = students.filter((student: any) => {
      const nameMatch = student.name?.toLowerCase().includes(searchTerm);
      const rollMatch = student.roll?.toLowerCase().includes(searchTerm);
      const dateMatch = student.birthday?.toLowerCase().includes(searchTerm);
      
      return nameMatch || rollMatch || dateMatch;
    });

    // Take a maximum safe window of the top 50 matches to keep the network response lightweight
    return NextResponse.json({ success: true, filteredResults: filteredResults.slice(0, 50) });

  } catch (error) {
    console.error("Universal Search Database failure:", error);
    return NextResponse.json({ error: "Internal System Error." }, { status: 500 });
  }
}