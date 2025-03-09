import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { originalQuestion, originalQuestion: originalQuestionText, editedQuestion, event, reason } = await request.json();
    
    if (!originalQuestionText || !editedQuestion || !event) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check with Gemini if the edit is valid
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
    You are evaluating an edit for a Science Olympiad question. 
    The user wants to edit this question in the question bank.
    
    Original Question: ${typeof originalQuestionText === 'string' ? originalQuestionText : JSON.stringify(originalQuestionText)}
    Edited Question: ${typeof editedQuestion === 'string' ? editedQuestion : JSON.stringify(editedQuestion)}
    Event: ${event}
    Reason for edit: ${reason}
    
    Should this question edit be accepted? 
    Answer with only "YES" or "NO" based on whether the edit improves the question and the reason is valid.
    `;

    // Log the edited question to verify it contains the difficulty value
    console.log('Edited question data:', editedQuestion);

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    
    if (response.includes("YES")) {
      // Add to edits in Vercel KV
      const editsKey = `edits:${event}`;
      
      // Get existing edits or create new one
      const existingEdits = await kv.get<Array<{original: string, edited: string, timestamp: string}>>(editsKey) || [];
      
      // Add edit to the list
      await kv.set(editsKey, [...existingEdits, {
        original: originalQuestion,
        edited: editedQuestion,
        timestamp: new Date().toISOString()
      }]);
      
      return NextResponse.json({ success: true, message: 'Question edit saved' });
    } else {
      return NextResponse.json({ success: false, message: 'AI determined this edit should not be accepted' });
    }
  } catch (error) {
    console.error('Error processing question edit:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 