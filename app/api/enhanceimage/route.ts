// src/app/api/enhance-image/route.ts
import { NextResponse } from "next/server";
import FormData from "form-data";

export const POST = async (req: Request) => {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Prepare Upsampler request
    const fd = new FormData();
    fd.append("image", buffer, { filename: file.name || "image.png", contentType: file.type });

    // Optional: you can add more options if Upsampler supports them
    // fd.append("scale", "2"); // example: 2x upscaling

const res = await fetch("https://upsampler.com/api/v1/smart-upscale", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.UPSAMPLER_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    input: { image_url: "<YOUR_IMAGE_URL>", scale: 2 },
    webhook: "<OPTIONAL_WEBHOOK_URL>"
  }),
});

    const data = await res.json();
    console.log("Upsampler response:", data);

    if (data.output_url) {
      return NextResponse.json({ output: data.output_url });
    } else {
      return NextResponse.json({ error: "Enhancement failed" }, { status: 500 });
    }
  } catch (err) {
    console.error("Enhance-image error:", err);
    return NextResponse.json({ error: "Enhancement failed" }, { status: 500 });
  }
};
