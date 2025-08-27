// app/api/user/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import { Member } from "@/models/Employee";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "User not authenticated." }, { status: 401 });
    }

    const userProfile = await Member.findById(userId).select("-__v");
    if (!userProfile) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        data: {
          _id: userProfile._id.toString(),
          username: userProfile.username,
          password: "••••••••", // never real password
          createdAt: userProfile.createdAt,
          updatedAt: userProfile.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ message: "Internal Server Error." }, { status: 500 });
  }
}
