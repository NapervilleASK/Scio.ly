// This endpoint retrieves share code data from MongoDB based on the provided code in the URL search parameters

import { NextResponse } from 'next/server';
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    const client = await getClient();
    const db = client.db('shareDB');
    const collection = db.collection('shareCodes');

    // Retrieve the document with the matching code
    const data = await collection.findOne({ code });
    if (!data) {
      return NextResponse.json({ error: 'Invalid or expired share code?' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error retrieving share code data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 