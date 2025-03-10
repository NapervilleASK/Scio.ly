'use client';

import React, { useState, useEffect } from 'react';
import { toast, } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Question {
  question: string;
  options?: string[];
  answers: (number | string)[];
  difficulty: number;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, action: 'remove' | 'edit', editedQuestion?: string, originalQuestion?: string) => void;
  darkMode: boolean;
  question?: Question;
  event: string;
}

const ReportModal = ({ isOpen, onClose, onSubmit, darkMode, question, event }: ReportModalProps) => {
  const [reason, setReason] = useState('');
  const [action, setAction] = useState<'remove' | 'edit'>('remove');
  const [editedQuestion, setEditedQuestion] = useState('');
  const [editedOptions, setEditedOptions] = useState<string[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);
  const [frqAnswer, setFrqAnswer] = useState('');
  const [difficulty, setDifficulty] = useState(0.5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFRQ, setIsFRQ] = useState(false);

  useEffect(() => {
    if (question) {
      if (isOpen) {
        setEditedQuestion(question.question);
        
        // Determine if this is a free response question (no options)
        const hasMCQOptions = question.options && question.options.length > 0;
        setIsFRQ(!hasMCQOptions);
        
        if (hasMCQOptions) {
          // Handle MCQ
          setEditedOptions(question.options || []);
          const answers = question.options 
            ? question.answers.map(a => typeof a === 'string' ? parseInt(a) : a)
            : [];
          setCorrectAnswers(answers);
        } else {
          // Handle FRQ
          const answer = Array.isArray(question.answers) && question.answers.length > 0
            ? typeof question.answers[0] === 'string' 
              ? question.answers[0]
              : String(question.answers[0])
            : '';
          setFrqAnswer(answer);
        }
        
        setDifficulty(question.difficulty || 0.5);
      } else {
        resetForm();
      }
    }
  }, [question, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (action === 'edit') {
        const editedQuestionData = {
          originalQuestion: question?.question,
          originalQuestionFull: question,
          editedQuestion: {
            question: editedQuestion,
            options: isFRQ ? undefined : editedOptions.length > 0 ? editedOptions : undefined,
            answers: isFRQ ? [frqAnswer] : editedOptions.length > 0 ? correctAnswers : [editedQuestion],
            difficulty: difficulty
          },
          event: event,
          reason: reason
        };

        // Log the edited question data to verify it contains the difficulty value
        console.log('Sending edited question data:', editedQuestionData);

        // Instead of making the API call directly, pass the data to the parent component
        
        resetForm();
        onClose();
        
        toast.success('Edit submitted for review.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: darkMode ? "dark" : "light"
        });
        onSubmit(
          reason, 
          action, 
          JSON.stringify(editedQuestionData.editedQuestion),
          JSON.stringify(question)
        );
      } else {
        // For remove action, just pass the data to the parent component
        
        resetForm();
        onClose();
        onSubmit(reason, action);
        
        toast.success('Report submitted for review.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: darkMode ? "dark" : "light"
        });
      }
    } catch (error) {
      console.error('Error processing report:', error);
      toast.error('Failed to process report. Please try again.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: darkMode ? "dark" : "light"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setReason('');
    setAction('remove');
    setEditedQuestion('');
    setEditedOptions([]);
    setCorrectAnswers([]);
    setFrqAnswer('');
    setDifficulty(0.5);
    setIsProcessing(false);
    setIsFRQ(false);
  };

  const addOption = () => {
    const originalOptionsLength = question?.options?.length || 0;
    if (editedOptions.length < originalOptionsLength) {
      setEditedOptions([...editedOptions, '']);
    } else {
      toast.warning(`Cannot add more than ${originalOptionsLength} options`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: darkMode ? "dark" : "light"
      });
    }
  };

  const removeOption = (index: number) => {
    const newOptions = editedOptions.filter((_, i) => i !== index);
    setEditedOptions(newOptions);
    // Update correct answers to remove any that reference the removed option
    setCorrectAnswers(correctAnswers.filter(ans => ans !== index + 1));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...editedOptions];
    newOptions[index] = value;
    setEditedOptions(newOptions);
  };

  const toggleCorrectAnswer = (index: number) => {
    const answerIndex = index + 1; // 1-based indexing
    if (correctAnswers.includes(answerIndex)) {
      setCorrectAnswers(correctAnswers.filter(a => a !== answerIndex));
    } else {
      setCorrectAnswers([...correctAnswers, answerIndex].sort((a, b) => a - b));
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div 
          className={`rounded-lg p-6 w-[90%] sm:w-[800px] max-h-[90vh] overflow-y-auto mx-4 transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Report Question</h3>
            <button 
              onClick={handleClose} 
              className={`text-gray-500 hover:${darkMode ? 'text-gray-300' : 'text-gray-700'} transition-colors`}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Action</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="remove"
                    checked={action === 'remove'}
                    onChange={() => setAction('remove')}
                    className="mr-2"
                  />
                  Remove Question
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="edit"
                    checked={action === 'edit'}
                    onChange={() => setAction('edit')}
                    className="mr-2"
                  />
                  Edit Question
                </label>
              </div>
            </div>

            {action === 'edit' && (
              <div className="mb-4 space-y-4">
                <div>
                  <label className="block mb-2 font-medium">Edit Question</label>
                  <textarea
                    className={`w-full p-2 border rounded-md mb-2 transition-colors duration-300 ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500' 
                        : 'bg-white text-gray-900 border-gray-300 focus:border-blue-400'
                    }`}
                    rows={4}
                    placeholder="Enter your edited version of the question..."
                    value={editedQuestion}
                    onChange={(e) => setEditedQuestion(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">Difficulty</label>
                  <div className="flex items-center">
                    <span className="text-sm w-10">Easy</span>
                    <div className="relative w-48 mx-2 h-6">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={difficulty}
                        onChange={(e) => setDifficulty(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, 
                            ${difficulty < 0.3 ? 'rgb(34, 197, 94)' : difficulty < 0.7 ? 'rgb(234, 179, 8)' : 'rgb(239, 68, 68)'} 0%, 
                            ${difficulty < 0.3 ? 'rgb(34, 197, 94)' : difficulty < 0.7 ? 'rgb(234, 179, 8)' : 'rgb(239, 68, 68)'} ${difficulty * 100}%, 
                            rgb(209, 213, 219) ${difficulty * 100}%, 
                            rgb(209, 213, 219) 100%)`
                        }}
                      />
                    </div>
                    <span className="text-sm w-10">Hard</span>
                    <div className="ml-2">
                      <div className={`w-16 text-center px-2 py-1 rounded text-xs ${
                        difficulty < 0.3 
                          ? darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                          : difficulty < 0.7 
                            ? darkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                            : darkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'
                      }`}>
                        {difficulty < 0.3 ? 'Easy' : difficulty < 0.7 ? 'Medium' : 'Hard'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditional rendering based on question type */}
                {isFRQ ? (
                  // Free Response Question Answer
                  <div>
                    <label className="block mb-2 font-medium">Correct Answer</label>
                    <textarea
                      className={`w-full p-2 border rounded-md transition-colors duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500' 
                          : 'bg-white text-gray-900 border-gray-300 focus:border-blue-400'
                      }`}
                      rows={3}
                      placeholder="Enter the correct answer for this free response question..."
                      value={frqAnswer}
                      onChange={(e) => setFrqAnswer(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  // Multiple Choice Question Options
                  <div>
                    <label className="block mb-2 font-medium">Answer Options</label>
                    <div className="space-y-2">
                      {editedOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={correctAnswers.includes(index + 1)}
                            onChange={() => toggleCorrectAnswer(index)}
                            className="mr-2"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            className={`flex-1 p-2 border rounded-md transition-colors duration-300 ${
                              darkMode 
                                ? 'bg-gray-700 text-white border-gray-600' 
                                : 'bg-white text-gray-900 border-gray-300'
                            }`}
                            placeholder={`Option ${index + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addOption}
                      className={`mt-2 px-3 py-1 rounded-md text-sm ${
                        darkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      + Add Option
                    </button>
                    {editedOptions.length > 0 && (
                      <p className="mt-2 text-sm text-gray-500">
                        Check the boxes next to the correct answer(s)
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <textarea
              className={`w-full p-2 border rounded-md mb-4 transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500' 
                  : 'bg-white text-gray-900 border-gray-300 focus:border-blue-400'
              }`}
              rows={4}
              placeholder={action === 'remove' 
                ? "Please describe why this question should be removed..." 
                : "Please explain your changes to the question..."}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleClose}
                className={`px-4 py-2 rounded-md transition-colors duration-300 ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors duration-300 flex items-center space-x-2"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Submit {action === 'remove' ? 'Report' : 'Edit'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export type { Question, ReportModalProps };
export default ReportModal; 