"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/contexts/ThemeContext';
import AuthButton from '@/app/components/AuthButton';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { usePathname } from 'next/navigation';

interface ContactFormData {
  name: string;
  email: string;
  topic: string;
  message: string;
}
// const PDFViewer = dynamic(() => import('@/app/components/PDFViewer'), {
//   ssr: false,
//   loading: () => (
//     <div className="flex items-center justify-center h-96">
//       <div className="animate-pulse">Loading PDF viewer...</div>
//     </div>
//   ),
// });

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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`rounded-lg p-6 w-[90%] sm:w-[600px] max-h-[90vh] overflow-y-auto mx-4 ${
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

export default function Header() {
  const { darkMode } = useTheme();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Determine if we're on the homepage
  const isHomePage = pathname === '/';
  
  // Handle scroll events to change header appearance
  const handleScroll = () => {
    if (window.scrollY > 300) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };
  
  useEffect(() => {
    setMounted(true);
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Initial check for scroll position
    handleScroll();
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
   
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // The header should be transparent only on homepage when not scrolled
  // For /welcome page, it should always be opaque
  const shouldBeTransparent = isHomePage && !scrolled && mounted;
  
  // Set background classes based on page and scroll state
  const navBgClass = shouldBeTransparent 
    ? 'bg-transparent' 
    : darkMode 
      ? 'bg-gray-900/95 backdrop-blur-sm shadow-md' 
      : 'bg-white/95 backdrop-blur-sm shadow-md';
  
  // Set text colors based on transparency and theme
  const textColorClass = darkMode 
    ? 'text-white' 
    : 'text-gray-900';
  
  const linkColorClass = darkMode
    ? 'text-gray-300 hover:text-white' 
    : 'text-gray-700 hover:text-gray-900';
  
  const handleContact = async (data: ContactFormData) => {
    const webhookUrl =
      'https://discord.com/api/webhooks/1339791675018576024/M9vqEh3Zw67jhoaZ20hA6yFLADRiXEpCvPNOpMgy5iaao_DkNaGm4NpPtE00SGjybAPc';
    const payload = {
      embeds: [
        {
          title: '📬 New Contact Form Submission',
          description: data.message,
          color: 0x3498db,
          fields: [
            {
              name: '📋 Topic',
              value: data.topic,
              inline: true,
            },
            {
              name: ' Name',
              value: data.name,
              inline: true,
            },
            {
              name: '📧 Email',
              value: data.email,
              inline: true,
            },
            {
              name: '💻 Device Info',
              value: `Platform: ${navigator.platform}\nScreen: ${window.innerWidth}x${window.innerHeight}`,
              inline: true,
            },
          ],
          footer: {
            text: 'Scio.ly Contact System',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const toastId = toast.loading('Sending message...');

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast.update(toastId, {
        render: 'Message sent successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.update(toastId, {
        render: 'Failed to send message. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  return (
    <>
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        onSubmit={handleContact}
        darkMode={darkMode}
      />
      <ToastContainer theme={darkMode || shouldBeTransparent ? "dark" : "light"} />

      <nav className={`fixed top-0 w-screen z-50 transition-all duration-1000 ease-in-out ${navBgClass}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-16 px-4 sm:px-6">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center">
                <Image
                  src="/site-logo.png"
                  alt="Scio.ly Logo"
                  width={32}
                  height={32}
                  className="mr-2"
                />
                <span className={`text-xl font-bold transition-colors duration-1000 ease-in-out hidden sm:inline ${textColorClass}`}>
                  Scio.ly
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/dashboard"
                className={`transition-colors duration-1000 ease-in-out px-1 py-1 rounded-md text-sm font-medium ${linkColorClass}`}
              >
                Dashboard
              </Link>
              <Link
                href="/practice"
                className={`transition-colors duration-1000 ease-in-out px-1 py-1 rounded-md text-sm font-medium ${linkColorClass}`}
              >
                Practice
              </Link>
              <button
                onClick={() => setContactModalOpen(true)}
                className={`transition-colors duration-1000 ease-in-out px-1 py-1 rounded-md text-sm font-medium ${linkColorClass}`}
              >
                Contact
              </button>
              <Link
                href="/about"
                className={`transition-colors duration-1000 ease-in-out px-1 py-1 rounded-md text-sm font-medium ${linkColorClass}`}
              >
                About Us
              </Link>
              <AuthButton />
            </div>
            
            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center space-x-4" ref={dropdownRef}>
              <div className="relative">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`flex items-center transition-colors duration-1000 ease-in-out px-1 py-1 rounded-md text-sm font-medium ${linkColorClass}`}
                >
                  Menu
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-4 w-4 ml-1 transition-transform duration-300 ${mobileMenuOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <AnimatePresence>
                  {mobileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      }`}
                    >
                      <Link
                        href="/welcome"
                        className={`block px-4 py-2 text-sm ${
                          darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard"
                        className={`block px-4 py-2 text-sm ${
                          darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Practice
                      </Link>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setContactModalOpen(true);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Contact
                      </button>
                      <Link
                        href="/about"
                        className={`block px-4 py-2 text-sm ${
                          darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        About Us
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
