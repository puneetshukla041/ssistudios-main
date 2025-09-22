// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import mongoose from "mongoose";
import { Export } from "@/models/Export";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Connect to MongoDB
async function connectMongo() {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGO_URI!);
}

export async function POST(req: NextRequest) {
  try {
    await connectMongo();

    const { fileBase64, fileName, folder, mimeType, userId, username } = await req.json();

    if (!fileBase64 || !fileName || !mimeType || !userId || !username) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(fileBase64, "base64");
    const key = folder ? `${folder}/${fileName}` : fileName;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3.send(command);

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Log export in MongoDB
    await Export.create({
      userId,
      username,
      fileName,
      folder,
      mimeType,
      fileUrl,
    });

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("S3 Upload Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
