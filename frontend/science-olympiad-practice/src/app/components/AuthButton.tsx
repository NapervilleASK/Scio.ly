'use client';

import { useState, useRef, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/app/contexts/ThemeContext';

export default function AuthButton() {
  const [user, setUser] = useState(auth.currentUser);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const { darkMode } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const privacyModalRef = useRef<HTMLDivElement>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!window.navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user && !isOffline) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: user.email,
              name: user.displayName,
              photoURL: user.photoURL,
              createdAt: new Date(),
              metrics: {
                questionsAttempted: 0,
                correctAnswers: 0,
                eventsPracticed: 0
              }
            });
          }
        } catch (error) {
          console.error('Error accessing Firestore:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [isOffline]);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowSignInModal(false);
      window.location.reload()
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsDropdownOpen(false);
      window.location.reload()
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowSignInModal(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-4 focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {user.displayName?.[0] || 'U'}
                </span>
              </div>
            )}
          </div>
        </button>

        {isDropdownOpen && (
          <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`px-4 py-2 text-sm border-b ${
              darkMode ? 'text-gray-200 border-gray-700' : 'text-gray-700 border-gray-200'
            }`}>
              <p className="font-medium">{user.displayName}</p>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-500'} style={{ wordBreak: 'break-all' }}>{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className={`block w-full text-left px-4 py-2 text-sm ${
                darkMode 
                  ? 'text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowSignInModal(true)}
        className={`px-1 py-1 text-sm ${
          darkMode 
            ? 'text-blue-400 hover:text-blue-300' 
            : 'text-blue-500 hover:text-blue-700'
        }`}
      >
        Sign In
      </button>

      <AnimatePresence>
        {showSignInModal && (
          <div className="fixed top-0 right-0 bottom-0 w-[100vw] h-screen bg-black bg-opacity-50 z-[100]">
            <div className="flex align-middle mt-[35vh] justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`rounded-lg p-6 w-[400px] max-w-[90vw] ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
                ref={modalRef}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-xl font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>Sign In</h2>
                  <button
                    onClick={() => setShowSignInModal(false)}
                    className={`${
                      darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={handleSignIn}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 border rounded-md transition-colors duration-200 ${
                    darkMode 
                      ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' 
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
                <div className={`mt-4 text-center text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  By signing in, you agree to our{' '}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPrivacyPolicy(true);
                    }}
                    className={`underline ${
                      darkMode 
                        ? 'text-blue-400 hover:text-blue-300' 
                        : 'text-blue-500 hover:text-blue-700'
                    }`}
                  >
                    Privacy Policy
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrivacyPolicy && (
          <div className="fixed top-0 right-0 bottom-0 w-[100vw] h-screen bg-black bg-opacity-50 z-[101]">
            <div className="flex align-middle mt-[15vh] justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[70vh] overflow-y-auto ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
                ref={privacyModalRef}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-xl font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>Privacy Policy</h2>
                  <button
                    onClick={() => setShowPrivacyPolicy(false)}
                    className={`${
                      darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                  
                  <section>
                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      1. Information We Collect
                    </h3>
                    <p>We collect minimal information necessary to provide our Science Olympiad practice services:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Authentication information if you choose to sign in (email address only)</li>
                      <li>Practice test performance data</li>
                      <li>Usage statistics to improve our service</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      2. How We Use Your Information
                    </h3>
                    <p>We use collected information to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Track your progress and performance</li>
                      <li>Improve our question bank and services</li>
                      <li>Provide personalized practice experiences</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      3. Data Security
                    </h3>
                    <p>Your practice and authentication data is stored securely and is not shared with third parties.</p>
                  </section>

                  <section>
                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      4. Your Rights
                    </h3>
                    <p>You have the right to request deletion of your data at any time.</p>
                  </section>

                  <section>
                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      5. Contact Us
                    </h3>
                    <p>For any privacy-related questions or concerns, please contact us with the form on the top of the dashboard page.</p>
                  </section>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowPrivacyPolicy(false)}
                    className={`px-4 py-2 rounded transition-colors ${
                      darkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
} 