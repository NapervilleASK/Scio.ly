'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth } from '@/lib/firebase';
import { loadBookmarksFromFirebase, removeBookmark } from '@/app/utils/bookmarks';

interface Question {
  question: string;
  options?: string[];
  answers: (string | number)[];
  difficulty: number;
}

interface BookmarkedQuestion {
  question: Question;
  eventName: string;
  source: string;
  timestamp: number;
}

// Simple component to display a bookmarked question's text, options, and answer
const BookmarkedQuestionDisplay = ({ bookmarkedQuestion, darkMode, onRemove }: { 
  bookmarkedQuestion: BookmarkedQuestion; 
  darkMode: boolean; 
  onRemove: (questionToRemove: BookmarkedQuestion) => void; 
}) => {
  const { question } = bookmarkedQuestion; // Extract question object

  return (
    <div className={`relative p-4 rounded-md ${darkMode ? 'bg-gray-800/50' : 'bg-gray-100/80'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
      {/* Remove Button */} 
      <button 
        onClick={() => onRemove(bookmarkedQuestion)}
        className={`absolute top-1 right-1 p-1 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/50' : 'text-gray-500 hover:text-red-600 hover:bg-red-100'}`}
        aria-label="Remove this bookmark"
        title="Remove this bookmark"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <p className={`break-words whitespace-normal text-sm font-medium mb-3 pr-6 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{question.question}</p>
      
      {/* Display Options if they exist */}
      {question.options && question.options.length > 0 && (
        <div className="space-y-2 mb-3">
          {question.options.map((option, idx) => {
            // Check if the current option is a correct answer
            // Handles both index-based (number) and text-based (string) answers
            const isCorrect = question.answers.includes(idx + 1) || // Check if index (1-based) is in answers
                              (typeof question.answers[0] === 'string' && // Check if answers are strings
                               question.answers.includes(option)); // Check if option text is in answers
            
            return (
              <div 
                key={idx} 
                className={`p-2 rounded text-xs flex items-center ${ 
                  isCorrect
                    ? (darkMode ? 'bg-green-800/40 text-green-300' : 'bg-green-100 text-green-700 font-medium')
                    : (darkMode ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-200/70 text-gray-700')
                }`}
              >
                <span className="mr-2">{String.fromCharCode(65 + idx)}.</span> {/* A, B, C... */}
                <span className="flex-grow">{option}</span>
                {isCorrect && (
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Display Answer directly if no options (e.g., FRQ) */}
      {(!question.options || question.options.length === 0) && question.answers.length > 0 && (
        <div className="mt-2">
          <h4 className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Correct Answer:</h4>
          <div className={`p-2 rounded text-xs ${darkMode ? 'bg-green-800/40 text-green-300' : 'bg-green-100 text-green-700'}`}>
            {Array.isArray(question.answers) 
              ? question.answers.join(', ') 
              : String(question.answers)}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Content() {
  const router = useRouter();
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Record<string, BookmarkedQuestion[]>>({});
  const [openEvents, setOpenEvents] = useState<Record<string, boolean>>({}); // State for dropdowns
  const { darkMode, setDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState<Record<string, boolean>>({}); // Track removal state per question key

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        // Load bookmarks from Firebase if user is logged in
        if (auth.currentUser) {
          const bookmarks = await loadBookmarksFromFirebase(auth.currentUser.uid);
          
          // Group questions by event
          const groupedQuestions = bookmarks.reduce((acc, question) => {
            if (!acc[question.eventName]) {
              acc[question.eventName] = [];
            }
            acc[question.eventName].push(question);
            return acc;
          }, {} as Record<string, BookmarkedQuestion[]>);

          // Sort events by number of questions
          setBookmarkedQuestions(groupedQuestions);
        } else {
          // No bookmarks for logged out users, show empty state
          setBookmarkedQuestions({});
        }
      } catch (error) {
        console.error('Error loading bookmarks:', error);
        toast.error('Failed to load bookmarks');
      } finally {
        setIsLoading(false);
      }
    };

    loadBookmarks();
  }, []);

  const handlePracticeEvent = (eventName: string, questions: BookmarkedQuestion[]) => {
    // Use sessionStorage instead of localStorage for temporary storage
    sessionStorage.setItem('practiceQuestions', JSON.stringify(questions));
    sessionStorage.setItem('currentPracticeEvent', eventName);
    router.push('/bookmarks/practice');
  };

  const toggleEventDropdown = (eventName: string) => {
    setOpenEvents(prev => ({
      ...prev,
      [eventName]: !prev[eventName],
    }));
  };

  const handleBackToPractice = () => {
    router.push('/dashboard');
  };

  // Function to remove a single bookmark
  const handleRemoveSingleBookmark = async (questionToRemove: BookmarkedQuestion) => {
    if (!auth.currentUser) {
      toast.info('Please sign in to manage bookmarks');
      return;
    }

    const questionKey = `${questionToRemove.eventName}-${questionToRemove.timestamp}`;
    if (isRemoving[questionKey]) return; // Prevent double clicks
    setIsRemoving(prev => ({ ...prev, [questionKey]: true }));

    try {
      await removeBookmark(auth.currentUser.uid, questionToRemove.question, questionToRemove.source);
      
      // Update state to remove the question immediately
      setBookmarkedQuestions(prev => {
        const updatedEvents = { ...prev };
        const eventName = questionToRemove.eventName;
        if (updatedEvents[eventName]) {
          updatedEvents[eventName] = updatedEvents[eventName].filter(
            q => !(q.question.question === questionToRemove.question.question && q.source === questionToRemove.source && q.timestamp === questionToRemove.timestamp)
          );
          // If the event becomes empty, remove the event key
          if (updatedEvents[eventName].length === 0) {
            delete updatedEvents[eventName];
          }
        }
        return updatedEvents;
      });

      toast.success('Bookmark removed!');
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast.error('Failed to remove bookmark');
    } finally {
      setIsRemoving(prev => ({ ...prev, [questionKey]: false }));
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Layers */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          darkMode ? 'opacity-100' : 'opacity-0'
        } bg-gradient-to-br from-gray-800 to-black`}
      ></div>
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          darkMode ? 'opacity-0' : 'opacity-100'
        } bg-gradient-to-br from-gray-50 to-blue-100`}
      ></div>

      <div className="relative flex flex-col items-center p-5 transition-all duration-1000 ease-in-out">
        <header className="w-full max-w-3xl flex justify-between items-center py-4">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            Your Bookmarked Questions
          </h1>
        </header>
        <p className={`w-full max-w-3xl mt-[-1vh] text-left text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Here you can find all the questions you&apos;ve bookmarked while practicing or taking tests, organized by event. Click the arrow on any event card to start a practice session with those specific questions.
        </p>
        <br/>
        <main className={`w-full max-w-3xl rounded-lg shadow-lg p-6 mt-4 transition-all duration-1000 ease-in-out ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            </div>
          ) : !auth.currentUser ? (
            <div className="text-center py-8">
              <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Please sign in to view your bookmarks
              </p>
            </div>
          ) : Object.keys(bookmarkedQuestions).length === 0 ? (
            <div className="text-center py-8">
              <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                No bookmarked questions yet
              </p>
              <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Bookmark questions while practicing or taking tests to see them here
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {Object.entries(bookmarkedQuestions)
                .sort(([, a], [, b]) => b.length - a.length)
                .map(([eventName, questions]) => (
                <div
                  key={eventName}
                  className={`rounded-lg transition-all duration-300 flex flex-col ${
                    darkMode
                      ? 'bg-gray-700'
                      : 'bg-gray-50'
                  } shadow-sm hover:shadow-md overflow-hidden`}
                >
                  {/* Wrapper for header + practice button */}
                  <div className="flex items-stretch">
                     {/* Event Details Section (now clickable button) */}
                    <button
                      onClick={() => toggleEventDropdown(eventName)}
                      className={`flex-grow p-6 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200 ${
                        darkMode ? 'hover:bg-gray-600/50' : 'hover:bg-gray-100'
                      }`}
                      aria-expanded={!!openEvents[eventName]}
                      aria-controls={`questions-${eventName}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {eventName}
                          </h2>
                          {/* Statistics for desktop only */}
                          <div className={`hidden md:flex gap-4 mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <p>{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
                            <p>From Test Mode: {questions.filter(q => q.source === 'test').length}</p>
                            <p>From Unlimited Mode: {questions.filter(q => q.source === 'unlimited').length}</p>
                          </div>
                          {/* Simple count for mobile only */}
                          <div className={`md:hidden mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <p>{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        {/* Chevron Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${openEvents[eventName] ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                     {/* Arrow Button Section (remains separate) */}
                    <button
                      onClick={() => handlePracticeEvent(eventName, questions)}
                      aria-label={`Practice ${eventName} questions`}
                      className={`w-16 flex items-center justify-center transition-all duration-300 ease-in-out group ${
                        darkMode
                          ? 'bg-gray-600 hover:bg-regalblue-100'
                          : 'bg-gray-200 hover:bg-blue-500'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-all duration-300 ease-in-out group-hover:translate-x-1 ${darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                  {/* Conditionally Rendered Questions Dropdown */}
                  {openEvents[eventName] && (
                    <div id={`questions-${eventName}`} className={`p-6 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'} space-y-3 bg-opacity-50 ${darkMode ? 'bg-black/10' : 'bg-white/50'}`}>
                      <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Bookmarked Questions:</h4>
                      {questions.map((q, index) => (
                        <BookmarkedQuestionDisplay 
                          key={`${eventName}-${index}-${q.timestamp}`} 
                          bookmarkedQuestion={q} // Pass the full object
                          darkMode={darkMode} 
                          onRemove={handleRemoveSingleBookmark} // Pass the removal handler
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Back Button */}
        <button
          onClick={handleBackToPractice}
          className={`fixed bottom-8 left-8 p-4 rounded-full shadow-lg transition-transform duration-300 hover:scale-110 ${
            darkMode
              ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100 text-white'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-110 ${
            darkMode ? 'bg-gray-700' : 'bg-white'
          }`}
        >
          {darkMode ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="4" fill="currentColor" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 1112 3v0a9 9 0 008.354 12.354z"
              />
            </svg>
          )}
        </button>
      </div>
      <ToastContainer theme={darkMode ? "dark" : "light"} />
    </div>
  );
} 