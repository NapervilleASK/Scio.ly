'use client';

import { useState } from 'react';

const sampleQuestions = [
  {
    id: 1,
    question: "What is the chemical formula for water?",
    answer: "H2O",
  },
  {
    id: 2,
    question: "What is the speed of light in a vacuum (m/s)?",
    answer: "299792458",
  },
  {
    id: 3,
    question: "Who developed the theory of relativity?",
    answer: "Einstein",
  },
];

function ProblemsPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  const currentQuestion = sampleQuestions[currentQuestionIndex];

  const handleCheckAnswer = () => {
    if (userAnswer.trim().toLowerCase() === currentQuestion.answer.toLowerCase()) {
      setFeedback("Correct! 🎉");
    } else {
      setFeedback(`Incorrect. The correct answer is ${currentQuestion.answer}.`);
    }
  };

  const handleNextQuestion = () => {
    setFeedback("");
    setUserAnswer("");
    setCurrentQuestionIndex((prevIndex) => (prevIndex + 1) % sampleQuestions.length);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">Interactive Problems</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{currentQuestion.question}</h2>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-lg mb-4"
          placeholder="Enter your answer"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
        />
        <button
          onClick={handleCheckAnswer}
          className="w-full py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition mb-2"
        >
          Check Answer
        </button>
        {feedback && <p className="text-center mt-4">{feedback}</p>}
      </div>
      <button
        onClick={handleNextQuestion}
        className="mt-6 px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
      >
        Next Question
      </button>
    </div>
  );
}

export default ProblemsPage;