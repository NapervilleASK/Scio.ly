'use client';

import { useState } from 'react';
import api from '../api';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI('AIzaSyAwFolmYf8r4nis8yIla_78X1KxsVpcZ-Q');

interface EventData {
  questions: string[];
}

interface PlagiarismMatch {
  text: string;
  confidence: number;
  source: string;
  description: string;
}

interface PlagiarismResult {
  summary: string;
  overallAnalysis?: {
    verdict: string;
    explanation: string;
    riskLevel: 'high' | 'medium' | 'low';
  };
  matches: PlagiarismMatch[];
  overallConfidence: number;
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
  const [plagiarismResult, setPlagiarismResult] = useState<PlagiarismResult | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);

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
        const eventData = data[selectedEvent];
        if (eventData) {
          setStatus('Data loaded successfully!');
          setLoadingState('loaded');
          setIsDataLoaded(true);
          setEventData(eventData);
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

  const handlePlagiarismCheck = async () => {
    if (!inputText || !eventData) return;

    setStatus('Checking for plagiarism...');
    setLoadingState('loading');

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `Analyze the following text for plagiarism against these Science Olympiad questions. 
      Your response must be in valid JSON format with the following structure:
      {
        "summary": "Overall summary of findings",
        "overallAnalysis": {
          "verdict": "Brief 1-2 sentence verdict (e.g. 'High likelihood of plagiarism' or 'Mostly original work')",
          "explanation": "2-3 sentences explaining key findings",
          "riskLevel": "high|medium|low"
        },
        "matches": [
          {
            "text": "The portion of text that matches",
            "confidence": 0.95,
            "source": "The source question it matches with",
            "description": "Brief description of why this is considered plagiarism"
          }
        ],
        "overallConfidence": 0.85
      }
      
      Text to analyze:
      ${inputText}
      
      Questions to compare against:
      ${JSON.stringify(eventData, null, 2)}
      
      Guidelines:
      1. Include matches with confidence > 0.6
      2. A match must meet AT LEAST ONE of these criteria:
         - Direct word-for-word copying of 6 or more consecutive words
         - Exact same unique problem or scenario with multiple identical elements
         - Identical complex sequence of concepts with the same specific examples
         - Exact reproduction of unique or unusual question structure
         - Multiple identical specialized terms in the same context and order
         - Same numerical values or equations in the same context
      3. DO NOT flag matches for:
         - Common scientific terms or general knowledge
         - Basic questions that would be common in the field
         - Standard scientific terminology or methodology
         - Loosely similar approaches or questions
      4. For the overall analysis:
         - Evaluate the total proportion of text that appears to be copied
         - Consider the significance of the matches found
         - Be more likely to flag suspicious content than to miss potential plagiarism
      5. For the source field:
         - Quote the full source question
         - Underline or mark exactly what parts are identical
      6. For the description:
         - Focus on the specific evidence of potential copying
         - Explain what makes this match suspicious
         - Identify specific unique elements that match
      7. Format the response as valid JSON
      8. DO NOT include any markdown formatting or code blocks
      9. The response should start with { and end with }
      10. Err on the side of flagging suspicious content rather than missing potential plagiarism`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean up the response text
      text = text.trim();
      // Remove any markdown code block indicators
      text = text.replace(/```json\s*|\s*```/g, '');
      // Remove any leading/trailing whitespace
      text = text.trim();
      
      try {
        const parsedResult = JSON.parse(text);
        setPlagiarismResult(parsedResult);
        setStatus('Plagiarism check complete');
        setLoadingState('loaded');
      } catch (error) {
        console.error('Failed to parse:', text);
        setStatus('Error parsing results: ' + (error as Error).message);
        setLoadingState('error');
      }
    } catch (error) {
      setStatus('Error checking plagiarism: ' + (error as Error).message);
      setLoadingState('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Science Olympiad Plagiarism Checker</h1>
          <p className="text-slate-600 text-sm">Check your work against official Science Olympiad questions</p>
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
                <li>Paste your text into the input box</li>
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
              <textarea
                id="text-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white/50 text-slate-700 text-sm transition-colors h-32"
                placeholder="Paste the text you want to check for plagiarism here..."
              />
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

          {plagiarismResult && (
            <div className="mt-4 space-y-4">
              {plagiarismResult.overallAnalysis && (
                <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-700">Analysis</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      plagiarismResult.overallAnalysis.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                      plagiarismResult.overallAnalysis.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {plagiarismResult.overallAnalysis.riskLevel.charAt(0).toUpperCase() + 
                       plagiarismResult.overallAnalysis.riskLevel.slice(1)} Risk
                    </span>
                  </div>
                  {plagiarismResult.overallAnalysis.verdict && (
                    <p className="text-slate-700 text-sm font-medium mb-2">{plagiarismResult.overallAnalysis.verdict}</p>
                  )}
                  {plagiarismResult.overallAnalysis.explanation && (
                    <p className="text-slate-600 text-sm mb-2">{plagiarismResult.overallAnalysis.explanation}</p>
                  )}
                  <div className="text-xs text-slate-500">
                    Overall Confidence: {(plagiarismResult.overallConfidence * 100).toFixed(1)}%
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-700">Potential Matches:</h3>
                {plagiarismResult.matches.map((match, index) => (
                  <div key={index} className="p-4 bg-amber-50/50 rounded-lg border border-amber-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-amber-700">
                        Confidence: {(match.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded border border-amber-100 mb-2">
                      <p className="text-slate-700 text-sm">
                        <span className="bg-amber-100 px-1 rounded">{match.text}</span>
                      </p>
                    </div>
                    <div className="text-xs text-slate-600">
                      <p className="font-medium mb-1">Source:</p>
                      <p className="mb-2">{match.source}</p>
                      <p className="font-medium mb-1">Description:</p>
                      <p>{match.description}</p>
                    </div>
                  </div>
                ))}
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
