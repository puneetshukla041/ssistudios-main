// app/api/storage/route.ts
import { MongoClient, Db } from 'mongodb';
import { NextResponse } from 'next/server';

// This is the total storage you've allocated for your application.
const TOTAL_STORAGE_MB = 500;

let client: MongoClient | null = null;
let db: Db | null = null;

async function connectToDatabase() {
    if (client && db) {
        return { client, db };
    }

    if (!process.env.MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    }

    client = await MongoClient.connect(process.env.MONGODB_URI);
    db = client.db('employeeaccess'); // Replace with your actual database name
    return { client, db };
}

export async function GET() {
    try {
        const { db } = await connectToDatabase();

        // Use the new db.command() method to get the database statistics
        const dbStats = await db.command({ dbStats: 1 });

        // The 'dataSize' field in the stats object represents the storage size in bytes across all collections.
        // It is a more general metric than `collection.stats()`.
        const usedStorageBytes = dbStats.dataSize || 0;
        
        // Calculate storage in MB and KB
        const usedStorageKB = usedStorageBytes / 1024;
        const usedStorageMB = usedStorageBytes / (1024 * 1024);

        const data = {
            usedStorageKB: parseFloat(usedStorageKB.toFixed(2)),
            usedStorageMB: parseFloat(usedStorageMB.toFixed(2)),
            totalStorageMB: TOTAL_STORAGE_MB,
        };

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}