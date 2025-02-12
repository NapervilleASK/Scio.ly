'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

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

const API_URL =
  'https://gist.githubusercontent.com/Kudostoy0u/e746d029254e1badf037fbde946774d8/raw/f3a486db241eeba30e9d611986934b8d605513f8/final.json';

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
  </div>
);

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
);

export default function TestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Question[]>([]);
  const [routerData, setRouterData] = useState<RouterParams>({});
  const [userAnswers, setUserAnswers] = useState<Record<number, (string | null)[] | null>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'light') {
        return false;
      }
    }
    return true; // Default to dark mode
  });
  const difficultyMap: Record<string, number> = {
    easy: 0.33,
    medium: 0.66,
    hard: 1.0,
  };

  useEffect(() => {
    const routerParams = Object.fromEntries(searchParams.entries()) as RouterParams;
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

        const filteredQuestions = eventQuestions.filter((q) =>
          difficulty === 'any'
            ? true
            : q.difficulty >= difficultyValue - 0.33 && q.difficulty <= difficultyValue
        );

        const finalQuestions =
          types === 'multiple-choice'
            ? filteredQuestions.filter((q) => q.options && q.options.length > 0)
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
        const selectedQuestions = shuffledQuestions.slice(0, parseInt(questionCount || '0'));
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
  }, [searchParams]);
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }
  }, [darkMode]);

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

  const handleSubmit = () => {
    setIsSubmitted(true);
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
                      <h3 className="font-semibold text-lg transition-colors ease-in-out">
                        Question {index + 1}
                      </h3>
                      <p className="mb-4 transition-colors ease-in-out">
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
                                  ? 'bg-gray-700 hover:bg-gray-600'
                                  : 'bg-gray-200 hover:bg-gray-300'
                              }`}
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
                                  ? 'bg-gray-700 hover:bg-gray-600'
                                  : 'bg-gray-200 hover:bg-gray-300'
                              }`}
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
                              isCorrect(item, userAnswers[index])
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {isCorrect(item, userAnswers[index]) ? 'Correct!' : 'Wrong!'}
                          </p>
                          <p className={`text-sm mt-1`}>
                            <strong>Correct Answer(s):</strong>{' '}
                            {item.options?.length
                              ? item.answers
                                  .map((ans) => item.options?.[ans as number - 1])
                                  .join(', ')
                              : item.answers.join(', ')}
                          </p>
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
          {/* Dark/Light Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="fixed bottom-8 right-8 p-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-110 transition-colors duration-1000 ease-in-out"
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
    </SuspenseWrapper>
  );
}
