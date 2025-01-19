// src/pages/test.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface Question {
  question: string;
  options: string[];
  answers: number[];
  difficulty: number;
}

function TestPage() {
  const searchParams = useSearchParams();
  const eventName = searchParams.get('eventName'); // Retrieve eventName from query parameter
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!eventName) return;

    // Fetch questions from the public JSON file
    fetch('/questions.json')
      .then((res) => res.json())
      .then((data: Record<string, Question[]>) => {
        // Find the matching category in the JSON file based on the eventName
        const categoryQuestions = data[eventName];
        if (categoryQuestions) {
          setQuestions(categoryQuestions);
        } else {
          console.warn(`No questions found for event: ${eventName}`);
        }
      })
      .catch((error) => {
        console.error('Error fetching questions:', error);
      })
      .finally(() => setLoading(false));
  }, [eventName]);

  if (!eventName) {
    return <div>Error: No event selected.</div>;
  }

  if (loading) {
    return <div>Loading questions...</div>;
  }

  if (questions.length === 0) {
    return <div>No questions found for the selected event.</div>;
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 p-6">
      <h1 className="text-4xl font-bold mb-6">
        {eventName.charAt(0).toUpperCase() + eventName.slice(1)} - Test Page
      </h1>
      <h2 className="text-lg font-semibold mb-4">Questions:</h2>
      <ul className="space-y-6 w-full max-w-3xl">
        {questions.map((q, index) => (
          <li
            key={index}
            className="p-4 border border-gray-200 rounded-lg shadow-md bg-white"
          >
            <h3 className="font-medium">{`${index + 1}. ${q.question}`}</h3>
            <ul className="mt-2 space-y-1">
              {q.options.map((option, optIndex) => (
                <li key={optIndex} className="ml-4 list-disc">
                  {option}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TestPage;
