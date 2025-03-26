'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/contexts/ThemeContext';
import { toast, ToastContainer } from 'react-toastify';
import { auth } from '@/lib/firebase';
import { updateMetrics } from '@/app/utils/metrics';
import { removeBookmark } from '@/app/utils/bookmarks';
import ReportModal from '@/app/components/ReportModal';
import MarkdownExplanation from '@/app/utils/MarkdownExplanation';
import 'react-toastify/dist/ReactToastify.css';

interface Question {
  question: string;
  options: string[];
  answers: string[];
  difficulty: number;
}

interface BookmarkedQuestion {
  question: Question;
  eventName: string;
  source: string;
  timestamp: number;
}

interface ReportState {
  isOpen: boolean;
  questionIndex: number | null;
}

const isMultiSelectQuestion = (question: string, answers: string[]) => {
  return answers.length > 1;
};

export default function Content() {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<(string | null)[]>([]);
  const { darkMode, setDarkMode } = useTheme();
  const [reportState, setReportState] = useState<ReportState>({
    isOpen: false,
    questionIndex: null
  });
  const [explanations, setExplanations] = useState<{ [key: number]: string }>({});
  const [loadingExplanation, setLoadingExplanation] = useState<{ [key: number]: boolean }>({});
  const [lastCallTime, setLastCallTime] = useState<number>(0);
  const RATE_LIMIT_DELAY = 2000;
  const [gradingResults, setGradingResults] = useState<{ [key: string]: number }>({});
  const [practiceQuestions, setPracticeQuestions] = useState<BookmarkedQuestion[]>([]);
  const [eventName, setEventName] = useState<string>('');
  const [removedBookmarks, setRemovedBookmarks] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadQuestions = () => {
      const questionsJson = sessionStorage.getItem('practiceQuestions');
      const event = sessionStorage.getItem('currentPracticeEvent');
      if (!questionsJson || !event) {
        router.push('/bookmarks');
        return;
      }
      const questions = JSON.parse(questionsJson);
      setPracticeQuestions(questions);
      setEventName(event);
      setIsLoading(false);
    };

    loadQuestions();
  }, [router]);

  const handleAnswerChange = (answer: string | null, multiselect = false) => {
    if (multiselect) {
      setCurrentAnswer((prev) => {
        if (prev.includes(answer)) {
          return prev.filter((ans) => ans !== answer);
        }
        return [...prev, answer];
      });
    } else {
      setCurrentAnswer([answer]);
    }
  };

  const isCorrect = async (question: Question, answers: (string | null)[]): Promise<number> => {
    if (!question.answers || question.answers.length === 0) return 0;

    if (question.options && question.options.length > 0) {
      const filteredUserAnswers = answers.filter((a) => a !== null) as string[];
      const correctOptions = question.answers.map(ans => question.options![Number(ans) - 1]);

      if (question.answers.length > 1) {
        if (filteredUserAnswers.length === 0) return 0;
        const numCorrectSelected = filteredUserAnswers.filter((a) => correctOptions.includes(a)).length;
        const hasIncorrectAnswers = filteredUserAnswers.some(a => !correctOptions.includes(a));

        if (numCorrectSelected === correctOptions.length && !hasIncorrectAnswers) {
          return 1;
        } else if (numCorrectSelected > 0) {
          return 0.5;
        }
        return 0;
      } else {
        return filteredUserAnswers.length === 1 && filteredUserAnswers[0] === correctOptions[0] ? 1 : 0;
      }
    }

    if (!answers[0]) return 0;
    return question.answers.includes(answers[0]) ? 1 : 0;
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    const currentQuestion = practiceQuestions[currentQuestionIndex].question;
    
    try {
      const score = await isCorrect(currentQuestion, currentAnswer);
      setGradingResults((prev) => ({ ...prev, [currentQuestionIndex]: score }));

      const wasAttempted = currentAnswer.length > 0 && currentAnswer[0] !== null && currentAnswer[0] !== '';
      const isMultiSelect = currentQuestion.answers.length > 1 && currentQuestion.options;
      const isCorrectAnswer = isMultiSelect ? score === 1 : score >= 0.5;
      
      await updateMetrics(auth.currentUser?.uid || null, {
        questionsAttempted: wasAttempted ? 1 : 0,
        correctAnswers: wasAttempted && isCorrectAnswer ? 1 : 0,
        eventName: practiceQuestions[currentQuestionIndex].eventName,
      });
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentQuestionIndex(0);
    }
    setCurrentAnswer([]);
    setIsSubmitted(false);
  };

  const handleReport = async (reason: string, action: 'remove' | 'edit', editedQuestion?: string, originalQuestion?: string) => {
    if (reportState.questionIndex === null) return;
    
    setReportState({ isOpen: false, questionIndex: null });
    
    try {
      const bookmarked = practiceQuestions[reportState.questionIndex];
      const endpoint = action === 'remove' ? '/api/report/remove' : '/api/report/edit';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: bookmarked.question.question,
          answer: bookmarked.question.answers,
          originalQuestion: originalQuestion || JSON.stringify(bookmarked.question),
          editedQuestion: editedQuestion,
          event: bookmarked.eventName,
          reason
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`${action === 'remove' ? 'Report' : 'Edit'} submitted successfully!`);
      } else {
        toast.error(result.message || 'Failed to submit report');
      }
    } catch {
      toast.error('Failed to submit report. Please try again.');
    }
  };

  const getExplanation = async (index: number, question: Question) => {
    if (explanations[index]) return;

    const now = Date.now();
    if (now - lastCallTime < RATE_LIMIT_DELAY) {
      toast.error('Please wait a moment before requesting another explanation');
      return;
    }
    setLastCallTime(now);

    setLoadingExplanation(prev => ({ ...prev, [index]: true }));

    try {
      const prompt = `Question: ${question.question}${question.options && question.options.length > 0 ? `\nOptions: ${question.options.join(', ')}` : ''}\nAnswer:${question.answers[0]}
                      Solve this question. Start with the text "Explanation: ", providing a clear and informative explanation. Start off by giving a one paragraph explanation that leads to your answer, nothing else.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAkBDzzh7TQTJzmlLmzC7Yb5ls5SJqe05c`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch explanation: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setExplanations(prev => ({ ...prev, [index]: explanation }));
    } catch (error) {
      console.error('Error in getExplanation:', error);
      setExplanations(prev => ({
        ...prev,
        [index]: 'Failed to load explanation. Please try again later.'
      }));
      toast.error(`Failed to get explanation: ${(error as Error).message}`);
    } finally {
      setLoadingExplanation(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleBackToBookmarks = () => {
    router.push('/bookmarks');
  };

  const handleRemoveBookmark = async (index: number) => {
    if (!auth.currentUser) {
      toast.info('Please sign in to manage bookmarks');
      return;
    }
    
    try {
      const bookmarked = practiceQuestions[index];
      
      setRemovedBookmarks(prev => {
        const newSet = new Set(prev);
        newSet.add(index);
        return newSet;
      });
      
      await removeBookmark(auth.currentUser.uid, bookmarked.question, bookmarked.source);
      toast.success('Bookmark removed!');
      
      if (index === currentQuestionIndex) {
        if (practiceQuestions.length > 1) {
          if (currentQuestionIndex >= practiceQuestions.length - 1) {
            setCurrentQuestionIndex(0);
          }
          setPracticeQuestions(questions => questions.filter((_, i) => i !== index));
        } else {
          toast.info('No more bookmarked questions for this event');
          setTimeout(() => {
            router.push('/bookmarks');
          }, 1500);
        }
      } else {
        setPracticeQuestions(questions => questions.filter((_, i) => i !== index));
        if (index < currentQuestionIndex) {
          setCurrentQuestionIndex(prev => prev - 1);
        }
      }
    } catch (error) {
      setRemovedBookmarks(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
      console.error('Error removing bookmark:', error);
      toast.error('Failed to remove bookmark');
    }
  };

  const renderQuestion = (bookmarked: BookmarkedQuestion) => {
    const question = bookmarked.question;
    const isMultiSelect = isMultiSelectQuestion(question.question, question.answers);
    const currentAnswers = currentAnswer || [];
    const difficulty = question.difficulty || 0.5;

    return (
      <div className={`relative border p-4 rounded-lg shadow-sm transition-all duration-500 ease-in-out ${
        darkMode
          ? 'bg-gray-700 border-gray-600 text-white'
          : 'bg-gray-50 border-gray-300 text-black'
          }`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">Question</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              From {bookmarked.eventName} ({bookmarked.source === 'test' ? 'Test Mode' : 'Practice Mode'})
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleRemoveBookmark(currentQuestionIndex)}
              className="text-gray-500 hover:text-yellow-500 transition-colors duration-200"
              title="Remove from bookmarks"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
            <button
              onClick={() => setReportState({ isOpen: true, questionIndex: currentQuestionIndex })}
              className="text-gray-500 hover:text-red-500 transition-colors duration-200"
              title="Report this question"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
          </div>
        </div>
        <p className="mb-4 break-words whitespace-normal overflow-x-auto">
          {question.question}
        </p>

        {question.options && question.options.length > 0 ? (
          <div className="space-y-2">
            {question.options.map((option, idx) => (
              <label
                key={idx}
                className={`block p-2 rounded-md transition-colors duration-1000 ease-in-out ${
                  isSubmitted && currentAnswers.includes(option)
                    ? gradingResults[currentQuestionIndex] === 1
                      ? darkMode ? 'bg-green-800' : 'bg-green-200'
                      : gradingResults[currentQuestionIndex] === 0
                      ? darkMode ? 'bg-red-900' : 'bg-red-200'
                      : darkMode ? 'bg-amber-400' : 'bg-amber-400'
                    : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                } ${!isSubmitted && (darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300')}`}
              >
                <input
                  type={isMultiSelect ? "checkbox" : "radio"}
                  name={`question-${currentQuestionIndex}`}
                  value={option}
                  checked={currentAnswers.includes(option)}
                  onChange={() => handleAnswerChange(option, isMultiSelect)}
                  disabled={isSubmitted}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        ) : (
          <textarea
            value={currentAnswer[0] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            disabled={isSubmitted}
            className={`w-full p-2 border rounded-md transition-all duration-1000 ease-in-out ${
              isSubmitted 
                ? gradingResults[currentQuestionIndex] === 1
                  ? darkMode ? 'bg-green-800 border-green-700' : 'bg-green-200 border-green-300'
                  : gradingResults[currentQuestionIndex] === 0
                  ? darkMode ? 'bg-red-900 border-red-800' : 'bg-red-200 border-red-300'
                  : darkMode ? 'bg-amber-400 border-amber-500' : 'bg-amber-400 border-amber-500'
                : darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
            }`}
            rows={3}
            placeholder="Type your answer here..."
          />
        )}

        {isSubmitted && (
          <>
            <p className={`mt-2 font-semibold ${
              !currentAnswers[0]
                ? 'text-blue-500'
                : gradingResults[currentQuestionIndex] === 1
                ? 'text-green-600'
                : gradingResults[currentQuestionIndex] === 0
                ? 'text-red-600'
                : 'text-amber-400'
            }`}>
              {!currentAnswers[0]
                ? 'Skipped'
                : gradingResults[currentQuestionIndex] === 1
                ? 'Correct!'
                : gradingResults[currentQuestionIndex] === 0
                ? 'Wrong!'
                : 'Partial Credit'}
            </p>
            <p className="text-sm mt-1">
              <strong>Correct Answer(s):</strong>{' '}
              {question.options?.length
                ? question.answers
                    .map((ans) => question.options?.[Number(ans) - 1])
                    .join(', ')
                : question.answers.join(', ')}
            </p>
            <div className="mt-2">
              {!explanations[currentQuestionIndex] ? (
                <button
                  onClick={() => getExplanation(currentQuestionIndex, question)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-blue-400'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                    }`}
                  disabled={loadingExplanation[currentQuestionIndex]}
                >
                  {loadingExplanation[currentQuestionIndex] ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  ) : (
                    <>
                      <span>Explain</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </>
                  )}
                </button>
              ) : (
                <MarkdownExplanation text={explanations[currentQuestionIndex]} />
              )}
            </div>
          </>
        )}
        <br />
        {/* Difficulty Bar */}
        <div className="absolute bottom-2 right-2 w-20 h-2 rounded-full bg-gray-300 transition-all duration-1000 ease-in-out">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-in-out ${
              difficulty >= 0.66
                ? 'bg-red-500'
                : difficulty >= 0.33
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${difficulty * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <>
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
          <header className="w-full max-w-3xl flex justify-between items-center py-4 transition-colors duration-1000 ease-in-out">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              {eventName} ({practiceQuestions.length} Questions)
            </h1>
          </header>

          <main
            className={`w-full max-w-3xl rounded-lg shadow-md p-6 mt-4 transition-all duration-1000 ease-in-out ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            {isLoading ? (
              <div className="text-center py-8">
                <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Loading questions...
                </p>
              </div>
            ) : practiceQuestions.length === 0 ? (
              <div className="text-center py-8">
                <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  No questions available
                </p>
                <button
                  onClick={handleBackToBookmarks}
                  className={`mt-4 px-4 py-2 rounded-lg transition-all duration-300 ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                    }`}
                >
                  Back to Bookmarks
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {renderQuestion(practiceQuestions[currentQuestionIndex])}

                {/* Action Button */}
                <div className="mt-6 text-center">
                  {!isSubmitted ? (
                    <button
                      onClick={handleSubmit}
                      className={`w-full mt-6 px-4 py-2 font-semibold rounded-lg transition-all duration-1000 transform hover:scale-105 ${
                        darkMode
                          ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100 text-white'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      }`}
                    >
                      {currentAnswer.length === 0 || currentAnswer[0] === null || currentAnswer[0] === '' ? 'Skip Question' : 'Check Answer'}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className={`w-full mt-6 px-4 py-2 font-semibold rounded-lg transition-all duration-1000 transform hover:scale-105 ${
                        darkMode
                          ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100 text-white'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      }`}
                    >
                      Next Question
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* Back Button */}
          <button
            onClick={handleBackToBookmarks}
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
      </div>

      <ReportModal
        isOpen={reportState.isOpen}
        onClose={() => setReportState({ isOpen: false, questionIndex: null })}
        onSubmit={handleReport}
        darkMode={darkMode}
        question={practiceQuestions[reportState.questionIndex ?? 0]?.question}
        event={practiceQuestions[reportState.questionIndex ?? 0]?.eventName || 'Unknown Event'}
      />

      <ToastContainer theme={darkMode ? "dark" : "light"} />
    </>
  );
} 