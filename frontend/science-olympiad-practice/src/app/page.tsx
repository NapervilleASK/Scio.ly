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
import { useEffect} from "react";
import { FiArrowRight } from "react-icons/fi";
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import Image from 'next/image';

const COLORS_TOP = ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"];

export default function HomePage() {
  const color = useMotionValue(COLORS_TOP[0]);

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
    { number: "3000+", label: "Practice Questions" },
    { number: "2000+", label: "Questions Answered" },
    { number: "0", label: "GitHub Stars :(" }
  ];

  return (
    <div className="relative bg-[#020617]">
      <Header />
      {/* Updated Hero Section */}
      <section className="min-h-screen relative overflow-hidden">
        <motion.div
          style={{ backgroundImage }}
          className="absolute inset-0 z-10"
        />
        
        <div className="absolute inset-0 z-0">
          <Canvas>
          <Stars radius={42} count={2500} factor={4} fade speed={1} />
          </Canvas>
        </div>

        <div className="relative z-20 h-screen flex items-center justify-center">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-7xl font-bold mb-6 text-gray-100"
            >
              Scio.ly
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl mb-8 text-gray-300 max-w-2xl mx-auto"
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
                  style={{ border, boxShadow }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className="group relative flex mx-auto items-center gap-1.5 rounded-full bg-gray-950/10 px-6 py-3 text-gray-50 transition-colors hover:bg-gray-950/50"
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
      <section className="min-h-screen py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-4">
            Master Science Olympiad Events
          </h2>
          <p className="text-gray-400 mb-12 max-w-2xl">
            Stop wasting time searching for practice materials. Scio.ly provides a comprehensive, organized platform
            carefully designed and crafted for Science Olympiad students – available to everyone, for free. 
          </p>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {mainFeatures.map((feature, index) => (
              <div key={index} 
                className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 transform transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/30"
              >
                <div className="text-blue-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Event Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-green-500/10 rounded-lg p-4">
              <h4 className="text-green-400 font-semibold mb-2">Life Science</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Anatomy & Physiology</li>
                <li>• Cell Biology</li>
                <li>• Disease Detectives</li>
              </ul>
            </div>
            <div className="bg-purple-500/10 rounded-lg p-4">
              <h4 className="text-purple-400 font-semibold mb-2">Earth & Space</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Astronomy</li>
                <li>• Dynamic Planet</li>
                <li>• Remote Sensing</li>
              </ul>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-4">
              <h4 className="text-blue-400 font-semibold mb-2">Physical Science</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Chemistry Lab</li>
                <li>• Physics Lab</li>
                <li>• Forensics</li>
              </ul>
            </div>
            <div className="bg-red-500/10 rounded-lg p-4">
              <h4 className="text-red-400 font-semibold mb-2">Technology</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Codebusters</li>
                <li>• Robot Tour</li>
                <li>• WiFi Lab</li>
              </ul>
            </div>
          </div>

          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Division B Support Coming Soon!</h3>
                <p className="text-gray-400">
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
      <section className="py-20 px-4 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="inline-block bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm mb-4">
                Test Features
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Everything You Need</h2>
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
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 overflow-hidden">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-400 font-mono">Test Code:</span>
                    <span className="bg-blue-500/10 px-3 py-1 rounded font-mono text-blue-300">ABC123</span>
                  </div>
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs uppercase tracking-wider">
                    Shared
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 mb-2 text-sm">Questions</div>
                    <div className="text-2xl font-bold text-white">15</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 mb-2 text-sm">Time Limit</div>
                    <div className="text-2xl font-bold text-white">25:00</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 mb-2 text-sm">Difficulty</div>
                    <div className="text-2xl font-bold text-blue-400">Mixed</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 mb-2 text-sm">Event</div>
                    <div className="text-2xl font-bold text-purple-400">Astronomy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="inline-block bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-sm mb-4">
                Practice Your Way
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Multiple Study Modes</h2>
              <p className="text-gray-400 mb-6">
                Choose how you want to practice:
              </p>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">→</span>
                  <div>
                    <strong className="text-white">Timed Tests</strong>
                    <p>Simulate competition conditions with customizable timed tests</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">→</span>
                  <div>
                    <strong className="text-white">Unlimited Practice</strong>
                    <p>Practice endlessly with our question bank, filtered by difficulty</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">→</span>
                  <div>
                    <strong className="text-white">Shared Tests</strong>
                    <p>Take tests shared by teammates or create your own to share</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 h-full">
              <div className="flex flex-col h-full space-y-4">
                <div className="bg-blue-500/10 p-6 rounded-lg flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-blue-400 text-xl font-semibold">Timed Test</h3>
                    <span className="text-blue-300 text-2xl">⏱️</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-gray-400 text-lg">15 Questions</span>
                    <span className="text-2xl font-mono text-blue-300">25:00</span>
                  </div>
                </div>
                <div className="bg-purple-500/10 p-6 rounded-lg flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-purple-400 text-xl font-semibold">Unlimited</h3>
                    <span className="text-purple-300 text-2xl">🎯</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-gray-400 text-lg">No Limits</span>
                    <span className="text-2xl font-mono text-purple-300">∞</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-20 px-4 bg-gray-900/30">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Trusted by few (Help us fix that!).</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {metrics.map((metric, index) => (
              <div key={index} className="p-6">
                <div className="text-4xl font-bold text-white mb-2">{metric.number}</div>
                <div className="text-gray-400">{metric.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-center gap-4">
            <a href="https://github.com/your-repo" className="text-gray-400 hover:text-white">
              <FaGithub className="w-6 h-6" />
            </a>
            <a href="https://discord.gg/your-server" className="text-gray-400 hover:text-white">
              <FaDiscord className="w-6 h-6" />
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-blue-900/50 opacity-95" />
        <div className="absolute inset-0">
          <Canvas>
            <Stars radius={42} count={1000} factor={3} fade speed={0.5} />
          </Canvas>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold mb-8 text-white"
            >
              Ready to start exploring?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl mb-12 text-gray-300 max-w-2xl mx-auto"
            >
              Join thousands of Science Olympiad students preparing for competitions.
              Start practicing now with our comprehensive question bank.
            </motion.p>
            <Link href="/welcome">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Get Started →
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-3">Where do the questions come from?</h3>
              <p className="text-gray-300">
                Our questions are sourced from publicly available Science Olympiad tests and resources, ensuring a comprehensive and diverse question bank.
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-3">How is AI being used?</h3>
              <p className="text-gray-300">
                AI is primarily used for grading free response questions and providing detailed explanations. All questions are from real Science Olympiad tests - AI is not used to generate questions.
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-3">Is this an official practice platform?</h3>
              <p className="text-gray-300">
                No, Science Olympiad is not an official practice tool. Our platform provides practice materials based on past exams but we do not make any guarantees about content on future exams.
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-3">How can I contribute?</h3>
              <p className="text-gray-300">
                Although there is no way to directly help us code the site, we welcome any help you can offer! You can help by sending feedback through our contact form. Use the Contact Us button to get started.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
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
                <span className="text-xl font-bold text-white">Scio.ly</span>
              </Link>
              <p className="mt-4 text-gray-400 text-sm">
                Making Science Olympiad practice accessible to everyone. 
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/welcome" className="text-gray-400 hover:text-white transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                    Practice
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="https://github.com/your-repo" className="text-gray-400 hover:text-white transition-colors">
                  <FaGithub className="w-6 h-6" />
                </a>
                <a href="https://discord.gg/your-server" className="text-gray-400 hover:text-white transition-colors">
                  <FaDiscord className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} Scio.ly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
