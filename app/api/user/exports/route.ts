import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import { Export } from "@/models/Export";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId query parameter" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await dbConnect();

    // Count exports for this user
    const count = await Export.countDocuments({ userId });

    return NextResponse.json({ success: true, count });
  } catch (err) {
    console.error("GET /api/user/exports error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
