import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event = searchParams.get('event');
    
    if (event) {
      // Get blacklist for specific event
      const blacklistKey = `blacklist:${event}`;
      const blacklist = await kv.get<string[]>(blacklistKey) || [];
      
      return NextResponse.json({ blacklist });
    } else {
      // Get all blacklists
      const keys = await kv.keys('blacklist:*');
      const result: Record<string, string[]> = {};
      
      for (const key of keys) {
        const eventName = key.replace('blacklist:', '');
        const blacklist = await kv.get<string[]>(key) || [];
        result[eventName] = blacklist;
      }
      
      return NextResponse.json({ blacklists: result });
    }
  } catch (error) {
    console.error('Error retrieving blacklist:', error);
    return NextResponse.json({ error: 'Failed to retrieve blacklist' }, { status: 500 });
  }
} 