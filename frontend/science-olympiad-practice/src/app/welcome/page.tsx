'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import Link from 'next/link';
import { toast } from 'react-toastify';
import AuthButton from '@/components/AuthButton';
import { auth } from '@/lib/firebase';
import { getDailyMetrics } from '@/utils/metrics';
import { useTheme } from '@/contexts/ThemeContext';
import { User } from 'firebase/auth';
import Image from 'next/image';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContactFormData) => void;
  darkMode: boolean;
}

interface ContactFormData {
  name: string;
  email: string;
  topic: string;
  message: string;
}

interface DailyData {
  date: string;
  count: number;
}

interface WeeklyData {
  questions: DailyData[];
  accuracy: number;
}

const ContactModal = ({ isOpen, onClose, onSubmit, darkMode }: ContactModalProps) => {
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

  return (
    <AnimatePresence>
      {isOpen && (
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
                      darkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
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
                      darkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
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
                      darkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
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
                      darkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    } border`}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 rounded-md ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-gray-200 hover:bg-gray-300'
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
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const NumberAnimation = ({ value, className }: { value: number, className: string }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [displayValue, setDisplayValue] = useState(value); // Initialize with the final value

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    let start = 0;
    const end = value;
    const duration = 1000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, isMounted]);

  return <span className={className}>{displayValue}</span>;
};

// Create a client component for the animated accuracy display
const AnimatedAccuracy = ({ value, darkMode }: { value: number, darkMode: boolean }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <text
        x="50"
        y="50"
        className="text-3xl font-bold"
        textAnchor="middle"
        fill={darkMode ? '#fff' : '#000'}
      >
        {value}%
      </text>
    );
  }

  return (
    <motion.text
      x="50"
      y="50"
      className="text-3xl font-bold"
      textAnchor="middle"
      fill={darkMode ? '#fff' : '#000'}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      {value}%
    </motion.text>
  );
};

export default function WelcomePage() {
  const router = useRouter();
  const { darkMode, setDarkMode } = useTheme();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [dailyStats, setDailyStats] = useState({
    questionsAttempted: 0,
    correctAnswers: 0,
    eventsPracticed: [] as string[]
  });
  const [authInitialized, setAuthInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Handle auth state and reset stats on sign out
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthInitialized(true);
      setCurrentUser(user);
      
      // Reset stats if user signs out
      if (!user) {
        setDailyStats({
          questionsAttempted: 0,
          correctAnswers: 0,
          eventsPracticed: []
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch daily metrics when auth state changes
  useEffect(() => {
    if (!authInitialized) return;

    const fetchDailyStats = async () => {
      if (currentUser) {
        const stats = await getDailyMetrics(currentUser.uid);
        if (stats) {
          setDailyStats({
            questionsAttempted: stats.questionsAttempted || 0,
            correctAnswers: stats.correctAnswers || 0,
            eventsPracticed: stats.eventsPracticed || []
          });
        }
      }
    };

    fetchDailyStats();
    const interval = setInterval(fetchDailyStats, 60000);
    return () => clearInterval(interval);
  }, [authInitialized, currentUser]); // Added currentUser as dependency

  // Calculate metrics from daily stats
  const metrics = {
    questionsAttempted: dailyStats.questionsAttempted,
    correctAnswers: dailyStats.correctAnswers,
    eventsPracticed: dailyStats.eventsPracticed.length,
    accuracy: dailyStats.questionsAttempted > 0 
      ? (dailyStats.correctAnswers / dailyStats.questionsAttempted) * 100 
      : 0
  };

  // Generate weekly data from daily stats
  const generateWeeklyData = (): WeeklyData => {
    const days: DailyData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: i === 0 ? dailyStats.questionsAttempted : 0 // Only show today's questions
      });
    }
    return {
      questions: days,
      accuracy: metrics.accuracy
    };
  };

  // Helper to get y-axis scale
  const getYAxisScale = (maxValue: number) => {
    const steps = 5;
    const max = Math.max(maxValue, 1);
    return Array.from({ length: steps }, (_, i) => Math.round(max * (1 - i / (steps - 1))));
  };

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };

  const handleContact = async (data: ContactFormData) => {
    const webhookUrl = "https://discord.com/api/webhooks/1339791675018576024/M9vqEh3Zw67jhoaZ20hA6yFLADRiXEpCvPNOpMgy5iaao_DkNaGm4NpPtE00SGjybAPc";
    
    const payload = {
      embeds: [{
        title: "📬 New Contact Form Submission",
        description: data.message,
        color: 0x3498db,
        fields: [
          {
            name: "📋 Topic",
            value: data.topic,
            inline: true
          },
          {
            name: " Name",
            value: data.name,
            inline: true
          },
          {
            name: "📧 Email",
            value: data.email,
            inline: true
          },
          {
            name: "💻 Device Info",
            value: `Platform: ${navigator.platform}\nScreen: ${window.innerWidth}x${window.innerHeight}`,
            inline: true
          }
        ],
        footer: {
          text: "Scio.ly Contact System"
        },
        timestamp: new Date().toISOString()
      }]
    };

    const toastId = toast.loading('Sending message...');

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast.update(toastId, {
        render: 'Message sent successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.update(toastId, {
        render: 'Failed to send message. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  const cardStyle = darkMode 
    ? 'bg-gray-800/50 transition-all duration-1000 ease-in-out' 
    : 'bg-white/95 shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-1000 ease-in-out';

  return (
    <div className="relative min-h-screen">
      {/* Background Layers */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          darkMode ? 'opacity-100' : 'opacity-0'
        } bg-gradient-to-br from-regalblue-100 to-regalred-100`}
      ></div>
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          darkMode ? 'opacity-0' : 'opacity-100'
        } bg-gradient-to-br from-blue-50 via-white to-cyan-50`}
      ></div>

      {/* Stars Background */}
      <div className="absolute inset-0 z-0">
        <Canvas>
          <Stars radius={50} count={1500} factor={4} fade speed={1} />
        </Canvas>
      </div>

      {/* Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-1000 ease-in-out ${
        darkMode ? 'bg-gray-900/90' : 'bg-white/95 shadow-md'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-16 px-6">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center">
                <Image
                  src="/site-logo.png"
                  alt="Scio.ly Logo"
                  width={32}
                  height={32}
                  className="mr-2"
                />
                <span className={`text-xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Scio.ly
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium ${
                darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
              }`}>
                Practice
              </Link>
              <button
                onClick={() => setContactModalOpen(true)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Contact Us
              </button>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 pt-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <div className={`p-6 rounded-lg mb-8 ${cardStyle}`}>
            <h1 className={`text-2xl font-bold mb-2 transition-colors duration-1000 ease-in-out ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome to Scio.ly!
            </h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Get started by exploring our practice resources or checking your progress.
            </p>
          </div>

          {/* Metrics Section */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className={`p-6 rounded-lg ${cardStyle}`}>
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Questions Attempted</h3>
              <NumberAnimation 
                value={metrics.questionsAttempted} 
                className="text-4xl font-bold text-blue-600"
              />
            </div>
            <div className={`p-6 rounded-lg ${cardStyle}`}>
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Correct Answers</h3>
              <NumberAnimation 
                value={metrics.correctAnswers} 
                className="text-4xl font-bold text-green-600"
              />
            </div>
            <div className={`p-6 rounded-lg ${cardStyle}`}>
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Events Practiced</h3>
              <NumberAnimation 
                value={metrics.eventsPracticed} 
                className="text-4xl font-bold text-purple-600"
              />
            </div>
          </div>

          {/* Recent Activity - New Layout */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Left side - Questions Line Graph */}
            <div className={`p-6 rounded-lg ${cardStyle}`}>
              <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Questions This Week
              </h2>
              <div className="relative h-[200px] flex items-end justify-between px-12">
                {/* Y-axis */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between">
                  {getYAxisScale(metrics.questionsAttempted).map((tick, index) => (
                    <div key={`y-axis-${index}`} className="flex items-center">
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {tick}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bars */}
                {generateWeeklyData().questions.map((day, index) => (
                  <div key={index} className="flex flex-col items-center group">
                    <div className="relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className={`px-2 py-1 rounded text-sm ${
                          darkMode 
                            ? 'bg-gray-800 text-white' 
                            : 'bg-white text-gray-900 shadow-lg'
                        }`}>
                          {day.count} questions
                        </div>
                      </div>
                      
                      {/* Bar */}
                      <div 
                        className={`w-12 bg-blue-500 rounded-t-md transition-all duration-300 group-hover:bg-blue-400`}
                        style={{ 
                          height: `${(day.count / Math.max(getYAxisScale(metrics.questionsAttempted)[0], 1)) * 150}px` 
                        }}
                      />
                    </div>
                    <span className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {day.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - Half Circle Accuracy */}
            {metrics.questionsAttempted > 0 ? (
              <div className={`p-6 rounded-lg ${cardStyle}`}>
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Accuracy Today
                </h2>
                <div className="relative flex items-center justify-center h-[200px]">
                  <svg className="w-72 h-36" viewBox="0 0 100 60">
                    {/* Background arc */}
                    <path
                      d="M5 50 A 45 45 0 0 1 95 50"
                      fill="none"
                      stroke={darkMode ? '#1e293b' : '#e2e8f0'}
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    {/* Progress arc with animation */}
                    <motion.path
                      d="M5 50 A 45 45 0 0 1 95 50"
                      fill="none"
                      stroke={darkMode ? '#60a5fa' : '#3b82f6'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: metrics.accuracy / 100 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                    <AnimatedAccuracy 
                      value={Math.round(metrics.accuracy)} 
                      darkMode={darkMode}
                    />
                  </svg>
                </div>
              </div>
            ) : (
              <div className={`p-6 rounded-lg ${cardStyle}`}>
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Start practicing to see your accuracy!
                </h2>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-lg cursor-pointer transition-all duration-1000 ease-in-out ${
                darkMode 
                  ? 'bg-gray-800/50 hover:bg-gray-700/50' 
                  : 'bg-white/95 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.15)]'
              }`}
              onClick={() => router.push('/dashboard')}
            >
              <h3 className={`text-lg font-semibold mb-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Generate Test
              </h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Create a customized test with specific parameters
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-lg cursor-pointer transition-all duration-1000 ease-in-out ${
                darkMode 
                  ? 'bg-gray-800/50 hover:bg-gray-700/50' 
                  : 'bg-white/95 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.15)]'
              }`}
              onClick={() => router.push('/dashboard')}
            >
              <h3 className={`text-lg font-semibold mb-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Unlimited Practice
              </h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Practice continuously with instant feedback
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <button
        onClick={handleThemeToggle}
        className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-110 z-50 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {darkMode ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l-1.414 1.414M7.05 7.05L5.636 5.636"
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

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        onSubmit={handleContact}
        darkMode={darkMode}
      />
    </div>
  );
} 