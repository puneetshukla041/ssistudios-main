import { NextResponse, type NextRequest } from 'next/server';
import dbConnect from '@/lib/dbconnect';
import Template from '@/models/Template';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;

  if (!templateId) {
    return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
  }

  try {
    await dbConnect();

    const deletedTemplate = await Template.findByIdAndDelete(templateId);
    if (!deletedTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: `Template ${templateId} deleted successfully.` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Deletion failed:', error);
    return NextResponse.json({ error: "Server error during template deletion" }, { status: 500 });
  }
}