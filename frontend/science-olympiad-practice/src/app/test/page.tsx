'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { updateMetrics } from '@/utils/metrics';
import { auth } from '@/lib/firebase';
import { useTheme } from '@/app/contexts/ThemeContext';
import api from '../api'
interface Question {
  question: string;
  options?: string[];
  answers: (number | string)[];
  difficulty: number;
}

interface RouterParams {
  eventName?: string;
  questionCount?: string;
  difficulty?: string;
  types?: string;
  timeLimit?: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  darkMode: boolean;
}

interface ReportState {
  isOpen: boolean;
  questionIndex: number | null;
}

const API_URL = api.api

const ReportModal = ({ isOpen, onClose, onSubmit, darkMode }: ReportModalProps) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(reason);
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-6 w-96 transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <h3 className="text-lg font-semibold mb-4">Report Question</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            className={`w-full p-2 border rounded-md mb-4 transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500' 
                : 'bg-white text-gray-900 border-gray-300 focus:border-blue-400'
            }`}
            rows={4}
            placeholder="Please describe the issue with this question..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-md transition-colors duration-300 ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors duration-300"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Move difficultyMap outside the component
const difficultyMap: Record<string, number> = {
  easy: 0.33,
  medium: 0.66,
  hard: 1.0,
};

// Add this helper function near your other functions
const formatExplanationText = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
};

export default function TestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Question[]>([]);
  const [routerData, setRouterData] = useState<RouterParams>({});
  const [userAnswers, setUserAnswers] = useState<Record<number, (string | null)[] | null>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const { darkMode, setDarkMode } = useTheme();
  const [reportState, setReportState] = useState<ReportState>({
    isOpen: false,
    questionIndex: null
  });
  const [explanations, setExplanations] = useState<{[key: number]: string}>({});
  const [loadingExplanation, setLoadingExplanation] = useState<{[key: number]: boolean}>({});
  const [lastCallTime, setLastCallTime] = useState<number>(0);
  const RATE_LIMIT_DELAY = 2000; // 2 seconds between calls

  useEffect(() => {
    const storedParams = localStorage.getItem('testParams');
    if (!storedParams) {
      // Handle the case where params are not in localStorage (e.g., redirect)
      router.push('/'); // Or some other appropriate action.
      return;
    }
  
    const routerParams = JSON.parse(storedParams);
    setRouterData(routerParams);
  
    if (routerParams.timeLimit) {
      setTimeLeft(parseInt(routerParams.timeLimit, 10) * 60); // Convert minutes to seconds
    }
  
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch data');
        const jsonData = await response.json();
  
        const { eventName, questionCount, difficulty, types } = routerParams;
        const difficultyValue = difficultyMap[difficulty || 'easy'] || 0.33;
        const eventQuestions: Question[] = jsonData[eventName as string] || [];
  
        const filteredQuestions = eventQuestions.filter((q) => {
          // Set default difficulty to 0.5 if not specified
          const questionDifficulty = q.difficulty ?? 0.5;
  
          return difficulty === 'any'
            ? true
            : questionDifficulty >= difficultyValue - 0.33 &&
                questionDifficulty <= difficultyValue;
        });
  
        const finalQuestions =
          types === 'multiple-choice'
            ? filteredQuestions.filter((q) => q.options && q.options.length > 0)
            : types === 'free-response'
            ? filteredQuestions.filter((q) => q.options?.length == 0)
            : filteredQuestions;
  
        function shuffleArray<T>(array: T[]): T[] {
          const newArray = [...array];
          for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
          }
          return newArray;
        }
  
        const shuffledQuestions = shuffleArray(finalQuestions);
        const selectedQuestions = shuffledQuestions.slice(
          0,
          parseInt(questionCount || '0')
        );
        console.log(shuffledQuestions);
        console.log(selectedQuestions);
        setData(selectedQuestions);
      } catch (error) {
        console.error(error);
        setFetchError('Failed to load questions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, [router]); // dependency array now only contains router.

  useEffect(() => {
    if (timeLeft === null || isSubmitted) return;

    if (timeLeft === 0) {
      setIsSubmitted(true);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const handleAnswerChange = (
    questionIndex: number,
    answer: string | null,
    multiselect = false
  ) => {
    setUserAnswers((prev) => {
      const currentAnswers = prev[questionIndex] || [];
      if (multiselect) {
        const updatedAnswers = currentAnswers.includes(answer)
          ? currentAnswers.filter((ans) => ans !== answer)
          : [...currentAnswers, answer];
        return { ...prev, [questionIndex]: updatedAnswers };
      }
      return { ...prev, [questionIndex]: [answer] };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    
    // Calculate total answered questions and correct answers
    const stats = data.reduce((total, question, index) => {
      const answers = userAnswers[index];
      // Only count if the question was actually answered
      if (answers && answers.length > 0 && answers[0] !== null && answers[0] !== '') {
        total.attempted++;
        if (isCorrect(question, answers)) {
          total.correct++;
        }
      }
      return total;
    }, { attempted: 0, correct: 0 });

    try {
      await updateMetrics(auth.currentUser?.uid || null, {
        questionsAttempted: stats.attempted,
        correctAnswers: stats.correct,
        eventName: routerData.eventName || undefined
      });
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
    
    // Scroll to top smoothly
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleBackToMain = () => {
    router.push('/dashboard');
  };

  const isCorrect = (question: Question, answers: (string | null)[] | null) => {
    if (!question.answers || question.answers.length === 0) return null;

    // For multiple-choice or options-based questions
    if (question.options && question.options.length > 0) {
      const correctAnswers = question.answers.map((ans) =>
        question.options![ans as number - 1]
      );
      return (
        answers &&
        correctAnswers.length === answers.length &&
        correctAnswers.every((ans) => answers.includes(ans))
      );
    }

    // For free-response questions
    if (answers?.[0]) {
      const userAnswer = answers[0].toLowerCase();
      const keywords = question.answers.map((ans) => (ans as string).toLowerCase());
      return keywords.some((keyword) => userAnswer.includes(keyword));
    }

    return false;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleReport = async (reason: string) => {
    if (reportState.questionIndex === null) return;
    
    const questionData = data[reportState.questionIndex];
    const mainWebhookUrl = "https://discord.com/api/webhooks/1339786241742344363/x2BYAebIvT34tovkpQV5Nq93GTEisQ78asFivqQApS0Q9xPmSeC6o_3CrKs1MWbRKhGh";
    const summaryWebhookUrl = "https://discord.com/api/webhooks/1339794243467612170/Jeeq4QDsU5LMzN26bUX-e8Z_GzkvudeArmHPB7eAuswJw5PAY7Qgs050ueM51mO8xHMg";

    const mainPayload = {
      embeds: [{
        title: "Question Report",
        color: 0xFF0000,
        fields: [
          {
            name: "Event",
            value: routerData.eventName || "Unknown Event",
            inline: true
          },
          {
            name: "Question",
            value: questionData.question
          },
          {
            name: "Report Reason",
            value: reason
          },
          {
            name: "Question Data",
            value: `\`\`\`json\n${JSON.stringify(questionData, null, 2)}\n\`\`\``
          }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    const summaryPayload = {
      embeds: [{
        title: "❌ Question Reported",
        description: questionData.question,
        color: 0xFF0000,
        fields: [
          {
            name: "Event",
            value: routerData.eventName || "Unknown Event",
            inline: true
          }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    const toastId = toast.loading('Sending report...');

    try {
      // Send both webhook requests in parallel
      const [mainResponse, summaryResponse] = await Promise.all([
        fetch(mainWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mainPayload)
        }),
        fetch(summaryWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(summaryPayload)
        })
      ]);

      if (!mainResponse.ok || !summaryResponse.ok) {
        throw new Error('Failed to send report');
      }

      toast.update(toastId, {
        render: 'Report sent successfully! We will fix this question soon. Thank you!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error sending report:', error);
      toast.update(toastId, {
        render: 'Failed to send report. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  const getExplanation = async (index: number, question: Question) => {
    if (explanations[index]) return; // Don't fetch if we already have it
    
    // Rate limiting check
    const now = Date.now();
    if (now - lastCallTime < RATE_LIMIT_DELAY) {
      toast.error('Please wait a moment before requesting another explanation');
      return;
    }
    setLastCallTime(now);
    
    setLoadingExplanation(prev => ({...prev, [index]: true}));
    
    try {
      // Log the question data to help debug
      console.log('Question data:', question);
      
      // Safely construct the prompt
      let correctAnswers = '';
      if (question.options && question.options.length > 0) {
        correctAnswers = question.answers
          .map(ans => question.options![ans as number - 1])
          .filter(Boolean) // Remove any undefined values
          .join(', ');
      } else {
        correctAnswers = Array.isArray(question.answers) 
          ? question.answers.join(', ')
          : String(question.answers);
      }

      const prompt = `Question: ${question.question}\n` + 
        (question.options && question.options.length > 0
          ? `Options: ${question.options.join(', ')}\n`
          : '') +
        `THIS IS THE CORRECT ANSWER(S): ${correctAnswers}\n\n` +
        `Please explain why the correct answer(s) are correct with detailed reasoning, but keep it concise within reason. DO NOT CHANGE THE CORRECT ANSWER(S).`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=AIzaSyAkBDzzh7TQTJzmlLmzC7Yb5ls5SJqe05c`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response error:', errorText);
        throw new Error(`Failed to fetch explanation: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from API');
      }

      const explanation = data.candidates[0].content.parts[0].text;
      setExplanations(prev => ({...prev, [index]: explanation}));
    } catch (error) {
      console.error('Error in getExplanation:', error);
      setExplanations(prev => ({
        ...prev, 
        [index]: 'Failed to load explanation. Please try again later.'
      }));
      toast.error(`Failed to get explanation: ${(error as Error).message}`);
    } finally {
      setLoadingExplanation(prev => ({...prev, [index]: false}));
    }
  };

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }
  return (
    <>
      <div className="relative min-h-screen">
        {/* Background Layers */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            darkMode ? 'opacity-100' : 'opacity-0'
          } bg-gradient-to-br from-regalblue-100 to-regalred-100`}
        ></div>
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            darkMode ? 'opacity-0' : 'opacity-100'
          } bg-gradient-to-br from-blue-100 via-white to-cyan-100`}
        ></div>

        {/* Add styled scrollbar */}
        <style jsx global>{`
          ::-webkit-scrollbar {
            width: 8px;
            transition: background 1s ease;
            ${darkMode
              ? 'background: black;'
              : 'background: white;'
            }
          }

          ::-webkit-scrollbar-thumb {
            background: ${darkMode
              ? 'linear-gradient(to bottom, rgb(36, 36, 36), rgb(111, 35, 72))'
              : 'linear-gradient(to bottom, #3b82f6, #06b6d4)'};
            border-radius: 4px;
            transition: background 1s ease;
          }     
          ::-webkit-scrollbar-thumb:hover {
            background: ${darkMode
              ? 'linear-gradient(to bottom, rgb(23, 23, 23), rgb(83, 26, 54))'
              : 'linear-gradient(to bottom, #2563eb, #0891b2)'};
          }
        `}</style>

        {/* Page Content */}
        <div className="relative flex flex-col items-center p-6 transition-all duration-1000 ease-in-out">
          <header className="w-full max-w-3xl flex justify-between items-center py-4 transition-colors duration-1000 ease-in-out">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent transition-colors duration-1000 ease-in-out">
              Scio.ly: {' '}
              {routerData.eventName ? routerData.eventName : 'Loading...'}
            </h1>
            {timeLeft !== null && (
              <div
                className={`text-xl font-semibold transition-colors duration-1000 ease-in-out ${
                  timeLeft <= 300
                    ? 'text-red-600'
                    : darkMode
                    ? 'text-white'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent'
                }`}
              >
                Time Left: {formatTime(timeLeft)}
              </div>
            )}
          </header>

          {/* Smooth Progress Bar */}
          <div
            className={`${
              isSubmitted ? '' : 'sticky top-6'
            } z-10 w-full max-w-3xl bg-white border-2 border-gray-300 rounded-full h-5 mb-6 shadow-lg transition-all duration-1000 ease-in-out`}
          >
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-[width] duration-700 ease-in-out shadow-md"
              style={{ width: `${(Object.keys(userAnswers).length / data.length) * 100}%` }}
            ></div>
          </div>

          <main
            className={`w-full max-w-3xl rounded-lg shadow-md p-6 mt-4 transition-all duration-1000 ease-in-out ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
              </div>
            ) : fetchError ? (
              <div className="text-red-600 text-center">{fetchError}</div>
            ) : routerData.eventName === "Codebusters" && routerData.types === 'multiple-choice' ? (
              <div className="flex flex-col items-center justify-center h-64">
                <p className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  No MCQs available for this event
                </p>
                <p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Please select &quot;MCQ + FRQ&quot; in the dashboard to practice this event
                </p>
              </div>
            ) : (
              <>
                <ul className="space-y-6">
                  {data.map((item, index) => (
                    <li
                      key={index}
                      className={`relative border p-4 rounded-lg shadow-sm transition-all duration-500 ease-in-out ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-50 border-gray-300 text-black'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg transition-colors ease-in-out">
                          Question {index + 1}
                        </h3>
                        <button
                          onClick={() => setReportState({ isOpen: true, questionIndex: index })}
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
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                            <line x1="4" y1="22" x2="4" y2="15" />
                          </svg>
                        </button>
                      </div>
                      <p className="mb-4 transition-colors ease-in-out break-words whitespace-normal overflow-x-auto">
                        {item.question}
                      </p>

                      {/* Answer Inputs */}
                      {item.options && item.options.length > 0 && item.answers.length > 1 ? (
                        <div className="space-y-2">
                          {item.options.map((option, idx) => (
                            <label
                              key={idx}
                              className={`block p-2 rounded-md transition-colors duration-1000 ease-in-out ${
                                darkMode
                                  ? isSubmitted && userAnswers[index]?.[0] === option
                                    ? isCorrect(item, userAnswers[index])
                                      ? 'bg-green-800'
                                      : 'bg-red-900'
                                    : 'bg-gray-700'
                                  : isSubmitted && userAnswers[index]?.[0] === option
                                    ? isCorrect(item, userAnswers[index])
                                      ? 'bg-green-200'
                                      : 'bg-red-200'
                                  : 'bg-gray-200'
                              } ${!isSubmitted && (darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300')}`}
                            >
                              <input
                                type="checkbox"
                                name={`question-${index}`}
                                value={option}
                                onChange={() => handleAnswerChange(index, option, true)}
                                disabled={isSubmitted}
                                checked={userAnswers[index]?.includes(option) || false}
                                className="mr-2"
                              />
                              {option}
                            </label>
                          ))}
                        </div>
                      ) : item.options && item.options.length > 0 ? (
                        <div className="space-y-2">
                          {item.options.map((option, idx) => (
                            <label
                              key={idx}
                              className={`block p-2 rounded-md transition-colors duration-1000 ease-in-out ${
                                darkMode
                                  ? isSubmitted && userAnswers[index]?.[0] === option
                                    ? isCorrect(item, userAnswers[index])
                                      ? 'bg-green-800'
                                      : 'bg-red-900'
                                    : 'bg-gray-700'
                                  : isSubmitted && userAnswers[index]?.[0] === option
                                    ? isCorrect(item, userAnswers[index])
                                      ? 'bg-green-200'
                                      : 'bg-red-200'
                                  : 'bg-gray-200'
                              } ${!isSubmitted && (darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300')}`}
                            >
                              <input
                                type="radio"
                                name={`question-${index}`}
                                value={option}
                                onChange={() => handleAnswerChange(index, option)}
                                disabled={isSubmitted}
                                checked={userAnswers[index]?.[0] === option}
                                className="mr-2"
                              />
                              {option}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          className={`w-full p-2 border rounded-md transition-all duration-1000 ease-in-out ${
                            darkMode
                              ? 'bg-gray-700'
                              : 'bg-white'
                          }`}
                          rows={3}
                          placeholder="Type your answer here (True/False if applicable)"
                          onChange={(e) => handleAnswerChange(index, e.target.value)}
                          disabled={isSubmitted}
                          value={userAnswers[index]?.[0] || ''}
                        />
                      )}

                      {isSubmitted && (
                        <>
                          <p
                            className={`mt-2 font-semibold transition-colors duration-1000 ease-in-out ${
                              !userAnswers[index]?.[0]
                                ? 'text-blue-500'  // Skipped
                                : isCorrect(item, userAnswers[index])
                                  ? 'text-green-600'  // Correct
                                  : 'text-red-600'    // Wrong
                            }`}
                          >
                            {!userAnswers[index]?.[0]
                              ? 'Skipped'
                              : isCorrect(item, userAnswers[index])
                                ? 'Correct!'
                                : 'Wrong!'}
                          </p>
                          <p className={`text-sm mt-1`}>
                            <strong>Correct Answer(s):</strong>{' '}
                            {item.options?.length
                              ? item.answers
                                  .map((ans) => item.options?.[ans as number - 1])
                                  .join(', ')
                              : item.answers.join(', ')}
                          </p>
                          <div className="mt-2">
                            {!explanations[index] ? (
                              <button
                                onClick={() => getExplanation(index, item)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${
                                  darkMode 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-blue-400' 
                                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                                }`}
                                disabled={loadingExplanation[index]}
                              >
                                {loadingExplanation[index] ? (
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
                              <div 
                                className={`text-sm mt-2 p-3 rounded-md ${
                                  darkMode ? 'bg-gray-700' : 'bg-blue-50'
                                }`}
                                dangerouslySetInnerHTML={{ 
                                  __html: `<strong>Explanation:</strong> ${formatExplanationText(explanations[index])}` 
                                }}
                              />
                            )}
                          </div>
                        </>
                      )}
                      <br />
                      {/* Difficulty Bar */}
                      <div className="absolute bottom-2 right-2 w-20 h-2 rounded-full bg-gray-300 transition-all duration-1000 ease-in-out">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-in-out ${
                            item.difficulty >= 0.66
                              ? 'bg-red-500'
                              : item.difficulty >= 0.33
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${item.difficulty * 100}%` }}
                        ></div>
                      </div>
                    </li>
                  ))}
                </ul>

            {/* Submit Button */}
            <div className="mt-6 text-center transition-all duration-1000 ease-in-out">
              {isSubmitted ? (
                <button
                  onClick={handleBackToMain}
                  className={`w-full mt-6 px-4 py-2 font-semibold rounded-lg transition-all duration-1000 transform hover:scale-105 ${
                    darkMode
                      ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  }`}
                  >
                  Return to Dashboard
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className={`w-full mt-6 px-4 py-2 font-semibold rounded-lg transition-all duration-1000 transform hover:scale-105 ${
                    darkMode
                      ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  }`}>
                  Submit Answers
                </button>
              )}
            </div>
          </>
        )}
      </main>
          {/* Back Button (bottom-left) */}
          <button
            onClick={() => router.push('/dashboard')}
            className={`fixed bottom-8 left-8 p-4 rounded-full shadow-lg transition-transform duration-300 hover:scale-110 transition-colors duration-1000 ease-in-out ${
              darkMode
                ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500'
            } text-white`}
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
          {/* Dark Mode Toggle (bottom-right) */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-110 ${
              darkMode ? 'bg-gray-700' : 'bg-white'
            }`}
          >
            {darkMode ? (
              // Sun icon (click to switch to light mode)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l-1.414 1.414M7.05 7.05L5.636 5.636"
                />
              </svg>
            ) : (
              // Moon icon (click to switch to dark mode)
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
      />
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? "dark" : "light"}
      />
    </>
  );
}
