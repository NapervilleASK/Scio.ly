'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import AuthButton from '@/app/components/AuthButton';
import { auth } from '@/lib/firebase';
import { getDailyMetrics } from '@/utils/metrics';
import { useTheme } from '@/app/contexts/ThemeContext';
import { User } from 'firebase/auth';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

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

interface HistoricalMetrics {
  questionsAttempted: number;
  correctAnswers: number;
  eventsPracticed: string[];
}

interface UpdateInfo {
  date: string;
  features: string[];
  comingSoon: string[];
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
          className="fixed inset-0 h-screen bg-black bg-opacity-50 flex items-center justify-center z-50"
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
              </div>
              <div className="flex justify-end space-x-5 mt-6">
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
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const NumberAnimation = ({ value, className }: { value: number; className: string }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

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

const AnimatedAccuracy = ({
  value,
  darkMode,
  className,
}: {
  value: number;
  darkMode: boolean;
  className?: string;
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <text x="50" y="50" className={className} textAnchor="middle" fill={darkMode ? '#fff' : '#000'}>
        {value}%
      </text>
    );
  }

  return (
    <motion.text
      x="50"
      y="50"
      className={className}
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

const WelcomeMessage = ({ darkMode, currentUser }: { darkMode: boolean; currentUser: User | null }) => {
  return (
    <div
      className={`p-6 rounded-lg mb-8 transition-colors duration-1000 ease-in-out ${
        darkMode ? 'bg-gray-800' : 'bg-white/95 shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
      }`}
    >
      <h1
        className={`text-2xl font-bold mb-2 transition-colors duration-1000 ease-in-out ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}
      >
        {currentUser
          ? `Welcome to Scio.ly, ${currentUser.displayName?.split(' ')[0]}!`
          : 'Welcome to Scio.ly!'}
      </h1>
      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Get started by exploring our practice resources or checking your progress.
      </p>
    </div>
  );
};

export default function WelcomePage() {
  const router = useRouter();
  const { darkMode, setDarkMode } = useTheme();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [dailyStats, setDailyStats] = useState({
    questionsAttempted: 0,
    correctAnswers: 0,
    eventsPracticed: [] as string[],
  });
  const [authInitialized, setAuthInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [historyData, setHistoryData] = useState<Record<string, HistoricalMetrics>>({});
  const [showWeekly, setShowWeekly] = useState(false);
  // State for Recent Events tooltip/modal
  const [showEventsTooltip, setShowEventsTooltip] = useState(false);
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [hasSeenUpdate, setHasSeenUpdate] = useState(false);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  // --- New: Compute window width and extra height on mobile ---
  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  const [extraHeight, setExtraHeight] = useState(0);

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowWidth(width);
      let increments = 0;
      if (width < 414) {
        const diff = 414 - width;
        increments += Math.floor(diff / 4);
      }
      if (height < 700) {
        const diff = 700 - extraHeight;
        increments += Math.floor(diff / 22);
      }
      setExtraHeight(increments);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [extraHeight]);
  // ------------------------------------------------------------

  // Compute the minimum height style:
  // - On mobile (width below 414px): baseline 220vw + extra (1vh per 10px below 414px)
  // - Otherwise: fixed 110vh
  const computedMinHeight =
    windowWidth === null || windowWidth < 1000
      ? `calc(190vh + ${extraHeight}vh)`
      : '110vh';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthInitialized(true);
      setCurrentUser(user);
      if (!user) {
        setDailyStats({
          questionsAttempted: 0,
          correctAnswers: 0,
          eventsPracticed: [],
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authInitialized) return;

    const fetchData = async () => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const allDailyStats = userData.dailyStats || {};
          setHistoryData(allDailyStats);
          const todayStats = await getDailyMetrics(currentUser.uid);
          if (todayStats) {
            setDailyStats({
              questionsAttempted: todayStats.questionsAttempted || 0,
              correctAnswers: todayStats.correctAnswers || 0,
              eventsPracticed: todayStats.eventsPracticed || [],
            });
          }
        }
      } else {
        const localStats = await getDailyMetrics(null);
        setDailyStats({
          questionsAttempted: localStats?.questionsAttempted || 0,
          correctAnswers: localStats?.correctAnswers || 0,
          eventsPracticed: localStats?.eventsPracticed || [],
        });
        const today = new Date().toISOString().split('T')[0];
        setHistoryData({
          [today]: localStats || {
            questionsAttempted: 0,
            correctAnswers: 0,
            eventsPracticed: [],
          },
        });
      }
    };

    fetchData();
  }, [authInitialized, currentUser]);

  useEffect(() => {
    const hasSeenUpdateThisSession = sessionStorage.getItem('hasSeenUpdateThisSession');
    setShowUpdatePopup(!hasSeenUpdateThisSession);
    setHasSeenUpdate(!!hasSeenUpdateThisSession);
    setHasCheckedStorage(true);
  }, []);

  const metrics = {
    questionsAttempted: dailyStats.questionsAttempted,
    correctAnswers: dailyStats.correctAnswers,
    eventsPracticed: dailyStats.eventsPracticed.length,
    accuracy:
      dailyStats.questionsAttempted > 0
        ? (dailyStats.correctAnswers / dailyStats.questionsAttempted) * 100
        : 0,
  };

  const generateWeeklyData = (): WeeklyData => {
    const days: DailyData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = historyData[dateStr] || { questionsAttempted: 0 };
      days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: dayData.questionsAttempted || 0,
      });
    }
    return {
      questions: days,
      accuracy: metrics.accuracy,
    };
  };

  const getYAxisScale = () => {
    const weekData = generateWeeklyData().questions;
    const maxValue = Math.max(...weekData.map((day) => day.count), 1);
    const roundedMax = Math.ceil(maxValue / 5) * 5;
    return Array.from({ length: 5 }, (_, i) => Math.round(roundedMax * (1 - i / 4)));
  };

  const calculateWeeklyAccuracy = (): number => {
    const weekData = Object.entries(historyData).sort().slice(-7);
    const totals = weekData.reduce(
      (acc, [, stats]) => ({
        attempted: acc.attempted + (stats.questionsAttempted || 0),
        correct: acc.correct + (stats.correctAnswers || 0),
      }),
      { attempted: 0, correct: 0 }
    );
    return totals.attempted > 0 ? (totals.correct / totals.attempted) * 100 : 0;
  };

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };

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

  const cardStyle =
    darkMode
      ? 'bg-gray-800 transition-all duration-1000 ease-in-out'
      : 'bg-white/95 shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-1000 ease-in-out';

  // Prepare data for the mobile horizontal chart.
  const weekData = generateWeeklyData().questions;
  const maxCount = Math.max(...weekData.map((day) => day.count), 1);

  // Determine if we are on a mobile screen (width 1000 or less)
  const isMobile = windowWidth !== null && windowWidth <= 1000;

  const handleLinkClick = event => {
    localStorage.setItem('eventParams', event); 
    router.push('/dashboard'); // Navigate using router
  };

  const UPDATE_INFO: UpdateInfo = {
    date: "March 2025",
    features: [
      "🔐 SIGN IN TO SAVE YOUR PROGRESS",
      "✨ AI-powered explanations for every question",
      "🎯 Improved question filtering and difficulty system",
      "📊 Weekly progress and performance tracking",
    ],
    comingSoon: [
      "🎯 More practice questions, events, and Div B support",
      "📈 Improved analytics dashboard"
    ]
  };

  const handleCloseUpdatePopup = () => {
    sessionStorage.setItem('hasSeenUpdateThisSession', 'true');
    setShowUpdatePopup(false);
    setHasSeenUpdate(true);
  };

  return (
    <div className="relative w-100 overflow-x-hidden" style={{ minHeight: computedMinHeight }}>
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
      <nav
        className={`fixed top-0 w-screen z-50 transition-all duration-1000 ease-in-out ${
          darkMode ? 'bg-gray-900/90' : 'bg-white/95 shadow-md'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-center h-16 px-4 sm:px-6">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center">
                <Image
                  src="/site-logo.png"
                  alt="Scio.ly Logo"
                  width={32}
                  height={32}
                  className="mr-2"
                />
                <span className={`text-xl font-bold transition-colors duration-1000 ease-in-out ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Scio.ly
                </span>
              </Link>
            </div>
            <div className="flex flex-wrap items-center space-x-4">
              <Link
                href="/dashboard"
                className={`transition-colors duration-1000 ease-in-out px-1 py-1 rounded-md text-sm font-medium ${
                  darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Practice
              </Link>
              <button
                onClick={() => setContactModalOpen(true)}
                className={`transition-colors duration-1000 ease-in-out px-1 py-1 rounded-md text-sm ${
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
      <div className="relative z-10 pt-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <WelcomeMessage darkMode={darkMode} currentUser={currentUser} />

          {/* Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`p-6 rounded-lg ${cardStyle} text-center md:text-left`}>
              <h3 className={`transition-colors duration-1000 ease-in-out text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Questions Attempted
              </h3>
              <NumberAnimation value={metrics.questionsAttempted} className="text-4xl font-bold text-blue-600" />
            </div>
            <div className={`p-6 rounded-lg ${cardStyle} text-center md:text-left`}>
              <h3 className={`transition-colors duration-1000 ease-in-out text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Correct Answers
              </h3>
              <NumberAnimation value={metrics.correctAnswers} className="text-4xl font-bold text-green-600" />
            </div>
            <div
              className={`p-6 rounded-lg ${cardStyle} relative text-center md:text-left`}
              {...(isMobile
                ? { onClick: () => setShowEventsTooltip((prev) => !prev) }
                : { onMouseEnter: () => setShowEventsTooltip(true), onMouseLeave: () => setShowEventsTooltip(false) }
              )}
            >
              <h3 className={`transition-colors duration-1000 ease-in-out text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Events Practiced
              </h3>
              <NumberAnimation value={metrics.eventsPracticed} className="text-4xl font-bold text-purple-600" />
              {/* Up-right arrow icon for mobile */}
              {isMobile && (
                <div className="absolute top-2 right-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </div>
              )}
              {/* Tooltip / Modal for Recent Events */}
              {showEventsTooltip && (
                isMobile ? (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="fixed inset-0 h-screen bg-black bg-opacity-50 flex items-center justify-center z-50"
                      onClick={() => setShowEventsTooltip(false)}
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
                          <h2 className="text-xl font-semibold text-center w-full">&nbsp;&nbsp;&nbsp;Recent Events</h2>
                          <button onClick={() => setShowEventsTooltip(false)} className="text-gray-500 hover:text-gray-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="space-y-2">
                          {dailyStats.eventsPracticed.length > 0 ? (
                            dailyStats.eventsPracticed.map((event, index) => (
                              <div key={index}>
                                <span onClick={() => handleLinkClick(event)} className={`cursor-pointer mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{event}</span>
                              </div>
                            ))
                          ) : (
                            <span className={`block text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              No events practiced yet
                            </span>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div
                    className="absolute left-0 top-[15vh] z-10"
                    onMouseEnter={() => setShowEventsTooltip(true)}
                    onMouseLeave={() => setShowEventsTooltip(false)}
                  >
                    <div className="p-4">
                      <div
                        className={`w-96 p-4 rounded-lg shadow-xl transition-opacity duration-200 pointer-events-auto ${
                          darkMode ? 'bg-gray-800/95 backdrop-blur-sm text-white' : 'bg-white/95 backdrop-blur-sm text-gray-900'
                        }`}
                      >
                        <h4 className="text-base font-semibold">Recent Events </h4>
                        <div className="space-y-2">
                          <div></div>
                          {dailyStats.eventsPracticed.length > 0 ? (
                            dailyStats.eventsPracticed.map((event, index) => (
                              <div key={index}>
                                <span onClick={() => handleLinkClick(event)} className={`cursor-pointer mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{event}</span>
                              </div>
                            ))
                          ) : (
                            <span className={`mt-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              No events practiced yet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Desktop Vertical Chart */}
            <div className={`hidden sm:block p-6 rounded-lg ${cardStyle}`}>
              <h2 className={`transition-colors duration-1000 ease-in-out text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Questions This Week
              </h2>
              <div className="relative h-[200px] flex items-end justify-between px-12">
                {/* Y-axis */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between">
                  {getYAxisScale().map((tick, index) => (
                    <div key={`y-axis-${index}`} className="flex items-center">
                      <span className={`transition-colors duration-1000 ease-in-out text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {tick}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Vertical Bars */}
                {generateWeeklyData().questions.map((day, index) => (
                  <div key={index} className="flex flex-col items-center group">
                    <div className="relative">
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div
                          className={`transition-colors duration-1000 ease-in-out px-2 py-1 rounded text-sm ${
                            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 shadow-lg'
                          }`}
                        >
                          {day.count} questions
                        </div>
                      </div>
                      <div
                        className={`w-12 bg-blue-500 rounded-t-md transition-all duration-300 group-hover:bg-blue-400`}
                        style={{
                          height: `${(day.count / Math.max(getYAxisScale()[0], 1)) * 160}px`,
                        }}
                      />
                    </div>
                    <span className={`transition-colors duration-1000 ease-in-out text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {day.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Horizontal Chart */}
            <div className={`transition-colors duration-1000 ease-in-out block sm:hidden p-6 rounded-lg ${cardStyle} ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <h2 className="text-xl font-semibold mb-4">
                Questions This Week
              </h2>
              <div className="flex flex-col space-y-3">
                {weekData.map((day) => (
                  <div key={day.date} className="flex items-center">
                    <div className="w-16 text-sm">{day.date}</div>
                    <div className="flex-1 bg-gray-200 rounded h-4 relative">
                      <div
                        style={{ width: `${(day.count / maxCount) * 100}%` }}
                        className="bg-blue-500 h-4 rounded"
                      ></div>
                    </div>
                    <div className="w-12 text-right text-sm ml-2">{day.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Half Circle Accuracy Card */}
            <div className="perspective-1000 hover:-translate-y-1 transition-all duration-300">
              <div
                className={`p-6 rounded-lg cursor-pointer transition-all duration-700 transform-style-3d ${
                  showWeekly ? 'rotate-x-180' : ''
                } ${cardStyle}`}
                onClick={() => setShowWeekly(!showWeekly)}
              >
                {/* Front - Daily Accuracy */}
                <div className="backface-hidden w-full">
                  <h2 className={`transition-colors duration-1000 ease-in-out text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Daily Accuracy
                  </h2>
                  <div className="relative flex items-center justify-center h-[200px]">
                    <svg className="w-72 h-36" viewBox="0 0 100 60">
                      <path
                        d="M5 50 A 45 45 0 0 1 95 50"
                        fill="none"
                        stroke={darkMode ? '#374151' : '#e2e8f0'}
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      <motion.path
                        d="M5 50 A 45 45 0 0 1 95 50"
                        fill="none"
                        stroke={darkMode ? '#60a5fa' : '#3b82f6'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: metrics.accuracy / 100 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                      <AnimatedAccuracy
                        value={Math.round(metrics.accuracy)}
                        darkMode={darkMode}
                        className="text-2xl font-bold"
                      />
                    </svg>
                  </div>
                </div>
                {/* Back - Weekly Accuracy */}
                <div className="absolute inset-0 rotate-x-180 backface-hidden w-full p-6">
                  <h2 className={`transition-colors duration-1000 ease-in-out text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Weekly Accuracy
                  </h2>
                  <div className="relative flex items-center justify-center h-[200px]">
                    <svg className="w-72 h-36" viewBox="0 0 100 60">
                      <path
                        d="M5 50 A 45 45 0 0 1 95 50"
                        fill="none"
                        stroke={darkMode ? '#374151' : '#e2e8f0'}
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      <motion.path
                        d="M5 50 A 45 45 0 0 1 95 50"
                        fill="none"
                        stroke={darkMode ? '#60a5fa' : '#3b82f6'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: calculateWeeklyAccuracy() / 100 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                      <AnimatedAccuracy
                        value={Math.round(calculateWeeklyAccuracy())}
                        darkMode={darkMode}
                        className="text-2xl font-bold"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Practice Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => router.push('/dashboard')}
            className={`w-full py-8 px-6 rounded-lg text-white text-left transition-all duration-300 ${
              darkMode
                ? 'bg-gradient-to-r from-violet-900 via-purple-800 to-indigo-900'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-xl font-bold mb-1">Practice</span>
              <span className="text-base opacity-90">
                Start practicing with customized tests or unlimited questions
              </span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <button
        onClick={handleThemeToggle}
        className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg transition-transform duration-1000 hover:scale-110 z-50 ${
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

      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? 'dark' : 'light'}
      />

      <Transition show={hasCheckedStorage && showUpdatePopup && !hasSeenUpdate} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={handleCloseUpdatePopup}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/30" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className={`inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform shadow-xl rounded-2xl ${
                darkMode 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-white text-gray-900'
              }`}>
                <Dialog.Title as="h3" className={`text-2xl font-bold mb-4 bg-gradient-to-r ${
                  darkMode
                    ? 'from-blue-300 via-green-300 to-red-300'
                    : 'from-blue-500 to-cyan-500'
                } bg-clip-text text-transparent`}>
                  What&apos;s New - {UPDATE_INFO.date}
                </Dialog.Title>

                <div className="mt-4">
                  <h4 className="text-lg font-semibold text-blue-500 mb-2">New Features</h4>
                  <ul className="space-y-2 mb-6">
                    {UPDATE_INFO.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <h4 className="text-lg font-semibold text-purple-500 mb-2">Coming Soon</h4>
                  <ul className="space-y-2 mb-6">
                    {UPDATE_INFO.comingSoon.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className={`w-full px-4 py-2 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 ${
                      darkMode
                        ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100 text-white'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    }`}
                    onClick={handleCloseUpdatePopup}
                  >
                    Got it, thanks!
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Add styled scrollbar */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
          ${darkMode
            ? 'background: black;'
            : 'background: white;'
          }
        }

        ::-webkit-scrollbar-thumb {
          background: ${darkMode
            ? 'linear-gradient(to bottom, rgb(36, 36, 36), rgb(111, 35, 72))'
            : 'linear-gradient(to bottom, #3b82f6, #06b6d4)'};
          border-radius: 4px;
          transition: background 1s ease;
        }     
        ::-webkit-scrollbar-thumb:hover {
          background: ${darkMode
            ? 'linear-gradient(to bottom, rgb(23, 23, 23), rgb(83, 26, 54))'
            : 'linear-gradient(to bottom, #2563eb, #0891b2)'};
        }
      `}</style>
      <br />
    </div>
  );
}
