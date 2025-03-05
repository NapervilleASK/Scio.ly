import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { question, event, reason } = await request.json();
    
    if (!question || !event) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check with Gemini if the report is valid
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
    You are evaluating a report for a Science Olympiad question. 
    The user wants to remove this question from the question bank.
    
    Question: ${question}
    Event: ${event}
    Reason for removal: ${reason}
    
    Should this question be removed from the question bank? 
    Answer with only "YES" or "NO" based on whether the reason is valid and the question appears problematic.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    
    if (response.includes("YES")) {
      // Add to blacklist in Vercel KV
      const blacklistKey = `blacklist:${event}`;
      
      // Get existing blacklist or create new one
      const existingBlacklist = await kv.get<string[]>(blacklistKey) || [];
      
      // Add question to blacklist if not already present
      if (!existingBlacklist.includes(question)) {
        await kv.set(blacklistKey, [...existingBlacklist, question]);
      }
      
      return NextResponse.json({ success: true, message: 'Question added to blacklist' });
    } else {
      return NextResponse.json({ success: false, message: 'AI determined this question should not be removed' });
    }
  } catch (error) {
    console.error('Error processing question removal:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 