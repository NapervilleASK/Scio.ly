'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

interface Question {
  question: string;
  options?: string[];
  answers: (number | string)[];
  difficulty: number;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, action: 'remove' | 'edit', editedQuestion?: string) => void;
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
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (question) {
      if (isOpen) {
        setEditedQuestion(question.question);
        setEditedOptions(question.options || []);
        const answers = question.options 
          ? question.answers.map(a => typeof a === 'string' ? parseInt(a) : a)
          : [];
        setCorrectAnswers(answers);
      } else {
        resetForm();
      }
    }
  }, [question, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      let response;
      if (action === 'edit') {
        const editedQuestionData = {
          originalQuestion: question?.question,
          editedQuestion: {
            question: editedQuestion,
            options: editedOptions.length > 0 ? editedOptions : undefined,
            answers: editedOptions.length > 0 ? correctAnswers : [editedQuestion],
            difficulty: question?.difficulty || 0.5
          },
          event: event,
          reason: reason
        };

        response = await fetch('/api/report/edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editedQuestionData)
        });

        const data = await response.json();
      
        if (data.success) {
          onSubmit(reason, action, JSON.stringify(editedQuestionData.editedQuestion));
          toast.success('Edit request approved by AI. Changes will be reviewed.', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: darkMode ? "dark" : "light"
          });
          // Close and reset after showing toast
          resetForm();
          onClose();
        } else {
          toast.error(data.message || 'AI rejected the edit. Please revise and try again.', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: darkMode ? "dark" : "light"
          });
        }
      } else {
        response = await fetch('/api/report/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: question?.question,
            event: event,
            reason: reason
          })
        });

        const data = await response.json();
      
        if (data.success) {
          onSubmit(reason, action);
          toast.success('Remove request approved by AI. Question will be reviewed.', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: darkMode ? "dark" : "light"
          });
          // Close and reset after showing toast
          resetForm();
          onClose();
        } else {
          toast.error(data.message || 'AI rejected the removal. Please provide more details.', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: darkMode ? "dark" : "light"
          });
        }
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`rounded-lg p-6 w-[800px] max-w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          <h3 className="text-lg font-semibold mb-4">Report Question</h3>
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
                  <label className="block mb-2 font-medium">Original Question</label>
                  <div className={`p-3 rounded-md mb-3 transition-colors duration-300 ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                  }`}>
                    {question?.question}
                  </div>
                  
                  <label className="block mb-2 font-medium">Edited Question</label>
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
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? "dark" : "light"}
      />
    </>
  );
};

export type { Question, ReportModalProps };
export default ReportModal; 