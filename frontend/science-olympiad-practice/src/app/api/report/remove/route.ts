import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import api from '@/app/api'

const arr = api.arr

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(arr[Math.floor(Math.random() * arr.length)]);

export async function POST(request: NextRequest) {
  try {
    const { question, originalQuestion, event, reason } = await request.json();
    
    if (!question || !event) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check with Gemini if the report is valid
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingBlacklist = await kv.get<any[]>(blacklistKey) || [];
      
      // Use the full question object if available, otherwise just use the question text
      const questionToStore = originalQuestion || question;
      
      // Check if question is already in blacklist
      const questionExists = existingBlacklist.some(item => {
        if (typeof item === 'string' && typeof questionToStore === 'string') {
          return item === questionToStore;
        } else if (typeof item === 'object' && typeof questionToStore === 'object') {
          return item.question === questionToStore.question;
        }
        return false;
      });
      
      // Add question to blacklist if not already present
      if (!questionExists) {
        await kv.set(blacklistKey, [...existingBlacklist, questionToStore]);
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