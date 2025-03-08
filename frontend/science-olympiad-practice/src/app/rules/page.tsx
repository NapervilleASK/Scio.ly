'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
import Header from '@/app/components/Header';
import dynamic from 'next/dynamic';

// Dynamically import the existing PDFViewer component
const PDFViewer = dynamic(() => import('@/app/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="animate-pulse">Loading PDF viewer...</div>
    </div>
  ),
});

export default function RulesPage() {
  const { darkMode } = useTheme();

  return (
    <div className="relative min-h-screen">
      {/* Background Layers */}
      <div
        className={`fixed inset-0 transition-opacity duration-1000 ${
          darkMode ? 'opacity-100' : 'opacity-0'
        } bg-gradient-to-br from-regalblue-100 to-regalred-100`}
      ></div>
      <div
        className={`fixed inset-0 transition-opacity duration-1000 ${
          darkMode ? 'opacity-0' : 'opacity-100'
        } bg-gradient-to-br from-blue-50 via-white to-cyan-50`}
      ></div>

      <Header />

      <main className="relative z-10 pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16">
        <div className={`mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <h1 className="text-4xl font-bold mb-4">Science Olympiad Rules</h1>
          <p className="text-lg opacity-80">Official rules and guidelines for all events</p>
        </div>

        <PDFViewer 
          pdfPath="/scioly-rules.pdf"
          buttonText="View Rules"
          darkMode={darkMode}
        />
      </main>

      <style jsx global>{`
        /* Scrollbar Styles */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-thumb {
          background: ${darkMode
            ? 'linear-gradient(to bottom, rgb(36, 36, 36), rgb(111, 35, 72))'
            : 'linear-gradient(to bottom, #3b82f6, #0ea5e9)'};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${darkMode
            ? 'linear-gradient(to bottom, rgb(23, 23, 23), rgb(83, 26, 54))'
            : 'linear-gradient(to bottom, #2563eb, #0284c7)'};
        }
        ::-webkit-scrollbar-track {
          background: ${darkMode ? 'black' : '#f1f5f9'};
        }
      `}</style>
    </div>
  );
} 