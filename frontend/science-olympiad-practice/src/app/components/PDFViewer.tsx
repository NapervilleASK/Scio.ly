'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { createPortal } from 'react-dom';

interface PDFViewerProps {
  pdfPath: string;
  buttonText?: string;
  darkMode: boolean;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfPath, buttonText = "Reference Material", darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const openPDF = () => {
    setIsOpen(true);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closePDF = () => {
    setIsOpen(false);
    // Restore body scrolling when modal is closed
    document.body.style.overflow = 'auto';
  };

  const Modal = () => {
    if (!mounted) return null;
    
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={closePDF}>
        <div 
          className="relative w-11/12 h-5/6 max-w-5xl bg-white rounded-lg shadow-2xl flex flex-col" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`flex justify-between items-center p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-blue-100 text-gray-800'} rounded-t-lg`}>
            <h3 className="text-lg font-semibold">Reference Material</h3>
            <button
              onClick={closePDF}
              className={`p-2 rounded-full hover:bg-opacity-20 ${darkMode ? 'hover:bg-white text-white' : 'hover:bg-gray-500 text-gray-700'}`}
              aria-label="Close"
            >
              <FaTimes size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden bg-white">
            <iframe
              src={`${pdfPath}#view=FitH`}
              className="w-full h-full border-none"
              title="PDF Viewer"
            />
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <button
        onClick={openPDF}
        className={`${ buttonText == "Rulebook" ? (darkMode
          ? 'text-gray-300 hover:text-white' 
          : 'text-gray-700 hover:text-gray-900'
        ) : 'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 hover:scale-105'} ${
          buttonText == "Rulebook"
          ? 'transition-colors duration-1000 ease-in-out px-1 py-1 rounded-md text-sm font-medium '
          :
          darkMode
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {buttonText}
      </button>

      {isOpen && <Modal />}
    </>
  );
};

export default PDFViewer; 