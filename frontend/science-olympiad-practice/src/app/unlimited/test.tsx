'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { updateMetrics } from '@/utils/metrics';
import { auth } from '@/lib/firebase';
import { useTheme } from '@/app/contexts/ThemeContext';
import api from '../api'

interface Question {
  question: string;
  options?: string[];
  // For multiple-choice questions, answers is typically an array of numbers (indexes, starting at 1);
  // for free-response, it may be an array of keywords/strings.
  answers: (number | string)[];
  difficulty: number;
}

interface RouterParams {
  eventName?: string;
  difficulty?: string;
  types?: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

interface ReportState {
  isOpen: boolean;
  questionIndex: number | null;
}

const API_URL = api.api
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
  </div>
);

const ReportModal = ({ isOpen, onClose, onSubmit }: ReportModalProps) => {
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Report Question</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full p-2 border rounded-md mb-4 dark:bg-gray-700 dark:text-white"
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
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const gradeWithGemini = async (userAnswer: string, correctAnswers: (string | number)[], question: string) => {
  if (!userAnswer) return false;

  const prompt = `You are grading a Science Olympiad question.

Question: ${question}
Correct Answer(s): ${correctAnswers.join(', ')}
Student Answer: ${userAnswer}


Grade this response as either CORRECT or INCORRECT. Be lenient - if the student's answer demonstrates understanding of the core concept, mark it as CORRECT even if the wording isn't exact. Consider synonyms and equivalent expressions as correct.

Respond with only a single word: either "CORRECT" or "INCORRECT".`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyAkBDzzh7TQTJzmlLmzC7Yb5ls5SJqe05c`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      return false;
    }

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
    return result === 'CORRECT';
  } catch (error) {
    console.error('Error grading with Gemini:', error);
    return false;
  }
};

export default function UnlimitedPracticePage() {
  const router = useRouter();

  const [data, setData] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  // For the current question, the answer is stored as an array.
  const [currentAnswer, setCurrentAnswer] = useState<(string | null)[]>([]);
  const [routerData, setRouterData] = useState<RouterParams>({});
  const { darkMode, setDarkMode } = useTheme();
  const [reportState, setReportState] = useState<ReportState>({
    isOpen: false,
    questionIndex: null
  });
  const [explanations, setExplanations] = useState<{[key: number]: string}>({});
  const [loadingExplanation, setLoadingExplanation] = useState<{[key: number]: boolean}>({});
  const [lastCallTime, setLastCallTime] = useState<number>(0);
  const RATE_LIMIT_DELAY = 2000;
  const [gradingResults, setGradingResults] = useState<{[key: string]: boolean}>({});

  // Fetch and filter questions on mount
  useEffect(() => {
    const storedParams = localStorage.getItem('testParams');
    if (!storedParams) {
      // Handle the case where params are not in localStorage (e.g., redirect)
      router.push('/');
      return;
    }
  
    const routerParams = JSON.parse(storedParams);
    setRouterData(routerParams);
  
    const difficultyMap: Record<string, number> = {
      easy: 0.33,
      medium: 0.66,
      hard: 1.0,
    };
    const difficultyValue = difficultyMap[routerParams.difficulty || 'easy'] || 0.33;
  
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch data');
        const jsonData = await response.json();
  
        const eventQuestions: Question[] = jsonData[routerParams.eventName as string] || [];
  
        const filteredQuestions = eventQuestions.filter((q) => {
          const questionDifficulty = q.difficulty ?? 0.5;
  
          return routerParams.difficulty === 'any'
            ? true
            : questionDifficulty >= difficultyValue - 0.33 &&
                questionDifficulty <= difficultyValue;
        });
  
        const finalQuestions =
          routerParams.types === 'multiple-choice'
            ? filteredQuestions.filter((q) => q.options && q.options.length > 0)
            : routerParams.types === 'free-response'
            ? filteredQuestions.filter((q) => q.options?.length == 0)
            : filteredQuestions;
  
        const shuffledQuestions = shuffleArray(finalQuestions);
        setData(shuffledQuestions);
      } catch (error) {
        console.error(error);
        setFetchError('Failed to load questions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, [router]); // Dependency array now only contains router.
  // Helper function to shuffle an array
  function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // Grab the current question (if available)
  const currentQuestion = data[currentQuestionIndex];

  // Update the answer for the current question.
  // For checkboxes (multiselect) the answer array is updated;
  // for radio buttons or free-response we simply store a single value.
  const handleAnswerChange = (answer: string | null, multiselect = false) => {
    if (multiselect) {
      setCurrentAnswer((prev) => {
        // Toggle the answer
        if (prev.includes(answer)) {
          return prev.filter((ans) => ans !== answer);
        }
        return [...prev, answer];
      });
    } else {
      setCurrentAnswer([answer]);
    }
  };

  // Mark the current question as submitted
  const handleSubmit = async () => {
    setIsSubmitted(true);
    
    try {
      const isAnswerCorrect = await isCorrect(currentQuestion, currentAnswer);
      setGradingResults(prev => ({...prev, [currentQuestionIndex]: isAnswerCorrect}));
      
      // Only count if there's an actual answer
      const wasAttempted = currentAnswer.length > 0 && currentAnswer[0] !== null && currentAnswer[0] !== '';
      
      await updateMetrics(auth.currentUser?.uid || null, {
        questionsAttempted: wasAttempted ? 1 : 0,
        correctAnswers: wasAttempted && isAnswerCorrect ? 1 : 0,
        eventName: routerData.eventName || undefined
      });
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  };

  // When "Next Question" is clicked, load the next question.
  // If at the end, reshuffle and loop back to the beginning.
  const handleNext = () => {
    let nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= data.length) {
      // Loop around with a reshuffled question order
      const reshuffled = shuffleArray(data);
      setData(reshuffled);
      nextIndex = 0;
    }
    setCurrentQuestionIndex(nextIndex);
    setCurrentAnswer([]);
    setIsSubmitted(false);
  };

  // Check if the current answer is correct.
  // For questions with options, we map the answer indexes (if stored as numbers) to the option text.
  const isCorrect = async (question: Question, answers: (string | null)[]) => {
    if (!question.answers || question.answers.length === 0) return false;

    // When options exist, assume that the answer(s) should match the option text.
    if (question.options && question.options.length > 0) {
      // Convert stored answer indexes (if any) into option text.
      const correctAnswers = question.answers.map((ans) =>
        typeof ans === 'number' ? question.options![ans - 1] : ans
      );
      // Filter out any null values from the user answer.
      const filteredUserAnswers = answers.filter((a) => a !== null);
      if (correctAnswers.length !== filteredUserAnswers.length) return false;
      return correctAnswers.every((a) => filteredUserAnswers.includes(a));
    }

    // For free-response questions, use Gemini
    if (!answers[0]) return false;
    return await gradeWithGemini(answers[0], question.answers, question.question);
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

  const formatExplanationText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  const getExplanation = async (index: number, question: Question) => {
    if (explanations[index]) return;
    
    const now = Date.now();
    if (now - lastCallTime < RATE_LIMIT_DELAY) {
      toast.error('Please wait a moment before requesting another explanation');
      return;
    }
    setLastCallTime(now);
    
    setLoadingExplanation(prev => ({...prev, [index]: true}));
    
    try {
      let correctAnswers = '';
      if (question.options && question.options.length > 0) {
        correctAnswers = question.answers
          .map(ans => question.options![ans as number - 1])
          .filter(Boolean)
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
        `Correct Answer(s): ${correctAnswers}\n\n` +
        `Please explain why this is the correct answer with detailed reasoning, but keep it concise within reason.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyAkBDzzh7TQTJzmlLmzC7Yb5ls5SJqe05c`,
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
              Scio.ly: {routerData.eventName || 'Loading...'}
            </h1>
          </header>

          <main
            className={`w-full max-w-3xl rounded-lg shadow-md p-6 mt-4 transition-all duration-1000 ease-in-out ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            {isLoading ? (
              <LoadingFallback />
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
            ) : !currentQuestion ? (
              <div>No questions available.</div>
            ) : (
              <div className="space-y-6">
                <div
                  className={`relative border p-4 rounded-lg shadow-sm transition-all duration-500 ease-in-out ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-300 text-black'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">Question</h3>
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
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                      </svg>
                    </button>
                  </div>
                  <p className="mb-4 break-words whitespace-normal overflow-x-auto">
                    {currentQuestion.question}
                  </p>

                  {/* Answer Input(s) */}
                  {currentQuestion.options && currentQuestion.options.length > 0 ? (
                    // Use checkboxes if multiple correct answers are allowed…
                    currentQuestion.answers.length > 1 ? (
                      <div className="space-y-2">
                        {currentQuestion.options.map((option, idx) => (
                          <label
                            key={idx}
                            className={`block p-2 rounded-md transition-colors duration-1000 ease-in-out ${
                              darkMode
                                ? isSubmitted && currentAnswer[0] === option
                                  ? gradingResults[currentQuestionIndex] ?? false
                                    ? 'bg-green-800'  // Correct answer in dark mode
                                    : 'bg-red-900'    // Wrong answer in dark mode
                                  : 'bg-gray-700'
                                : isSubmitted && currentAnswer[0] === option
                                  ? gradingResults[currentQuestionIndex] ?? false
                                    ? 'bg-green-200'  // Correct answer in light mode
                                    : 'bg-red-200'    // Wrong answer in light mode
                                  : 'bg-gray-200'
                            } ${!isSubmitted && (darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300')}`}
                          >
                            <input
                              type="checkbox"
                              name={`question-${currentQuestionIndex}`}
                              value={option}
                              onChange={() => handleAnswerChange(option, true)}
                              disabled={isSubmitted}
                              checked={currentAnswer.includes(option)}
                              className="mr-2"
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    ) : (
                      // …otherwise use radio buttons
                      <div className="space-y-2">
                        {currentQuestion.options.map((option, idx) => (
                          <label
                            key={idx}
                            className={`block p-2 rounded-md transition-colors duration-1000 ease-in-out ${
                              darkMode
                                ? isSubmitted && currentAnswer[0] === option
                                  ? gradingResults[currentQuestionIndex] ?? false
                                    ? 'bg-green-800'  // Correct answer in dark mode
                                    : 'bg-red-900'    // Wrong answer in dark mode
                                  : 'bg-gray-700'
                                : isSubmitted && currentAnswer[0] === option
                                  ? gradingResults[currentQuestionIndex] ?? false
                                    ? 'bg-green-200'  // Correct answer in light mode
                                    : 'bg-red-200'    // Wrong answer in light mode
                                  : 'bg-gray-200'
                            } ${!isSubmitted && (darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300')}`}
                          >
                            <input
                              type="radio"
                              name={`question-${currentQuestionIndex}`}
                              value={option}
                              onChange={() => handleAnswerChange(option)}
                              disabled={isSubmitted}
                              checked={currentAnswer[0] === option}
                              className="mr-2"
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    )
                  ) : (
                    // For free-response questions, use a textarea.
                    <textarea
                      className={`w-full p-2 border rounded-md transition-all duration-1000 ease-in-out ${
                        darkMode ? 'bg-gray-700' : 'bg-white'
                      }`}
                      rows={3}
                      placeholder="Type your answer here..."
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      disabled={isSubmitted}
                      value={currentAnswer[0] || ''}
                    />
                  )}

                  {isSubmitted && (
                    <>
                      <p
                        className={`mt-2 font-semibold transition-colors duration-1000 ease-in-out ${
                          !currentAnswer[0] 
                            ? 'text-blue-500'  // Skipped
                            : gradingResults[currentQuestionIndex] ?? false
                              ? 'text-green-600'  // Correct
                              : 'text-red-600'    // Wrong
                        }`}
                      >
                        {!currentAnswer[0] 
                          ? 'Skipped'
                          : gradingResults[currentQuestionIndex] ?? false
                            ? 'Correct!'
                            : 'Wrong!'}
                      </p>
                      <p className="text-sm mt-1">
                        <strong>Correct Answer(s):</strong>{' '}
                        {currentQuestion.options?.length
                          ? currentQuestion.answers.map((ans) => currentQuestion.options?.[ans as number - 1]).join(', ')
                          : currentQuestion.answers.join(', ')}
                      </p>
                      <div className="mt-2">
                        {!explanations[currentQuestionIndex] ? (
                          <button
                            onClick={() => getExplanation(currentQuestionIndex, currentQuestion)}
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
                          <div 
                            className={`text-sm mt-2 p-3 rounded-md ${
                              darkMode ? 'bg-gray-700' : 'bg-blue-50'
                            }`}
                            dangerouslySetInnerHTML={{ 
                              __html: `<strong>Explanation:</strong> ${formatExplanationText(explanations[currentQuestionIndex])}` 
                            }}
                          />
                        )}
                      </div>
                    </>
                  )}
					<br/>	
                  {/* Difficulty Bar */}
                  <div className="absolute bottom-2 right-2 w-20 h-2 rounded-full bg-gray-300 transition-all duration-1000 ease-in-out">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-in-out ${
                        currentQuestion.difficulty >= 0.66
                          ? 'bg-red-500'
                          : currentQuestion.difficulty >= 0.33
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${currentQuestion.difficulty * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-6 text-center">
                  {!isSubmitted ? (
                    <button
                      onClick={handleSubmit}
					  className={`w-full mt-6 px-4 py-2 font-semibold rounded-lg transition-all duration-1000 transform hover:scale-105 ${
						darkMode
						  ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100 text-white'
						  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
					  }`}>
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
					  className={`w-full mt-6 px-4 py-2 font-semibold rounded-lg transition-all duration-1000 transform hover:scale-105 ${
						darkMode
						  ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100 text-white'
						  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
					  }`}>
                      Next Question
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* Back Button (bottom-left) */}
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
