// app/api/bugs/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbconnect';
import BugReport from '@/models/BugReport';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, username, bugType, severity, description, rating, screenshot } = body;

    if (!userId || !description) {
      return NextResponse.json(
        { success: false, message: 'User ID and description are required.' },
        { status: 400 }
      );
    }

    await dbConnect();

    const newBugReport = await BugReport.create({
      userId,
      username,
      bugType,
      severity,
      description,
      rating,
      screenshot,
    });

    return NextResponse.json(
      { success: true, message: 'Bug report submitted successfully.', data: newBugReport },
      { status: 201 }
    );
  } catch (error) {
    console.error('Bug submission failed:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
