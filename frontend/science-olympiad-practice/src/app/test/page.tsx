'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Question {
  question: string;
  options?: string[];
  answers: (string | number)[];
  difficulty: number;
}

interface RouterParams {
  eventName?: string;
  questionCount?: string;
  difficulty?: string;
  category?: string;
  timeLimit?: string;
}

const API_URL =
  'https://gist.githubusercontent.com/Kudostoy0u/884c863c4d77081fb83f89ca831f1c7f/raw/4c7c815a474127e95d3776a061c076bf7c05bb8c/dataset.json';

export default function TestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Question[]>([]);
  const [routerData, setRouterData] = useState<RouterParams>({});
  const [userAnswers, setUserAnswers] = useState<Record<number, string | null>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

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

        const { eventName, questionCount, difficulty, category } = routerParams;
        const difficultyValue = difficultyMap[difficulty || 'easy'] || 0.33;
        const eventQuestions: Question[] = jsonData[eventName as string] || [];

        const filteredQuestions = eventQuestions.filter(
          (q) =>
            q.difficulty >= difficultyValue - 0.33 && q.difficulty <= difficultyValue
        );

        const finalQuestions =
          category === 'multiple-choice'
            ? filteredQuestions.filter((q) => q.options && q.options.length > 0)
            : filteredQuestions;

        const shuffledQuestions = [...finalQuestions].sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffledQuestions.slice(0, parseInt(questionCount || '0'));

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

  // Countdown Timer Logic
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

  const handleAnswerChange = (questionIndex: number, answer: string | null) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const handleBackToMain = () => {
    router.push('/dashboard'); // Redirect to the main dashboard
  };

  const isCorrect = (question: Question, answer: string | null) => {
    if (!question.answers || question.answers.length === 0) return null;
    if (question.options && question.options.length > 0) {
      return question.answers.includes(question.options.indexOf(answer));
    } else {
      return question.answers.some((keyword: string) =>
        answer?.toLowerCase().includes(keyword.toLowerCase())
      );
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex flex-col items-center p-6">
      {/* Header */}
      <header className="w-full max-w-3xl flex justify-between items-center py-4">
        <h1 className="text-2xl font-extrabold text-blue-600">Quiz Time!</h1>
        {timeLeft !== null && (
          <div className={`text-xl font-semibold ${timeLeft <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
            Time Left: {formatTime(timeLeft)}
          </div>
        )}
      </header>

      {/* Progress Bar */}
      <div
        className={`${
          isSubmitted ? '' : 'sticky top-6'
        } z-10 w-full max-w-3xl bg-gray-200 rounded-full h-4 mb-6 shadow-md transition-all`}
      >
        <div
          className="bg-blue-600 h-4 rounded-full transition-all"
          style={{ width: `${(Object.keys(userAnswers).length / data.length) * 100}%` }}
        ></div>
      </div>

      {/* Content */}
      <main className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6 mt-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
          </div>
        ) : fetchError ? (
          <div className="text-red-600 text-center">{fetchError}</div>
        ) : (
          <>
            {/* Questions */}
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Event: {routerData.eventName || 'N/A'}
            </h2>
            <ul className="space-y-6">
              {data.map((item, index) => (
                <li key={index} className="border p-4 rounded-lg shadow-sm bg-gray-50">
                  <h3 className="font-semibold text-lg text-gray-800">
                    Question {index + 1}
                  </h3>
                  <p className="text-gray-700 mb-4">{item.question}</p>

                  {item.options && item.options.length > 0 ? (
                    <div className="space-y-2">
                      {item.options.map((option, idx) => (
                        <label
                          key={idx}
                          className="block bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                        >
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={option}
                            onChange={() => handleAnswerChange(index, option)}
                            disabled={isSubmitted}
                            checked={userAnswers[index] === option}
                            className="mr-2"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      className="w-full p-2 border rounded-md"
                      rows={3}
                      placeholder="Type your answer here..."
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      disabled={isSubmitted}
                      value={userAnswers[index] || ''}
                    />
                  )}

                  {isSubmitted && (
                    <>
                      <p
                        className={`mt-2 font-semibold ${
                          isCorrect(item, userAnswers[index]) ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isCorrect(item, userAnswers[index]) ? 'Correct!' : 'Wrong!'}
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        <strong>Correct Answer(s):</strong>{' '}
                        {item.options && item.options.length > 0
                          ? item.answers.map((ans: number) => item.options?.[ans]).join(', ')
                          : item.answers.join(', ')}
                      </p>
                    </>
                  )}
                </li>
              ))}
            </ul>

            {/* Submit Button */}
            <div className="mt-6 text-center">
              {isSubmitted ? (
                <button
                  onClick={handleBackToMain}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-green-600 transition"
                >
                  Return to Dashboard
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition"
                >
                  Submit Answers
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
