import { NextResponse } from 'next/server';
// Ensure you have installed the 'mongodb' package and its types (npm install mongodb @types/mongodb) if needed
import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://sampleuser:EDFf7krY2VDN2C4y@cluster0.mnsra.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

let cachedClient: MongoClient | null = null;

async function getClient() {
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  return cachedClient;
}
export async function GET() {
  return NextResponse.json({"hi": "stupid"})
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { indices, testParamsRaw } = body;
    let { code } = body;
    if (!indices || !Array.isArray(indices)) {
      return NextResponse.json({ error: 'Invalid indices' }, { status: 400 });
    }
    if (!code) {
      // Generate a 6-character random alphanumeric code
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    const client = await getClient();
    const db = client.db('shareDB');
    const collection = db.collection('shareCodes');
    // Insert document with testParamsRaw and a createdAt field for TTL index if needed
    await collection.insertOne({ code, indices, testParamsRaw, createdAt: new Date() });
    return NextResponse.json({ code });
  } catch (error) {
    console.error('Error in share generate API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 