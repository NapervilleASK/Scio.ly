'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
// import { useAuth } from '@/app/contexts/AuthContext'; // Removed
import { onAuthStateChanged, User } from 'firebase/auth'; // Import Firebase Auth (Removed getAuth)
import { auth } from '@/lib/firebase'; // Import auth instance
import { getDailyMetrics, DailyMetrics } from '@/app/utils/metrics';
import { updateGamePoints } from '@/app/utils/gamepoints'; // Import game points utility
import { getUserProfile, updateUserProfile, UserProfile } from '@/app/utils/userProfile'; // Import user profile utilities
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation'; // Import useRouter for the back button
import { toast } from 'react-toastify'; // Import toast for notifications
import { FaQuestionCircle } from 'react-icons/fa'; // Import question mark icon

// Dynamically import game components to potentially improve initial load time
const YanivGame = dynamic(() => import('./Yaniv'));
// Add dynamic imports for the other games
const BlackjackGame = dynamic(() => import('./Blackjack'));
const CrazyEightsGame = dynamic(() => import('./CrazyEights'));

type GameSelection = 'yaniv' | 'blackjack' | 'crazyeights' | null;

export default function GamesDashboard() {
  const [selectedGame, setSelectedGame] = useState<GameSelection>(null);
  const [dailyScore, setDailyScore] = useState<number>(0); // State for combined score
  const [currentUser, setCurrentUser] = useState<User | null>(null); // State for Firebase user
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // State for user profile
  const [showTooltip, setShowTooltip] = useState(false); // State for tooltip visibility
  const { darkMode } = useTheme();
  const router = useRouter(); // Initialize router

  // Combined fetch function
  const fetchData = useCallback(async (user: User | null) => {
    const userId = user?.uid || null;
    console.log('fetchData called. User:', userId);

    // Fetch metrics (for balance)
    const metrics: DailyMetrics | null = await getDailyMetrics(userId);
    console.log('Fetched metrics:', metrics);
    if (metrics) {
      const combinedScore = (metrics.correctAnswers || 0) + (metrics.gamePoints || 0);
      console.log('Setting daily score (balance) to:', combinedScore);
      setDailyScore(combinedScore);
    }

    // Fetch profile (for navbar style)
    const profile: UserProfile = await getUserProfile(userId);
    console.log('Fetched profile:', profile);
    setUserProfile(profile);

  }, []); // No dependencies needed inside if logic is based on passed user

  // Listen for auth state changes and fetch data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      fetchData(user); // Fetch data when auth state changes
    });
    return () => unsubscribe();
  }, [fetchData]);

  // Refetch data when returning to dashboard or after a game potentially updates score
  useEffect(() => {
    if (!selectedGame) {
      fetchData(currentUser); // Refetch all data when dashboard is shown
    }
  }, [selectedGame, currentUser, fetchData]);

  const handleGameSelect = (game: GameSelection) => {
    setSelectedGame(game);
  };

  const handleBackToDashboard = () => {
    setSelectedGame(null); // Go back to the game selection view (will trigger refetch via useEffect)
  };

  // --- Purchase Logic ---
  const handlePurchaseStyle = async (style: 'golden' | 'rainbow', cost: number) => {
    if (!currentUser || !userProfile) return;
    if (dailyScore < cost) {
      toast.error(`Insufficient balance. Need ${cost} points.`);
      return;
    }
    if (userProfile.navbarStyle === style || (style === 'golden' && userProfile.navbarStyle === 'rainbow')) {
      toast.info('Style already unlocked!');
      return;
    }

    const toastId = toast.loading(`Purchasing ${style} style...`);
    try {
      // 1. Deduct points
      const metricsUpdate = await updateGamePoints(currentUser.uid, -cost);
      if (!metricsUpdate) {
        throw new Error('Failed to update points.');
      }

      // 2. Update profile
      await updateUserProfile(currentUser.uid, { navbarStyle: style });

      // 3. Update local state immediately for UI feedback
      setDailyScore(prevScore => prevScore - cost);
      setUserProfile(prevProfile => ({ ...prevProfile, navbarStyle: style }));

      toast.update(toastId, {
        render: `${style.charAt(0).toUpperCase() + style.slice(1)} style unlocked!`, 
        type: 'success', 
        isLoading: false, 
        autoClose: 3000 
      });

    } catch (error) {
      console.error(`Error purchasing ${style} style:`, error);
      toast.update(toastId, {
         render: `Purchase failed. Please try again.`, 
         type: 'error', 
         isLoading: false, 
         autoClose: 3000 
      });
      // Optional: Attempt to rollback points if profile update failed?
      // More complex error handling could be added here.
    }
  };
  // --- End Purchase Logic ---

  const buttonStyle = `px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-md w-full md:w-auto`;
  const primaryButtonStyle = darkMode
    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-500 hover:to-cyan-500'
    : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-400 hover:to-cyan-400';
  const secondaryButtonStyle = darkMode
    ? 'bg-gray-700 hover:bg-gray-600 text-white'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
  // --- Shop Button Styles ---
  const shopButtonStyle = `px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`;
  const goldenButtonStyle = `bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:from-yellow-500 hover:to-amber-600`;
  const rainbowButtonStyle = `bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white hover:opacity-90`;
  const unlockedStyle = `opacity-70 cursor-not-allowed`;

  const renderGame = () => {
    const handleGameEnd = () => fetchData(currentUser); // Use fetchData as the callback

    switch (selectedGame) {
      case 'yaniv':
        return <YanivGame onGameEnd={handleGameEnd} />;
      case 'blackjack':
        return <BlackjackGame onGameEnd={handleGameEnd} />;
      case 'crazyeights':
        return <CrazyEightsGame onGameEnd={handleGameEnd} />;
      default:
        return null;
    }
  };

  return (
    <div className={`h-screen overflow-y-auto p-4 md:p-6 transition-colors duration-1000 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-black'}`}>
       {/* Optional subtle background gradient */}
       <div className={`absolute inset-0 transition-opacity duration-1000 ${darkMode ? 'opacity-20' : 'opacity-0'} bg-gradient-to-br from-teal-800 via-cyan-900 to-blue-900`}></div>

      <div className="relative z-10 max-w-7xl mx-auto">
         {/* Header with conditional Back button */}
         <div className="relative flex items-center justify-between mb-6 md:mb-8">
            {selectedGame ? (
                 <button
                    onClick={handleBackToDashboard}
                    className={`p-2 rounded-full shadow-md transition-colors duration-300 z-20 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-200 text-gray-700'}`}
                    title="Back to Games Selection"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                 </button>
            ) : (
                 <button // Keep the original back button to dashboard when no game is selected
                    onClick={() => router.push('/dashboard')}
                    className={`p-2 rounded-full shadow-md transition-colors duration-300 z-20 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-200 text-gray-700'}`}
                    title="Back to Main Dashboard"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                 </button>
            )}
             <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl md:text-4xl font-bold text-center bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                 {selectedGame ? selectedGame.charAt(0).toUpperCase() + selectedGame.slice(1).replace('eights', ' Eights') : 'Fun Zone - Select a Game'} {/* Adjusted title for Crazy Eights */}
             </h1>
             {/* Display Combined Score */}
             <div className={`relative text-lg font-semibold p-2 rounded-lg shadow-sm ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'}`}>
               <span className="flex items-center gap-1.5">
                 Balance: {dailyScore}
                 <span 
                   className="cursor-help" 
                   onMouseEnter={() => setShowTooltip(true)} 
                   onMouseLeave={() => setShowTooltip(false)}
                 >
                   <FaQuestionCircle className="text-xs" />
                 </span>
               </span>
               {/* Tooltip Content */}
               {showTooltip && (
                 <div className={
                   `absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-60 p-3 text-sm rounded-lg shadow-xl z-30 ` +
                   `transition-opacity duration-200 ` + 
                   (darkMode 
                     ? 'bg-gray-800/95 text-gray-200 border border-gray-700' 
                     : 'bg-white/95 text-gray-700 border border-gray-200')
                 }>
                   Your balance is the total number of practice questions answered correctly plus net score earned from games. Spend it here on cosmetic upgrades!
                 </div>
               )}
             </div>
         </div>

        <AnimatePresence mode="wait">
          {!selectedGame ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-6 md:gap-8 mt-10 md:mt-16"
            >
              <button
                onClick={() => handleGameSelect('yaniv')}
                className={`${buttonStyle} ${primaryButtonStyle}`}
              >
                Play Yaniv ⚛️🧪🧬🔭
              </button>
              <button
                onClick={() => handleGameSelect('blackjack')}
                className={`${buttonStyle} ${secondaryButtonStyle}`}
              >
                Play Blackjack ♣️♦️♠️♥️
              </button>
              <button
                onClick={() => handleGameSelect('crazyeights')}
                className={`${buttonStyle} ${secondaryButtonStyle}`}
              >
                Play Crazy Eights 🤪8️⃣
              </button>

              {/* Navbar Style Shop */} 
              {currentUser && userProfile && (
                <div className="mt-12 pt-6 border-t w-full max-w-md flex flex-col items-center gap-4">
                   <h2 className="text-xl font-semibold mb-2">Navbar Styles</h2>
                   {/* Golden Style */} 
                   <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium">
                        Golden Navbar Text (Cost: 50)
                      </span>
                      <button 
                        onClick={() => handlePurchaseStyle('golden', 50)}
                        disabled={dailyScore < 50 || userProfile.navbarStyle === 'golden' || userProfile.navbarStyle === 'rainbow'}
                        className={`${shopButtonStyle} ${goldenButtonStyle} ${userProfile.navbarStyle === 'golden' || userProfile.navbarStyle === 'rainbow' ? unlockedStyle : ''}`}
                      >
                        {userProfile.navbarStyle === 'golden' || userProfile.navbarStyle === 'rainbow' ? 'Unlocked' : 'Unlock'}
                      </button>
                   </div>
                   {/* Rainbow Style */} 
                   <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium">
                        Rainbow Navbar Text (Cost: 200)
                      </span>
                      <button 
                        onClick={() => handlePurchaseStyle('rainbow', 200)}
                        disabled={dailyScore < 200 || userProfile.navbarStyle === 'rainbow'}
                        className={`${shopButtonStyle} ${rainbowButtonStyle} ${userProfile.navbarStyle === 'rainbow' ? unlockedStyle : ''}`}
                      >
                        {userProfile.navbarStyle === 'rainbow' ? 'Unlocked' : 'Unlock'}
                      </button>
                   </div>
                 </div>
               )}

            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderGame()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 