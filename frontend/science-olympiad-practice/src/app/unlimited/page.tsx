'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';

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
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      return storedTheme === 'dark';
    }
    return true;
  });

  // Update localStorage when darkMode changes
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }
  }, [darkMode]);

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

        const filteredQuestions = eventQuestions.filter((q) =>
          routerParams.difficulty === 'any'
            ? true
            : q.difficulty >= difficultyValue - 0.33 && q.difficulty <= difficultyValue
        );

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
  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  // When “Next Question” is clicked, load the next question.
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
                  <h3 className="font-semibold text-lg">Question</h3>
                  <p className="mb-4">{currentQuestion.question}</p>

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

          {/* Dark/Light Toggle Button (bottom-right) */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="fixed bottom-8 right-8 p-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-110 transition-colors duration-1000 ease-in-out"
          >
            {darkMode ? (
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 1112 3v0a9 9 0 008.354 12.354z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </SuspenseWrapper>
  );
}
