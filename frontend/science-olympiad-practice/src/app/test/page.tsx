'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react'; // Import Suspense

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
  'https://gist.githubusercontent.com/Kudostoy0u/0425d9f138c2f6a6cff9e99d965a5655/raw/c5339585f1fe124f8a54918b82aad29f59ed961b/final.json';

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
  </div>
);

// Create a separate SuspenseWrapper component
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
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

        const filteredQuestions = eventQuestions.filter(
          (q) =>
            difficulty == 'any' ? true : (q.difficulty >= difficultyValue - 0.33 && q.difficulty <= difficultyValue)
        );

        const finalQuestions =
          types === 'multiple-choice'
            ? filteredQuestions.filter((q) => q.options && q.options.length > 0)
            : filteredQuestions;

            function shuffleArray<T>(array: T[]): T[] {
              const newArray = [...array]; // Create a copy to avoid modifying the original
              for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Swap elements
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
    if (timeLeft === null || isSubmitted) return;

    if (timeLeft === 0) {
      setIsSubmitted(true);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const handleAnswerChange = (questionIndex: number, answer: string | null, multiselect = false) => {
    setUserAnswers((prev) => {
      const currentAnswers = prev[questionIndex] || [];
      if (multiselect) {
        const updatedAnswers = currentAnswers.includes(answer)
          ? currentAnswers.filter((ans) => ans !== answer)
          : [...currentAnswers, answer];
        return {
          ...prev,
          [questionIndex]: updatedAnswers,
        };
      }
      return {
        ...prev,
        [questionIndex]: [answer],
      };
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

    // For free-response questions (FRQs)
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
    <SuspenseWrapper> {/* Wrap the entire TestPage with SuspenseWrapper */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex flex-col items-center p-6">
        <header className="w-full max-w-3xl flex justify-between items-center py-4">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Science Olympiad: {routerData.eventName ? routerData.eventName : 'Loading...'}</h1>
          {timeLeft !== null && (
            <div className={`text-xl font-semibold ${timeLeft <= 300 ? 'text-red-600' : 'bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent'}`}>
              Time Left: {formatTime(timeLeft)}
            </div>
          )}
        </header>

        {/* Smooth Progress Bar */}
        <div
          className={`${
            isSubmitted ? '' : 'sticky top-6'
          } z-10 w-full max-w-3xl bg-white border-2 border-gray-300 rounded-full h-5 mb-6 shadow-lg`}
        >
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-[width] duration-700 ease-in-out shadow-md"
            style={{ width: `${(Object.keys(userAnswers).length / data.length) * 100}%` }}
          ></div>
        </div>

        <main className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6 mt-4">
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
                  <li key={index} className="relative border p-4 rounded-lg shadow-sm bg-gray-50">
                    <h3 className="font-semibold text-lg text-gray-800">Question {index + 1}</h3>
                    <p className="text-gray-700 mb-4">{item.question}</p>

                    {/* Answer Inputs */}
                    {item.options && item.options.length > 0 && item.answers.length > 1 ? (
                      <div className="space-y-2">
                        {item.options.map((option, idx) => (
                          <label
                            key={idx}
                            className="block bg-gray-200 p-2 rounded-md hover:bg-gray-300 text-black"
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
                            className="block bg-gray-200 p-2 rounded-md hover:bg-gray-300 text-black"
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
                        className="w-full p-2 border rounded-md text-black"
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
                          className={`mt-2 font-semibold ${
                            isCorrect(item, userAnswers[index]) ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isCorrect(item, userAnswers[index]) ? 'Correct!' : 'Wrong!'}
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          <strong>Correct Answer(s):</strong>{' '}
                          {item.options?.length
                            ? item.answers
                                .map((ans) => item.options?.[ans as number - 1])
                                .join(', ')
                            : item.answers.join(', ')}
                        </p>
                      </>
                    )}
                    <br/>
                    {/* Difficulty Bar */}
                    <div className="absolute bottom-2 right-2 w-20 h-2 rounded-full bg-gray-300">
                      <div
                        className={`h-full rounded-full transition-all ${
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
    </SuspenseWrapper>
  );
}