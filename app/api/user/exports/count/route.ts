// app/api/exports/count/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import { Export } from "@/models/Export";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Connect to MongoDB using Mongoose
    await dbConnect();

    // Count exports for this user
    const exportCount = await Export.countDocuments({ userId });

    return NextResponse.json({ exportCount });
  } catch (err) {
    console.error("Failed to fetch export count:", err);
    return NextResponse.json(
      { error: "Failed to fetch export count" },
      { status: 500 }
    );
  }
}
