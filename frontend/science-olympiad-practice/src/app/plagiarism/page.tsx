'use client';

import { useState, useRef } from 'react';
import api from '../api';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { stringSimilarity } from 'string-similarity-js';
import * as pdfjsLib from 'pdfjs-dist/webpack';


// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Initialize Gemini

const arr = api.arr
const genAI = new GoogleGenerativeAI(arr[Math.floor(Math.random() * arr.length)]);

interface ProcessedQuestions {
  questions: string[];  // Questions extracted from user input
}

interface PlagiarismMatch {
  inputQuestion: string;
  matchedQuestion: string;
  similarity: number;
}

interface EventData {
  [key: string]: {
    question: string;
    // other properties may exist
  };
}

const SCIENCE_OLYMPIAD_EVENTS = [
  "Anatomy - Skeletal",
  "Anatomy - Muscular",
  "Anatomy - Integumentary",
  "Anatomy - Nervous",
  "Anatomy - Sense Organs",
  "Anatomy - Endocrine",
  "Astronomy",
  "Chemistry Lab",
  "Circuit Lab",
  "Codebusters",
  "Crime Busters",
  "Disease Detectives",
  "Designer Genes",
  "Dynamic Planet - Glaciers",
  "Dynamic Planet - Oceanography",
  "Ecology",
  "Entomology",
  "Environmental Chemistry",
  "Forensics",
  "Fossils",
  "Geologic Mapping",
  "Green Generation",
  "Materials Science",
  "Meteorology",
  "Metric Mastery",
  "Microbe Mission",
  "Optics",
  "Potions and Poisons",
  "Reach for the Stars",
  "Remote Sensing",
  "Rocks and Minerals",
  "Water Quality",
  "Wind Power"
];


export default function PlagiarismPage() {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [status, setStatus] = useState<string>('Select an event and click display');
  const [inputText, setInputText] = useState<string>('');
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'error' | 'loaded'>('idle');
  const [inputtedQuestions, setInputtedQuestions] = useState<ProcessedQuestions | null>(null);
  const [officialQuestions, setOfficialQuestions] = useState<string[]>([]);  // Questions from official Science Olympiad event data
  const [plagiarismMatches, setPlagiarismMatches] = useState<PlagiarismMatch[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDisplay = () => {
    if (!selectedEvent) {
      setStatus('Please select an event first');
      setLoadingState('idle');
      return;
    }

    setStatus('Fetching data...');
    setLoadingState('loading');
    setIsDataLoaded(false);
    fetch(api.api)
      .then(res => res.json())
      .then(data => {
        const eventData = data[selectedEvent] as EventData;
        if (eventData) {
          // Extract all official questions from the event data
          const questions = Object.values(eventData)
            .map(item => item.question)
            .filter(question => question); // Filter out any undefined/null questions
          
          setOfficialQuestions(questions);
          setStatus(`Data loaded successfully! Found ${questions.length} official questions.`);
          setLoadingState('loaded');
          setIsDataLoaded(true);
        } else {
          setStatus('No data found');
          setLoadingState('error');
          setIsDataLoaded(false);
        }
      })
      .catch(error => {
        setStatus('Error: ' + error.message);
        setLoadingState('error');
        setIsDataLoaded(false);
      });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setStatus('Processing PDF...');
    setLoadingState('loading');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => 'str' in item ? item.str : '').join(' ');
        fullText += pageText + '\n';
      }
      
      setInputText(fullText);
      setStatus('PDF processed successfully');
      setLoadingState('loaded');
    } catch (error) {
      setStatus('Error processing PDF: ' + (error as Error).message);
      setLoadingState('error');
    }
  };

  const handlePlagiarismCheck = async () => {
    if (!inputText) return;

    setStatus('Processing questions...');
    setLoadingState('loading');

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `Extract all questions from this Science Olympiad test content. It is the raw text from a PDF. Include:
- Numbered questions
- Short prompts (like "Name the element")
- Fill-in-the-blank questions

Return ONLY valid JSON in this exact format:
{
  "questions": ["question1", "question2", ...]
}

IMPORTANT: Make sure to escape all quotes and special characters in the JSON. Keep it simple and error-free. Don't include the point values or the question number.

Text to analyze:
${inputText}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean up the response text
      text = text.trim();
      text = text.replace(/```json\s*|\s*```/g, '');
      
      // Additional cleaning to handle potential JSON formatting issues
      try {
        // Try to extract JSON if it's wrapped in other text
        const jsonMatch = text.match(/({[\s\S]*})/);
        const jsonText = jsonMatch ? jsonMatch[0] : text;
        
        // Sometimes AI adds extra explanation text before or after the JSON
        const cleanedText = jsonText.trim();
        
        console.log("Attempting to parse JSON:", cleanedText);
        
        const parsedResult = JSON.parse(cleanedText);
        
        // Ensure we have a questions array even if structure is different
        let questions: string[] = [];
        if (parsedResult.questions && Array.isArray(parsedResult.questions)) {
          questions = parsedResult.questions as string[];
        } else if (Array.isArray(parsedResult)) {
          questions = parsedResult as string[];
        } else {
          // If neither format works, try to extract any array
          const firstArrayKey = Object.keys(parsedResult).find(key => 
            Array.isArray(parsedResult[key])
          );
          
          if (firstArrayKey) {
            questions = parsedResult[firstArrayKey] as string[];
          } else {
            throw new Error("Could not find questions array in the response");
          }
        }
        
        setInputtedQuestions({ questions });

        // Use string-similarity-js to find matches
        const matches: PlagiarismMatch[] = [];
        
        for (const inputQuestion of questions) {
          let bestMatchQuestion = '';
          let bestMatchScore = 0;
          
          // Find the best match among official questions
          for (const officialQuestion of officialQuestions) {
            const similarityScore = stringSimilarity(inputQuestion, officialQuestion);
            
            if (similarityScore > bestMatchScore) {
              bestMatchScore = similarityScore;
              bestMatchQuestion = officialQuestion;
            }
          }
          
          // Only add matches that meet a minimum threshold (e.g., 0.3)
          if (bestMatchScore > 0.3) {
            matches.push({
              inputQuestion: inputQuestion,
              matchedQuestion: bestMatchQuestion,
              similarity: bestMatchScore,
            });
          }
        }

        setPlagiarismMatches(matches);
        setStatus('Plagiarism check completed');
        setLoadingState('loaded');
      } catch (error) {
        console.error('Failed to parse:', text);
        setStatus('Error processing questions: ' + (error as Error).message);
        setLoadingState('error');
      }
    } catch (error) {
      setStatus('Error: ' + (error as Error).message);
      setLoadingState('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Science Olympiad Plagiarism Checker</h1>
          <p className="text-slate-600 text-sm">Check your work against official Science Olympiad questions</p>
          <p className="text-amber-600 text-xs mt-1">Disclaimer: This tool may not work effectively with very long tests due to processing limitations.</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-4 space-y-4 relative">
          <div className="absolute top-3 right-3 group">
            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center cursor-help">
              <span className="text-slate-500 text-sm">?</span>
            </div>
            <div className="absolute right-0 top-8 w-64 p-3 bg-white rounded-lg shadow-lg border border-slate-200 text-xs text-slate-600 hidden group-hover:block z-10">
              <h4 className="font-medium text-slate-800 mb-2">How to Use</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Select a Science Olympiad event from the dropdown</li>
                <li>Click &quot;Load Data&quot; to fetch the questions</li>
                <li>Paste your text into the input box or upload a PDF</li>
                <li>Click &quot;Check Plagiarism&quot; to analyze</li>
                <li>Review the results showing potential matches</li>
              </ol>
              <p className="mt-2 text-slate-500">Each match shows the suspected text, source, and confidence level.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="event-select" className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">
                Select an Event
              </label>
              <select
                id="event-select"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white/50 text-slate-700 text-sm transition-colors"
              >
                <option value="">Select an event...</option>
                {SCIENCE_OLYMPIAD_EVENTS.map((event) => (
                  <option key={event} value={event}>
                    {event}
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleDisplay}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium shadow-sm"
            >
              Load Data
            </button>

            <div className="mt-4">
              <label htmlFor="text-input" className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">
                Enter Text to Check
              </label>
              <div className="space-y-2">
                <textarea
                  id="text-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white/50 text-slate-700 text-sm transition-colors h-32"
                  placeholder="Paste the text you want to check for plagiarism here..."
                />
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">or</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Upload PDF
                  </button>
                  {selectedFile && (
                    <span className="text-xs text-slate-600">
                      {selectedFile.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={handlePlagiarismCheck}
              disabled={!isDataLoaded}
              className={`w-full px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm ${
                isDataLoaded 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Check Plagiarism
            </button>
          </div>

          {inputtedQuestions && (
            <div className="mt-4 p-4 bg-slate-50/50 rounded-lg border border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Inputted Questions</h3>
              <div className="text-xs text-slate-600">
                <p className="mb-2">Number of questions found: {inputtedQuestions.questions.length}</p>
                <div className="max-h-40 overflow-y-auto">
                  {inputtedQuestions.questions.map((question, index) => (
                    <div key={index} className="mb-2 p-2 bg-white rounded border border-slate-200">
                      <p className="text-slate-700">{question}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {plagiarismMatches.length > 0 && (
            <div className="mt-4 p-4 bg-slate-50/50 rounded-lg border border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Plagiarism Matches</h3>
              <div className="text-xs text-slate-600">
                <p className="mb-2">Found {plagiarismMatches.length} potential matches</p>
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {plagiarismMatches.map((match, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-slate-200">
                      <div className="mb-2">
                        <p className="font-medium text-slate-800">Input Question:</p>
                        <p className="text-slate-700">{match.inputQuestion}</p>
                      </div>
                      <div className="mb-2">
                        <p className="font-medium text-slate-800">Matched Question:</p>
                        <p className="text-slate-700">{match.matchedQuestion}</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Similarity Score:</p>
                        <p className={`text-sm font-medium ${
                          match.similarity < 0.3 ? 'text-green-600' :
                          match.similarity < 0.7 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {(match.similarity * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full transition-colors ${
              loadingState === 'idle' ? 'bg-slate-300' :
              loadingState === 'loading' ? 'bg-yellow-500 animate-pulse' :
              loadingState === 'error' ? 'bg-red-500' :
              'bg-green-500'
            }`} />
            <p className="text-xs text-slate-500">{status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
