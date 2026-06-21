// app/api/user/profile-picture/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path to match your auth setup
// Import your database instance wrapper (Prisma, Mongoose, etc.)

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { imageUrl } = await req.json();
    
    // 💾 DB UPDATE EXAMPLES:
    // Mongoose: await User.updateOne({ email: session.user.email }, { image: imageUrl });
    // Prisma: await prisma.user.update({ where: { email: session.user.email }, data: { image: imageUrl } });

    return NextResponse.json({ success: true, imageUrl });
  } catch (err) {
    return NextResponse.json({ error: "Database transaction failure" }, { status: 500 });
  }
}