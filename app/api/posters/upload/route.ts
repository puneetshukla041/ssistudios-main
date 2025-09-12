import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Template from "@/models/Template";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const formData = await req.formData();

    const file: File | null = formData.get("templateFile") as unknown as File;
    const templateName = formData.get("templateName") as string;
    const userId = formData.get("userId") as string;

    if (!file || !templateName || !userId) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use sharp to get image dimensions without altering quality
    const imageMetadata = await sharp(buffer).metadata();

    const width = imageMetadata.width || 0;
    const height = imageMetadata.height || 0;
    const dpi = imageMetadata.density || undefined; // optional

    // Save in MongoDB
const newTemplate = await Template.create({
  templateName,
  image: buffer,       // full image
  contentType: file.type,
  ownerId: userId,
  width,
  height,
  dpi,
  fileSize: file.size
});

// when querying in Atlas, exclude image
const templates = await Template.find({}, { image: 0 });


    return NextResponse.json({ success: true, data: newTemplate }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
