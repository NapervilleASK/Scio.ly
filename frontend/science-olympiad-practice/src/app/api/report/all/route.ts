import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get all blacklists
    const blacklistKeys = await kv.keys('blacklist:*');
    const blacklists: Record<string, string[]> = {};
    
    for (const key of blacklistKeys) {
      const eventName = key.replace('blacklist:', '');
      const blacklist = await kv.get<string[]>(key) || [];
      blacklists[eventName] = blacklist;
    }
    
    // Get all edits
    const editKeys = await kv.keys('edits:*');
    const edits: Record<string, Array<{original: string, edited: string, timestamp: string}>> = {};
    
    for (const key of editKeys) {
      const eventName = key.replace('edits:', '');
      const editList = await kv.get<Array<{original: string, edited: string, timestamp: string}>>(key) || [];
      edits[eventName] = editList;
    }
    
    // Combine all data
    const allData = {
      blacklists,
      edits
    };
    
    return NextResponse.json(allData);
  } catch (error) {
    console.error('Error retrieving report data:', error);
    return NextResponse.json({ error: 'Failed to retrieve report data' }, { status: 500 });
  }
} 