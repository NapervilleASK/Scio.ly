import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import api from '@/app/api';

const arr = api.arr
// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(arr[Math.floor(Math.random() * arr.length)]);

export async function POST(request: NextRequest) {
  try {
    const { originalQuestion, originalQuestion: originalQuestionText, editedQuestion, event, reason } = await request.json();
    
    if (!originalQuestionText || !editedQuestion || !event) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check with Gemini if the edit is valid
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    
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
      
      // Check if this question has already been edited
      const originalQuestionStr = typeof originalQuestion === 'string' ? originalQuestion : JSON.stringify(originalQuestion);
      
      // Look for existing edits with the same original question
      const existingEditIndex = existingEdits.findIndex(edit => {
        const editOriginal = typeof edit.original === 'string' ? edit.original : JSON.stringify(edit.original);
        return editOriginal === originalQuestionStr;
      });
      
      if (existingEditIndex !== -1) {
        // Update the existing edit instead of adding a new one
        existingEdits[existingEditIndex] = {
          original: originalQuestion,
          edited: editedQuestion,
          timestamp: new Date().toISOString()
        };
        await kv.set(editsKey, existingEdits);
      } else {
        // Add a new edit to the list
        await kv.set(editsKey, [...existingEdits, {
          original: originalQuestion,
          edited: editedQuestion,
          timestamp: new Date().toISOString()
        }]);
      }
      
      return NextResponse.json({ success: true, message: 'Question edit saved' });
    } else {
      return NextResponse.json({ success: false, message: 'AI determined this edit should not be accepted' });
    }
  } catch (error) {
    console.error('Error processing question edit:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 