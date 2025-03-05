import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event = searchParams.get('event');
    
    if (event) {
      // Get edits for specific event
      const editsKey = `edits:${event}`;
      const edits = await kv.get<Array<{original: string, edited: string, timestamp: string}>>(editsKey) || [];
      
      return NextResponse.json({ edits });
    } else {
      // Get all edits
      const keys = await kv.keys('edits:*');
      const result: Record<string, Array<{original: string, edited: string, timestamp: string}>> = {};
      
      for (const key of keys) {
        const eventName = key.replace('edits:', '');
        const edits = await kv.get<Array<{original: string, edited: string, timestamp: string}>>(key) || [];
        result[eventName] = edits;
      }
      
      return NextResponse.json({ edits: result });
    }
  } catch (error) {
    console.error('Error retrieving edited questions:', error);
    return NextResponse.json({ error: 'Failed to retrieve edited questions' }, { status: 500 });
  }
} 