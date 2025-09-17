import dbConnect from "@/lib/dbconnect";
import { Member } from "@/models/Employee";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    // Fetch all members, and explicitly select the username and createdAt fields
    const members = await Member.find({}, 'username createdAt').sort({ createdAt: -1 });

    return NextResponse.json({ success: true, members: members });
  } catch (error: any) {
    console.error("Error fetching members data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch members data" },
      { status: 500 }
    );
  }
}