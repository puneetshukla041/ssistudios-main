import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Template from "@/models/Template";

export async function GET() {
  try {
    await dbConnect();
    const templates = await Template.find().sort({ createdAt: -1 }); // newest first

    // Convert binary image data to a Base64 string for each template
    const templatesWithBase64 = templates.map((template) => {
      let imageUrl = '';
      if (template.image && template.contentType) {
        // Create a data URL: `data:<contentType>;base64,<base64_string>`
        imageUrl = `data:${template.contentType};base64,${template.image.toString('base64')}`;
      }
      
      // Return a new object that includes the _id, templateName, and the new imageUrl
      return {
        _id: template._id,
        templateName: template.templateName,
        imageUrl: imageUrl, // Will be an empty string if image data is missing
      };
    });

    return NextResponse.json({ success: true, data: templatesWithBase64 }, { status: 200 });
  } catch (error: any) {
    console.error("API GET Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}