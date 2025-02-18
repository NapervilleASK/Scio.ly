'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { updateMetrics } from '@/utils/metrics';
import { auth } from '@/lib/firebase';
import { useTheme } from '@/contexts/ThemeContext';

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

const API_URL =
  'https://gist.githubusercontent.com/Kudostoy0u/31a422ee7cc029570e81a450ee4673cc/raw/9e1062fb980b51611ff5ff8760b4aeff2fba475b/final.json';

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
  </div>
);

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
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

export default function UnlimitedPracticePage() {
  const searchParams = useSearchParams();
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

  // Fetch and filter questions on mount
  useEffect(() => {
    const routerParams = Object.fromEntries(searchParams.entries()) as RouterParams;
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

        // Use the event name from the query params (if provided) or default to an empty array
        const eventQuestions: Question[] = jsonData[routerParams.eventName as string] || [];

        const filteredQuestions = eventQuestions.filter((q) => {
          // Set default difficulty to 0.5 if not specified
          const questionDifficulty = q.difficulty ?? 0.5;
          
          return routerParams.difficulty === 'any'
            ? true
            : questionDifficulty >= difficultyValue - 0.33 && questionDifficulty <= difficultyValue;
        });

        const finalQuestions =
          routerParams.types === 'multiple-choice'
            ? filteredQuestions.filter((q) => q.options && q.options.length > 0)
            : filteredQuestions;

        // Shuffle the questions
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
  }, [searchParams]);

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
    
    // Only count if there's an actual answer
    const wasAttempted = currentAnswer.length > 0 && currentAnswer[0] !== null && currentAnswer[0] !== '';
    
    try {
      await updateMetrics(auth.currentUser?.uid || null, {
        questionsAttempted: wasAttempted ? 1 : 0,
        correctAnswers: wasAttempted && isCorrect(currentQuestion, currentAnswer) ? 1 : 0,
        eventName: routerData.eventName || undefined
      });

      if (isCorrect(currentQuestion, currentAnswer)) {
        toast.success('Correct!');
      } else if (wasAttempted) {
        toast.error('Incorrect. :(');
      } else {
        toast.info('Question skipped');
      }
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
  const isCorrect = (question: Question, answers: (string | null)[]) => {
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

    // For free-response questions, check if the user answer (in lower case)
    // contains any of the provided keywords.
    if (!answers[0]) return false;
    const userAnswer = answers[0].toLowerCase();
    const keywords = question.answers.map((ans) =>
      typeof ans === 'string' ? ans.toLowerCase() : ''
    );
    return keywords.some((keyword) => userAnswer.includes(keyword));
  };

  const handleReport = async (reason: string) => {
    if (reportState.questionIndex === null) return;
    
    const questionData = data[reportState.questionIndex];
    const webhookUrl = "https://discord.com/api/webhooks/1339786241742344363/x2BYAebIvT34tovkpQV5Nq93GTEisQ78asFivqQApS0Q9xPmSeC6o_3CrKs1MWbRKhGh";

    if (!webhookUrl) {
      toast.error('Report system not configured properly');
      return;
    }

    const payload = {
      embeds: [{
        title: "Question Report (Unlimited Mode)",
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

    const toastId = toast.loading('Sending report...');

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to send report');
      }

      toast.update(toastId, {
        render: 'Report sent successfully!',
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

  return (
    <SuspenseWrapper>
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
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-200 hover:bg-gray-300'
                            }`}
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
                            className={`block p-2 rounded-md transition-colors duration-500 ease-in-out ${
                              darkMode
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-200 hover:bg-gray-300'
                            }`}
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
                          isCorrect(currentQuestion, currentAnswer)
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {isCorrect(currentQuestion, currentAnswer)
                          ? 'Correct!'
                          : 'Wrong!'}
                      </p>
                      <p className={`text-sm mt-1 transition-colors duration-1000 ease-in-out ${
						darkMode ? 'text-white' : 'text-gray-600'
					  }`}>
                        <strong>Correct Answer(s):</strong>{' '}
                        {currentQuestion.options && currentQuestion.options.length > 0
                          ? currentQuestion.answers
                              .map((ans) =>
                                typeof ans === 'number'
                                  ? currentQuestion.options![ans - 1]
                                  : ans
                              )
                              .join(', ')
                          : currentQuestion.answers.join(', ')}
                      </p>
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
    </SuspenseWrapper>
  );
}
