'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';

// Define types for the data structures
interface EditedQuestion {
  original: string;
  edited: string;
  timestamp: string;
}

type BlacklistedQuestions = Record<string, string[]>;
type EditedQuestions = Record<string, EditedQuestion[]>;

interface CombinedData {
  blacklists: BlacklistedQuestions;
  edits: EditedQuestions;
}

export default function JsonDataPage() {
  const { darkMode } = useTheme();
  const [data, setData] = useState<CombinedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [activeTab, setActiveTab] = useState<'blacklisted' | 'edited' | 'all'>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all data from the combined endpoint
        const response = await fetch('/api/report/all');
        if (!response.ok) {
          throw new Error('Failed to fetch report data');
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get the active data based on the selected tab
  const getActiveData = () => {
    if (!data) return {};
    
    switch (activeTab) {
      case 'blacklisted':
        return data.blacklists;
      case 'edited':
        return data.edits;
      case 'all':
      default:
        return data;
    }
  };

  // Format JSON with indentation for better readability
  const formatJson = (data: unknown) => {
    return JSON.stringify(data, null, 2);
  };

  // Function to download the current JSON data
  const downloadJson = () => {
    if (!data) return;
    
    const jsonData = getActiveData();
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `scio-${activeTab}-data.json`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Background and text colors based on dark mode
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const cardBgColor = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const buttonBgColor = darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
  const activeButtonBgColor = darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600';
  const codeBlockBgColor = darkMode ? 'bg-gray-950' : 'bg-gray-100';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0">Raw JSON Data</h1>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'all' 
                  ? `${activeButtonBgColor} text-white` 
                  : `${buttonBgColor} ${textColor}`
              }`}
            >
              All Data
            </button>
            <button
              onClick={() => setActiveTab('blacklisted')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'blacklisted' 
                  ? `${activeButtonBgColor} text-white` 
                  : `${buttonBgColor} ${textColor}`
              }`}
            >
              Blacklisted
            </button>
            <button
              onClick={() => setActiveTab('edited')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'edited' 
                  ? `${activeButtonBgColor} text-white` 
                  : `${buttonBgColor} ${textColor}`
              }`}
            >
              Edited
            </button>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showRaw 
                  ? `bg-green-600 hover:bg-green-700 text-white` 
                  : `${buttonBgColor} ${textColor}`
              }`}
            >
              {showRaw ? 'Formatted View' : 'Raw JSON'}
            </button>
            <button
              onClick={downloadJson}
              disabled={loading || !data}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                loading || !data
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download JSON
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Loading data...</p>
          </div>
        ) : error ? (
          <div className={`${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-700'} border ${darkMode ? 'border-red-800' : 'border-red-400'} px-6 py-4 rounded-md`}>
            <p className="font-medium">Error loading data</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : (
          <div className={`${cardBgColor} rounded-lg shadow-md border ${borderColor} overflow-hidden`}>
            <div className="p-4">
              {showRaw ? (
                // Raw JSON view
                <pre className={`${codeBlockBgColor} p-4 rounded-md overflow-x-auto`}>
                  {formatJson(getActiveData())}
                </pre>
              ) : (
                // Formatted view with collapsible sections
                <div className="space-y-4">
                  {activeTab === 'all' && data && (
                    <>
                      <h2 className="text-xl font-semibold mb-2">Blacklisted Questions</h2>
                      <pre className={`${codeBlockBgColor} p-4 rounded-md overflow-x-auto mb-6`}>
                        {formatJson(data.blacklists)}
                      </pre>
                      
                      <h2 className="text-xl font-semibold mb-2">Edited Questions</h2>
                      <pre className={`${codeBlockBgColor} p-4 rounded-md overflow-x-auto`}>
                        {formatJson(data.edits)}
                      </pre>
                    </>
                  )}
                  
                  {activeTab === 'blacklisted' && data && (
                    <pre className={`${codeBlockBgColor} p-4 rounded-md overflow-x-auto`}>
                      {formatJson(data.blacklists)}
                    </pre>
                  )}
                  
                  {activeTab === 'edited' && data && (
                    <pre className={`${codeBlockBgColor} p-4 rounded-md overflow-x-auto`}>
                      {formatJson(data.edits)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-8 text-sm text-gray-500">
          <p>This is an administrative page showing raw data from the reports database.</p>
        </div>
      </div>
    </div>
  );
} 