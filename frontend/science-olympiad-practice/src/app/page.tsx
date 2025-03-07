"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {FaBook, FaRobot, FaChartPie, FaDiscord, FaGithub } from "react-icons/fa";
import { Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  useMotionTemplate,
  useMotionValue,
  animate,
} from "framer-motion";
import { useEffect, useRef } from "react";
import { FiArrowRight } from "react-icons/fi";
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import Image from 'next/image';
import { useTheme } from './contexts/ThemeContext';
import { Suspense } from "react";
import { Float, Points } from "@react-three/drei";

const COLORS_TOP = ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"];

export default function HomePage() {
  const { darkMode, setDarkMode } = useTheme();
  const color = useMotionValue(COLORS_TOP[0]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const controls = animate(color, COLORS_TOP, {
      ease: "easeInOut",
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });

    return () => {
      controls.stop();
    };
  }, [color]);

  // Effect to handle theme changes and reset button styles
  useEffect(() => {
    if (!darkMode && buttonRef.current) {
      // Force reset any lingering styles when in light mode
      const button = buttonRef.current;
      button.style.boxShadow = '';
      button.style.border = '';
    }
  }, [darkMode]);

  useEffect(() => {
    // Apply scrollbar styles based on theme
    document.documentElement.classList.toggle('dark-scrollbar', darkMode);
    document.documentElement.classList.toggle('light-scrollbar', !darkMode);
  }, [darkMode]);

  const backgroundImage = useMotionTemplate`radial-gradient(132% 132% at 50% 10%, rgba(2, 6, 23, 0.8) 50%, ${color})`;
  const border = useMotionTemplate`1px solid ${color}`;
  const boxShadow = useMotionTemplate`0px 4px 24px ${color}`;
  const mainFeatures = [
    {
      icon: <FaBook className="w-8 h-8" />,
      title: "Comprehensive Coverage",
      description: "Over 3000 questions across 24 Division C events, with Division B support coming soon"
    },
    {
      icon: <FaRobot className="w-8 h-8" />,
      title: "AI Explanations",
      description: "Get instant, detailed explanations for every question using our advanced AI system"
    },
    {
      icon: <FaChartPie className="w-8 h-8" />,
      title: "Smart Features",
      description: "Track progress, share tests, and contest answers - all in one platform"
    }
  ];

  const metrics = [
    { number: "4.3K", label: "Practice tests scraped" },
    { number: "38.4K+", label: "Questions solved" },
    { number: "22.9K", label: "Page views" }
  ];

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`relative ${darkMode ? 'bg-[#020617]' : 'bg-white'} transition-colors duration-300`}>
      <Header />
      {/* Updated Hero Section */}
      <section className="min-h-screen relative overflow-hidden">
        {darkMode && (
          <motion.div
            style={{ backgroundImage }}
            className="absolute inset-0 z-10"
          />
        )}
        
        {darkMode && (
          <div className="absolute inset-0 z-0">
            <Canvas>
              <Stars radius={42} count={2500} factor={4} fade speed={1} />
            </Canvas>
          </div>
        )}
        
        {!darkMode && (
          <>
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-100 to-white"></div>
            <div className="absolute inset-0 z-5 opacity-20">
              <Canvas>
                <ambientLight intensity={0.1} />
                <directionalLight position={[0, 10, 5]} intensity={0.3} />
                <Suspense fallback={null}>
                  <Float
                    speed={2}
                    rotationIntensity={0.5}
                    floatIntensity={1}
                  >
                    <Points count={800} size={0.6}>
                      <pointsMaterial color="#4299e1" />
                    </Points>
                  </Float>
                </Suspense>
              </Canvas>
            </div>
            <div 
              className="absolute inset-0 z-1 pointer-events-none static-gradient"
            ></div>
          </>
        )}

        <div className="relative z-20 h-screen flex items-center justify-center">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-7xl font-bold mb-6 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}
            >
              Scio.ly
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`text-xl mb-8 max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Over 3000 Science Olympiad tests into one website, designed for the ultimate studying experience.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link href="/welcome">
                <motion.button
                  ref={buttonRef}
                  style={darkMode ? { border, boxShadow } : {}}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className={`group relative flex mx-auto items-center gap-1.5 rounded-full px-6 py-3 transition-all ${
                    darkMode 
                      ? 'bg-gray-950/10 text-gray-50 hover:bg-gray-950/50' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg light-button-halo'
                  }`}
                >
                  Start Practicing
                  <FiArrowRight className="transition-transform group-hover:-rotate-45 group-active:-rotate-12" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className={`min-h-screen py-20 px-4 ${darkMode ? '' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Master Science Olympiad Events
          </h2>
          <p className={`mb-12 max-w-2xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Stop wasting time searching for practice materials. Scio.ly provides a comprehensive, organized platform
            carefully designed and crafted for Science Olympiad students – available to everyone, for free. 
          </p>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {mainFeatures.map((feature, index) => (
              <div key={index} 
                className={`rounded-xl p-6 border transform transition-all duration-300 hover:scale-[1.02] ${
                  darkMode 
                    ? 'bg-gray-900/50 border-gray-800 hover:border-blue-500/30' 
                    : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm hover:shadow'
                }`}
              >
                <div className={`mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{feature.icon}</div>
                <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Event Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className={darkMode ? 'bg-green-500/10 rounded-lg p-4' : 'bg-green-50 rounded-lg p-4 border border-green-100'}>
              <h4 className={darkMode ? 'text-green-400 font-semibold mb-2' : 'text-green-700 font-semibold mb-2'}>Life Science</h4>
              <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>• Anatomy & Physiology</li>
                <li>• Microbe Mission</li>
                <li>• Disease Detectives</li>
              </ul>
            </div>
            <div className={darkMode ? 'bg-purple-500/10 rounded-lg p-4' : 'bg-purple-50 rounded-lg p-4 border border-purple-100'}>
              <h4 className={darkMode ? 'text-purple-400 font-semibold mb-2' : 'text-purple-700 font-semibold mb-2'}>Earth & Space</h4>
              <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>• Astronomy</li>
                <li>• Dynamic Planet</li>
                <li>• Fossils</li>
              </ul>
            </div>
            <div className={darkMode ? 'bg-blue-500/10 rounded-lg p-4' : 'bg-blue-50 rounded-lg p-4 border border-blue-100'}>
              <h4 className={darkMode ? 'text-blue-400 font-semibold mb-2' : 'text-blue-700 font-semibold mb-2'}>Physical Science</h4>
              <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>• Wind Power</li>
                <li>• Optics</li>
                <li>• Chemistry Lab</li>
              </ul>
            </div>
            <div className={darkMode ? 'bg-red-500/10 rounded-lg p-4' : 'bg-red-50 rounded-lg p-4 border border-red-100'}>
              <h4 className={darkMode ? 'text-red-400 font-semibold mb-2' : 'text-red-700 font-semibold mb-2'}>New and FRQ-based</h4>
              <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>• Codebusters</li>
                <li>• Entomology</li>
                <li>• Geologic Mapping</li>
              </ul>
            </div>
          </div>

          {/* Coming Soon Banner */}
          <div className={`rounded-xl p-6 border ${
            darkMode 
              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30' 
              : 'bg-gradient-to-r from-blue-100 to-purple-100 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Division B Support Coming Soon!</h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  We&apos;re expanding our platform to support middle school Science Olympiad events.
                  Stay tuned for updates!
                </p>
              </div>
              <div className="hidden md:block">
                <span className="text-5xl">🚀</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Preview Section */}
      <section className={`py-20 px-4 ${darkMode ? 'bg-gray-900/30' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="inline-block bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm mb-4">
                Test Features
              </div>
              <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Everything You Need</h2>
              <p className="text-gray-400 mb-6">
                Practice smarter with our comprehensive testing platform:
              </p>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Share tests with teammates using unique codes
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Contest answers and get Gemini 2.0 explanations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Adaptive difficulty ratings
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Both MCQ and free response support
                </li>
              </ul>
            </div>
            <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-lg'} rounded-xl p-6 border overflow-hidden`}>
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} font-mono`}>Test Code:</span>
                    <span className={`${darkMode ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-100 text-blue-600'} px-3 py-1 rounded font-mono`}>ABC123</span>
                  </div>
                  <span className={`${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'} px-2 py-1 rounded text-xs uppercase tracking-wider`}>
                    Shared
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/90 shadow-sm border border-gray-200'}`}>
                    <div className={`mb-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Questions</div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>15</div>
                  </div>
                  <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/90 shadow-sm border border-gray-200'}`}>
                    <div className={`mb-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Time Limit</div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>25:00</div>
                  </div>
                  <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/90 shadow-sm border border-gray-200'}`}>
                    <div className={`mb-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Difficulty</div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Mixed</div>
                  </div>
                  <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/90 shadow-sm border border-gray-200'}`}>
                    <div className={`mb-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Event</div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Astronomy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Section */}
      <section className={`py-20 px-4 ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-blue-500/10 to-blue-600/20'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className={`inline-block px-3 py-1 rounded-full text-sm mb-4 ${darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-600 text-white'}`}>
                Practice Your Way
              </div>
              <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Multiple Study Modes</h2>
              <p className={darkMode ? 'text-gray-400 mb-6' : 'text-gray-700 mb-6'}>
                Choose how you want to practice:
              </p>
              <ul className={`space-y-4 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                <li className="flex items-start gap-3">
                  <span className={`${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-600 text-white'} h-6 w-6 rounded-full flex items-center justify-center text-sm mt-1`}>→</span>
                  <div>
                    <strong className={darkMode ? 'text-white' : 'text-gray-900'}>Timed Tests</strong>
                    <p>Simulate competition conditions with customizable timed tests</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className={`${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-600 text-white'} h-6 w-6 rounded-full flex items-center justify-center text-sm mt-1`}>→</span>
                  <div>
                    <strong className={darkMode ? 'text-white' : 'text-gray-900'}>Unlimited Practice</strong>
                    <p>Practice endlessly with our question bank, filtered by difficulty</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className={`${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-600 text-white'} h-6 w-6 rounded-full flex items-center justify-center text-sm mt-1`}>→</span>
                  <div>
                    <strong className={darkMode ? 'text-white' : 'text-gray-900'}>Shared Tests</strong>
                    <p>Take tests shared by teammates or create your own to share</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className={`rounded-xl p-6 border h-full ${
              darkMode 
                ? 'bg-gray-900 border-gray-800' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="flex flex-col h-full space-y-4">
                <div className={`p-6 rounded-lg flex-1 ${
                  darkMode ? 'bg-blue-500/10' : 'bg-blue-50 border border-blue-100'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={darkMode ? 'text-blue-400 text-xl font-semibold' : 'text-blue-700 text-xl font-semibold'}>Timed Test</h3>
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className={darkMode ? 'text-gray-400 text-lg' : 'text-gray-600 text-lg'}>15 Questions</span>
                    <span className={`text-2xl font-mono ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>25:00</span>
                  </div>
                </div>
                <div className={`p-6 rounded-lg flex-1 ${
                  darkMode ? 'bg-purple-500/10' : 'bg-purple-50 border border-purple-100'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={darkMode ? 'text-purple-400 text-xl font-semibold' : 'text-purple-700 text-xl font-semibold'}>Unlimited</h3>
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className={darkMode ? 'text-gray-400 text-lg' : 'text-gray-600 text-lg'}>No Limits</span>
                    <span className={`text-2xl font-mono ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>∞</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className={`py-20 px-4 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800/80' 
          : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className={`text-3xl font-bold mb-12 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Trusted by students across the U.S.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {metrics.map((metric, index) => (
              <div key={index} className="p-6">
                <div className={`text-4xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{metric.number}</div>
                <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{metric.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-center gap-4">
            <a href="https://github.com/NapervilleASK/Scio.ly" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
              <FaGithub className="w-6 h-6" />
            </a>
            <a href="https://discord.gg/hXSkrD33gu" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
              <FaDiscord className="w-6 h-6" />
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={`py-20 px-4 ${
        darkMode 
          ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900' 
          : 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500'
      }`}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Time to get practicing.
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto text-white/90">
            Join hundreds of students improving their scores with our comprehensive platform.
          </p>
          <Link 
            href="/dashboard" 
            className={`inline-block px-8 py-4 rounded-lg text-lg font-medium transition-all transform hover:scale-105 ${
              darkMode 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-blue-500/20' 
                : 'bg-white text-blue-600 shadow-lg hover:shadow-white/30'
            }`}
          >
            Start Now
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`py-20 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <h2 className={`text-4xl font-bold mb-12 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className={`rounded-xl p-6 border ${
              darkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Where do the questions come from?</h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Our questions are sourced from publicly available Science Olympiad tests and resources, ensuring a comprehensive and diverse question bank.
              </p>
            </div>
            <div className={`rounded-xl p-6 border ${
              darkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>How is AI being used?</h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                AI is primarily used for grading free response questions and providing detailed explanations. All questions are from real Science Olympiad tests - AI is not used to generate questions.
              </p>
            </div>
            <div className={`rounded-xl p-6 border ${
              darkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Is this an official practice platform?</h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                No, Scio.ly is not not endorsed by Science Olympiad Inc. - Our platform provides practice materials based on past exams but we do not make any guarantees about content on future exams.
              </p>
            </div>
            <div className={`rounded-xl p-6 border ${
              darkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>How can I contribute?</h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Although there is no way to directly help us code the site, we welcome any help you can offer! You can help by sending feedback through our contact form. Use the Contact Us button to get started.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'} border-t`}>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <Link href="/" className="flex items-center">
                <Image
                  src="/site-logo.png"
                  alt="Scio.ly Logo"
                  width={32}
                  height={32}
                  className="mr-2"
                />
                <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Scio.ly</span>
              </Link>
              <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Making Science Olympiad practice accessible to everyone. 
              </p>
            </div>
            <div>
              <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/welcome" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                    Practice
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Connect</h3>
              <div className="flex space-x-4">
                <a href="https://github.com/NapervilleASK/Scio.ly" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                  <FaGithub className="w-6 h-6" />
                </a>
                <a href="https://discord.gg/hXSkrD33gu" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                  <FaDiscord className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
          <div className={`mt-8 pt-8 border-t text-center text-sm ${darkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
            <p>© {new Date().getFullYear()} Scio.ly. All rights reserved.</p>
          </div>
        </div>
      </footer>

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

      <style jsx>{`
        :global(::-webkit-scrollbar) {
          width: 8px;
        }
        :global(::-webkit-scrollbar-thumb) {
          background: ${darkMode
            ? 'linear-gradient(to bottom, rgb(36, 36, 36), rgb(111, 35, 72))'
            : 'linear-gradient(to bottom, #3b82f6, #0ea5e9)'};
          border-radius: 4px;
        }
        :global(::-webkit-scrollbar-thumb:hover) {
          background: ${darkMode
            ? 'linear-gradient(to bottom, rgb(23, 23, 23), rgb(83, 26, 54))'
            : 'linear-gradient(to bottom, #2563eb, #0284c7)'};
        }
        :global(::-webkit-scrollbar-track) {
          background: ${darkMode ? 'black' : '#f1f5f9'};
        }

        @keyframes breathe {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
        }
        
        .breathing-gradient {
          background: radial-gradient(circle at center, rgba(56, 189, 248, 0.1) 0%, rgba(255, 255, 255, 0) 70%, rgba(34, 197, 94, 0.05) 100%);
          animation: breathe 15s ease-in-out infinite;
        }

        .static-gradient {
          background: linear-gradient(180deg, 
            rgba(56, 189, 248, 0.05) 0%, 
            rgba(255, 255, 255, 0) 30%, 
            rgba(34, 197, 94, 0.02) 70%,
            rgba(59, 130, 246, 0.03) 100%);
        }
        
        .light-button-halo {
          box-shadow: 0 0 15px 5px rgba(37, 99, 235, 0.2);
        }
        
        .light-button-halo:hover {
          box-shadow: 0 0 20px 8px rgba(37, 99, 235, 0.3);
        }
      `}</style>
    </div>
  );
}
