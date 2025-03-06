'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/contexts/ThemeContext';
import Header from '@/app/components/Header';
import Image from 'next/image';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

interface ContactFormData {
  name: string;
  email: string;
  topic: string;
  message: string;
}

// Contact Modal Component
const ContactModal = ({ isOpen, onClose, onSubmit, darkMode }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContactFormData) => void;
  darkMode: boolean;
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    topic: 'suggestion',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', email: '', topic: 'suggestion', message: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`rounded-lg p-6 w-[600px] max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Contact Us</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mb-4 text-sm">
            Contact us about anything: suggestions, bugs, assistance, and more!
          </p>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name (will not be shown publicly)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full p-2 rounded-md ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  } border`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email (will not be shown publicly)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full p-2 rounded-md ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  } border`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Topic</label>
                <select
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className={`w-full p-2 rounded-md ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  } border`}
                >
                  <option value="suggestion">Suggestion</option>
                  <option value="bug">Website Bug</option>
                  <option value="question">Question</option>
                  <option value="mistake">Mistake in Question</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className={`w-full p-2 rounded-md ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  } border`}
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 rounded-md ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
                >
                  Submit
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function AboutPage() {
  const { darkMode, setDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [showMascotCaption, setShowMascotCaption] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleContact = async (data: ContactFormData) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        setContactModalOpen(false);
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
    }
  };

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };

  const toggleMascotCaption = () => {
    // Only toggle if on mobile
    if (isMobile) {
      setShowMascotCaption(!showMascotCaption);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
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

      {/* Stars Background (only in dark mode) */}
      <div className={`absolute inset-0 z-0 ${darkMode ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}>
        <Canvas>
          <Stars radius={50} count={1500} factor={4} fade speed={1} />
        </Canvas>
      </div>

      <Header />
      
      {/* Contact Modal */}
      <ContactModal 
        isOpen={contactModalOpen} 
        onClose={() => setContactModalOpen(false)} 
        onSubmit={handleContact}
        darkMode={darkMode}
      />

      {/* Main Content */}
      <main className="relative z-10 pt-36 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className={`text-4xl md:text-5xl font-bold mb-6 transition-colors duration-1000 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            About Scio.ly
          </h1>
          <p className={`text-xl max-w-3xl mx-auto transition-colors duration-1000 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            We&apos;re on a mission to make Science Olympiad practice accessible, engaging, and effective for students everywhere.
          </p>
        </motion.div>

        {/* Our Story Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className={`mb-20 p-8 rounded-xl transition-colors duration-1000 ${
            darkMode ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white/90 shadow-lg backdrop-blur-sm'
          }`}
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h2 className={`text-3xl font-bold mb-6 transition-colors duration-1000 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Our Story
              </h2>
              <div className={`space-y-4 transition-colors duration-1000 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>
                  Scio.ly was born from a simple observation: Science Olympiad students needed better resources to practice and prepare for competitions.
                </p>
                <p>
                  As Science Olympiad participants ourselves, we understood the challenges of finding quality practice materials and the importance of consistent preparation.
                </p>
                <p>
                  We built Scio.ly to be the platform we wished we had during our Science Olympiad journey - comprehensive, accessible, and designed specifically for Science Olympiad events.
                </p>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center items-center">
              <div 
                className="relative w-80 h-80 rounded-2xl overflow-hidden group cursor-pointer"
                onClick={toggleMascotCaption}
              >
                <Image
                  src="/ASK.png"
                  alt="ASK - Science Olympiad mascot"
                  fill
                  style={{ objectFit: 'cover', objectPosition: 'center 70%' }}
                  className={`rounded-2xl transition-transform duration-300 ${
                    isMobile && showMascotCaption 
                      ? 'scale-105' 
                      : 'group-hover:scale-105'
                  }`}
                />
                <div className={`absolute inset-0 bg-black transition-all duration-300 flex items-end justify-center rounded-2xl ${
                  isMobile && showMascotCaption 
                    ? 'bg-opacity-40' 
                    : 'bg-opacity-0 group-hover:bg-opacity-40'
                }`}>
                  <div className={`text-white text-center p-4 transition-transform duration-300 ${
                    isMobile && showMascotCaption 
                      ? 'translate-y-0' 
                      : 'translate-y-full group-hover:translate-y-0'
                  }`}>
                    <p className="font-bold text-lg">Hylas the Cat</p>
                    <p>Our coolest mascot</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Our Mission Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className={`mb-20 p-8 rounded-xl transition-colors duration-1000 ${
            darkMode ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white/90 shadow-lg backdrop-blur-sm'
          }`}
        >
          <h2 className={`text-3xl font-bold mb-6 text-center transition-colors duration-1000 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Our Mission
          </h2>
          <div className="max-w-3xl mx-auto">
            <p className={`text-center text-lg mb-8 transition-colors duration-1000 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              We&apos;re dedicated to empowering Science Olympiad students with the tools and resources they need to excel.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-4 rounded-lg text-center transition-colors duration-1000 ${
                darkMode ? 'bg-gray-800/50' : 'bg-white/80'
              }`}>
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <h3 className={`text-lg font-semibold mb-2 transition-colors duration-1000 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Quality Content
                </h3>
                <p className={`transition-colors duration-1000 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Creating accurate, event-specific practice materials that align with competition standards.
                </p>
              </div>
              <div className={`p-4 rounded-lg text-center transition-colors duration-1000 ${
                darkMode ? 'bg-gray-800/50' : 'bg-white/80'
              }`}>
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-purple-900/50' : 'bg-purple-100'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${darkMode ? 'text-purple-300' : 'text-purple-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                </div>
                <h3 className={`text-lg font-semibold mb-2 transition-colors duration-1000 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Accessibility
                </h3>
                <p className={`transition-colors duration-1000 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Making Science Olympiad preparation easy and available for all students.
                </p>
              </div>
              <div className={`p-4 rounded-lg text-center transition-colors duration-1000 ${
                darkMode ? 'bg-gray-800/50' : 'bg-white/80'
              }`}>
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-cyan-900/50' : 'bg-cyan-100'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${darkMode ? 'text-cyan-300' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <h3 className={`text-lg font-semibold mb-2 transition-colors duration-1000 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Innovation
                </h3>
                <p className={`transition-colors duration-1000 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Continuously improving our platform with new features and technologies to enhance learning.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Contact CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className={`mb-20 p-8 rounded-xl text-center transition-colors duration-1000 ${
            darkMode ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white/90 shadow-lg backdrop-blur-sm'
          }`}
        >
          <h2 className={`text-2xl font-bold mb-4 transition-colors duration-1000 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Want to get in touch?
          </h2>
          <p className={`mb-6 max-w-2xl mx-auto transition-colors duration-1000 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            We&apos;d love to hear from you! Whether you have questions, feedback, or just want to say hello, our team is here to help.
          </p>
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
              darkMode 
                ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100 text-white shadow-lg hover:shadow-regalblue-100/20' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-blue-500/20'
            }`}
            onClick={() => setContactModalOpen(true)}
          >
            Contact Us
          </button>
        </motion.section>
      </main>

      {/* Dark Mode Toggle */}
      <button
        onClick={handleThemeToggle}
        className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-110 z-50 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="4" fill="currentColor"/>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636"
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
  );
} 