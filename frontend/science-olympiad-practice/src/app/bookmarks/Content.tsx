'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth } from '@/lib/firebase';
import { loadBookmarksFromFirebase } from '@/app/utils/bookmarks';

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

export const getBookmarkedQuestions = (): BookmarkedQuestion[] => {
  const bookmarked = localStorage.getItem('bookmarkedQuestions');
  return bookmarked ? JSON.parse(bookmarked) : [];
};

export default function Content() {
  const router = useRouter();
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Record<string, BookmarkedQuestion[]>>({});
  const { darkMode, setDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        // Load bookmarks from Firebase if user is logged in
        if (auth.currentUser) {
          await loadBookmarksFromFirebase(auth.currentUser.uid);
        }

        // Get bookmarks from localStorage
        const bookmarked = localStorage.getItem('bookmarkedQuestions');
        if (bookmarked) {
          const questions = JSON.parse(bookmarked) as BookmarkedQuestion[];
          
          // Group questions by event
          const groupedQuestions = questions.reduce((acc, question) => {
            if (!acc[question.eventName]) {
              acc[question.eventName] = [];
            }
            acc[question.eventName].push(question);
            return acc;
          }, {} as Record<string, BookmarkedQuestion[]>);

          // Sort events by number of questions
          setBookmarkedQuestions(groupedQuestions);
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
    localStorage.setItem('practiceQuestions', JSON.stringify(questions));
    localStorage.setItem('currentPracticeEvent', eventName);
    router.push('/bookmarks/practice');
  };

  const handleBackToPractice = () => {
    router.push('/practice');
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

      <div className="relative flex flex-col items-center p-6 transition-all duration-1000 ease-in-out">
        <header className="w-full max-w-3xl flex justify-between items-center py-4">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            Bookmarked Questions by Event
          </h1>
        </header>

        <main className={`w-full max-w-3xl rounded-lg shadow-md p-6 mt-4 transition-all duration-1000 ease-in-out ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
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
                  className={`p-6 rounded-lg transition-all duration-300 ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {eventName}
                      </h2>
                      <div className={`flex gap-4 mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <p>{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
                        <p>From Test Mode: {questions.filter(q => q.source === 'test').length}</p>
                        <p>From Practice Mode: {questions.filter(q => q.source === 'unlimited').length}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePracticeEvent(eventName, questions)}
                      className={`px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                        darkMode
                          ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100 text-white'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      }`}
                    >
                      Practice Questions
                    </button>
                  </div>
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