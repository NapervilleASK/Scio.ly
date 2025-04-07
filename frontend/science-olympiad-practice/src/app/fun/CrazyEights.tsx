'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
// import { useRouter } from 'next/navigation'; // Removed unused import
import { motion, AnimatePresence } from 'framer-motion'; // For animations & Added AnimatePresence
import { onAuthStateChanged, User } from 'firebase/auth'; // Import Firebase Auth
import { auth } from '@/lib/firebase'; // Import auth instance
import { updateGamePoints } from '@/app/utils/gamepoints'; // Import game points utility

// --- Card Definitions (Reused) ---

type Suit = 'Physics' | 'Chemistry' | 'Biology' | 'Astronomy';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

interface Card {
  id: string; // Unique ID for each card instance
  suit: Suit;
  rank: Rank;
  value: number; // Blackjack value (can ignore for Crazy 8s)
  themeName: string;
  suitIcon: string;
}

interface CrazyEightsGameProps {
  onGameEnd: () => void; // Define prop type for the callback
}

// --- Game Constants (Reused) ---

const SUITS: Suit[] = ['Physics', 'Chemistry', 'Biology', 'Astronomy'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUIT_ICONS: Record<Suit, string> = {
  Physics: '⚛️', Chemistry: '🧪', Biology: '🧬', Astronomy: '🔭',
};
const RANK_THEMES: Record<Rank, { themeName: string; value: number }> = {
  '2': { themeName: 'Helium (He)', value: 2 }, '3': { themeName: 'Lithium (Li)', value: 3 },
  '4': { themeName: 'Beryllium (Be)', value: 4 }, '5': { themeName: 'Boron (B)', value: 5 },
  '6': { themeName: 'Carbon (C)', value: 6 }, '7': { themeName: 'Nitrogen (N)', value: 7 },
  '8': { themeName: 'Oxygen (O)', value: 8 }, '9': { themeName: 'Fluorine (F)', value: 9 },
  '10': { themeName: 'Neon (Ne)', value: 10 }, 'J': { themeName: 'Newton', value: 10 },
  'Q': { themeName: 'Curie', value: 10 }, 'K': { themeName: 'Darwin', value: 10 },
  'A': { themeName: 'Microscope', value: 11 },
};

// --- Utility Functions (Reused/Adapted) ---

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  let idCounter = 0;
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const themeInfo = RANK_THEMES[rank];
      deck.push({
        id: `card-${idCounter++}`, // Assign unique ID
        suit, rank, value: themeInfo.value,
        themeName: themeInfo.themeName, suitIcon: SUIT_ICONS[suit],
      });
    }
  }
  return deck;
};

const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// --- UI Components (Reused/Adapted) ---

const CardDisplay = ({ card, hidden, darkMode, onClick, isPlayable }: {
  card: Card | null;
  hidden?: boolean;
  darkMode: boolean;
  onClick?: () => void;
  isPlayable?: boolean; // Highlight playable cards
}) => {
  const cardBaseStyle = `w-20 h-28 md:w-24 md:h-36 rounded-lg border p-2 flex flex-col justify-between shadow-md transition-all duration-300 relative overflow-hidden`;
  const cardDarkStyle = 'bg-gray-700 border-gray-500 text-white';
  const cardLightStyle = 'bg-white border-gray-300 text-gray-900';
  const hiddenStyle = 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-700';
  const playableStyle = isPlayable ? 'ring-2 ring-offset-2 ring-yellow-400 cursor-pointer hover:scale-105 hover:-translate-y-1' : (onClick ? 'cursor-default' : '');
  const clickableStyle = onClick ? 'cursor-pointer hover:scale-105 hover:-translate-y-1' : '';

  if (hidden || !card) {
    return (
      <div className={`${cardBaseStyle} ${darkMode ? 'bg-gray-600 border-gray-400' : hiddenStyle}`}>
        {/* Hidden card back */}
      </div>
    );
  }

  const rankColor = ['Physics', 'Astronomy'].includes(card.suit)
    ? (darkMode ? 'text-blue-300' : 'text-blue-700')
    : (darkMode ? 'text-red-300' : 'text-red-700');

  return (
    <motion.div
      layoutId={card.id} // For animation between piles
      className={`${cardBaseStyle} ${darkMode ? cardDarkStyle : cardLightStyle} ${isPlayable ? playableStyle : clickableStyle}`}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-left">
        <div className={`font-bold text-lg ${rankColor}`}>{card.rank}</div>
        <div className="text-xl">{card.suitIcon}</div>
      </div>
      <div className={`text-center text-xs font-semibold break-words ${rankColor}`}>
        {card.themeName}
      </div>
      <div className="text-right rotate-180">
        <div className={`font-bold text-lg ${rankColor}`}>{card.rank}</div>
        <div className="text-xl">{card.suitIcon}</div>
      </div>
    </motion.div>
  );
};

// --- Main Game Component ---

export default function CrazyEightsGame({ onGameEnd }: CrazyEightsGameProps) {
  const { darkMode } = useTheme();
  // const router = useRouter(); // Removed unused variable
  const [currentUser, setCurrentUser] = useState<User | null>(null); // State for Firebase user

  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [botHand, setBotHand] = useState<Card[]>([]);
  const [currentSuit, setCurrentSuit] = useState<Suit | null>(null); // Suit declared after an 8
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'bot'>('player');
  const [gameStatus, setGameStatus] = useState<'playing' | 'playerWins' | 'botWins'>('playing');
  const [message, setMessage] = useState('Starting game...');
  const [isChoosingSuit, setIsChoosingSuit] = useState(false); // Player needs to choose suit after playing 8
  const [drawnCardPlayable, setDrawnCardPlayable] = useState<Card | null>(null); // Track if drawn card can be played
  const [showHelpTooltip, setShowHelpTooltip] = useState(false); // State for help tooltip


  const topDiscardCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
  const effectiveSuit = currentSuit || topDiscardCard?.suit; // Use declared suit if available

  // Check if a card is playable
  const isPlayableCard = useCallback((card: Card): boolean => {
    if (!topDiscardCard) return true; // Should only happen at the very start if needed
    if (card.rank === '8') return true; // Eights are always playable
    return card.rank === topDiscardCard.rank || card.suit === effectiveSuit;
  }, [topDiscardCard, effectiveSuit]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  // Start Game Logic
  const startGame = useCallback(() => {
    let newDeck = shuffleDeck(createDeck());
    const pHand: Card[] = [];
    const bHand: Card[] = [];

    for (let i = 0; i < 7; i++) {
      pHand.push(newDeck.pop()!);
      bHand.push(newDeck.pop()!);
    }

    // Deal first discard card, ensure it's not an 8
    let firstDiscard = newDeck.pop()!;
    while (firstDiscard.rank === '8') {
      newDeck.push(firstDiscard); // Put 8 back
      newDeck = shuffleDeck(newDeck); // Reshuffle
      firstDiscard = newDeck.pop()!;
    }

    setDeck(newDeck);
    setDiscardPile([firstDiscard]);
    setPlayerHand(pHand);
    setBotHand(bHand);
    setCurrentSuit(firstDiscard.suit); // Initial suit is from the first card
    setCurrentPlayer('player');
    setGameStatus('playing');
    setMessage('Your turn.');
    setIsChoosingSuit(false);
    setDrawnCardPlayable(null);
  }, []);

  // Reshuffle discard pile into deck when deck runs out
  const reshuffleDeck = () => {
      if (discardPile.length <= 1) {
           setMessage("No cards left to draw or reshuffle!");
           return []; // Cannot reshuffle if only one card is left
      }
      console.log("Reshuffling deck...");
      const topCard = discardPile[discardPile.length - 1];
      const cardsToShuffle = discardPile.slice(0, -1);
      const newShuffledDeck = shuffleDeck(cardsToShuffle);
      setDiscardPile([topCard]); // Keep only the top card
      setDeck(newShuffledDeck);
      return newShuffledDeck;
  };

   // Player plays a card - NOW ASYNC
  const handlePlayerPlayCard = async (cardToPlay: Card) => {
    if (currentPlayer !== 'player' || gameStatus !== 'playing' || isChoosingSuit || !isPlayableCard(cardToPlay)) {
        if (!isPlayableCard(cardToPlay)) setMessage("Cannot play that card. Match suit or rank, or play an 8.");
        return;
    }

    // Play the card
    const newPlayerHand = playerHand.filter(card => card.id !== cardToPlay.id);
    setPlayerHand(newPlayerHand);
    setDiscardPile(prev => [...prev, cardToPlay]);
    setDrawnCardPlayable(null); // Reset drawn card state

    // Check for win
    if (newPlayerHand.length === 0) {
        setGameStatus('playerWins');
        setMessage('You win!');
        // --- Add points logic ---
        console.log("Player wins! Updating score..."); // DEBUG
        await updateGamePoints(currentUser?.uid || null, 1); // +1 point for win
        console.log("Score update complete (Player win). Calling onGameEnd..."); // DEBUG
        onGameEnd();
        // --- End points logic ---
        return;
    }

    // Handle Eights
    if (cardToPlay.rank === '8') {
        setIsChoosingSuit(true);
        setMessage('You played an 8! Choose the next suit.');
        // Don't switch turn yet
    } else {
        setCurrentSuit(cardToPlay.suit); // Set suit normally
        setMessage("Bot's turn...");
        setCurrentPlayer('bot');
         // Trigger bot turn after a short delay
        setTimeout(botTurn, 1000);
    }
  };

  // Player chooses suit after playing an 8
  const handlePlayerChooseSuit = (chosenSuit: Suit) => {
    if (!isChoosingSuit) return;

    setCurrentSuit(chosenSuit);
    setIsChoosingSuit(false);
    setMessage(`Suit changed to ${chosenSuit}. Bot's turn...`);
    setCurrentPlayer('bot');
    // Trigger bot turn after a short delay
    setTimeout(botTurn, 1000);
  };


   // Player draws a card
  const handlePlayerDrawCard = () => {
    if (currentPlayer !== 'player' || gameStatus !== 'playing' || isChoosingSuit || drawnCardPlayable) return;

    let currentDeck = deck;
    if (currentDeck.length === 0) {
        currentDeck = reshuffleDeck();
        if (currentDeck.length === 0) return; // Still no cards
    }

    const drawnCard = currentDeck.pop()!;
    setPlayerHand(prev => [...prev, drawnCard]);
    setDeck([...currentDeck]); // Update deck state

    // Check if the drawn card is immediately playable
    if (isPlayableCard(drawnCard)) {
        setMessage(`You drew a ${drawnCard.themeName} (${drawnCard.rank} ${drawnCard.suitIcon}). Play it?`);
        setDrawnCardPlayable(drawnCard); // Allow player to play this card
    } else {
        setMessage("You drew a card. Bot's turn...");
        setCurrentPlayer('bot');
        setTimeout(botTurn, 1000); // Switch turn if drawn card is not playable
    }
  };

  // Player skips playing the drawn card
    const handleSkipDrawnCard = () => {
        if (!drawnCardPlayable) return;
        setDrawnCardPlayable(null);
        setMessage("You kept the card. Bot's turn...");
        setCurrentPlayer('bot');
        setTimeout(botTurn, 1000);
    };


   // Bot's Turn Logic (Simplified) - NOW ASYNC
   const botTurn = useCallback(async () => {
        if (gameStatus !== 'playing') return; // Should already be caught, but safety first

        console.log("Bot's turn. Current suit:", effectiveSuit, "Top card:", topDiscardCard?.rank);
        console.log("Bot hand:", botHand.map(c => `${c.rank}${c.suitIcon}`));

        // Find playable cards
        const playableCards = botHand.filter(isPlayableCard);

        let currentBotHand = [...botHand];
        let currentDeck = [...deck];
        let cardPlayed: Card | null = null;

        if (playableCards.length > 0) {
            // Simple strategy: play the first playable card found
            cardPlayed = playableCards[0];
            console.log("Bot plays:", cardPlayed.rank, cardPlayed.suitIcon);
            currentBotHand = currentBotHand.filter(card => card.id !== cardPlayed!.id);
            setDiscardPile(prev => [...prev, cardPlayed!]);
        } else {
            // Bot needs to draw
            let drawnCard: Card | null = null;
            let canPlay = false;
            let drawAttempts = 0; // Prevent infinite loop if deck is stuck
            setMessage("Bot is drawing...");

            while (!canPlay && drawAttempts < deck.length + botHand.length + 5) { // Safety limit
                 if (currentDeck.length === 0) {
                    currentDeck = reshuffleDeck(); // Modifies state directly, need to update local `currentDeck`
                     if (currentDeck.length === 0) {
                        console.log("Bot: No cards left to draw.");
                        break; // Exit loop if deck empty after reshuffle
                     }
                 }

                drawnCard = currentDeck.pop()!;
                console.log("Bot draws:", drawnCard.rank, drawnCard.suitIcon);
                currentBotHand.push(drawnCard);
                drawAttempts++;

                if (isPlayableCard(drawnCard)) {
                    canPlay = true;
                    cardPlayed = drawnCard; // Bot will play the card it just drew
                     console.log("Bot plays drawn card:", cardPlayed.rank, cardPlayed.suitIcon);
                    currentBotHand = currentBotHand.filter(card => card.id !== cardPlayed!.id); // Remove from hand again
                    setDiscardPile(prev => [...prev, cardPlayed!]);
                }
                 // Update state immediately after drawing to show card count change
                setBotHand([...currentBotHand]);
                setDeck([...currentDeck]);
            }
             if (!canPlay) {
                 console.log("Bot couldn't find a playable card after drawing.");
             }
        }

        // Update state after potential play/draws
        setBotHand(currentBotHand);
        setDeck(currentDeck);


        // Check if bot won
        if (currentBotHand.length === 0) {
            setGameStatus('botWins');
            setMessage('Bot wins!');
             // --- Add points logic ---
            console.log("Bot wins! Updating score..."); // DEBUG
            await updateGamePoints(currentUser?.uid || null, -1); // -1 point for loss
            console.log("Score update complete (Bot win). Calling onGameEnd..."); // DEBUG
            onGameEnd();
             // --- End points logic ---
            return; // End turn
        }

        // Handle 8 played by bot
        if (cardPlayed && cardPlayed.rank === '8') {
            // Simple bot strategy: choose the most common suit in hand (excluding 8s)
            const suitCounts: Record<Suit, number> = { Physics: 0, Chemistry: 0, Biology: 0, Astronomy: 0 };
            currentBotHand.forEach(card => {
                if (card.rank !== '8') {
                    suitCounts[card.suit]++;
                }
            });
            let maxCount = 0;
            let chosenSuit = cardPlayed.suit; // Default to the 8's own suit if no other cards
            for (const suit in suitCounts) {
                if (suitCounts[suit as Suit] > maxCount) {
                    maxCount = suitCounts[suit as Suit];
                    chosenSuit = suit as Suit;
                }
            }
            setCurrentSuit(chosenSuit);
            setMessage(`Bot played an 8 and chose ${chosenSuit}. Your turn.`);
             console.log("Bot chose suit:", chosenSuit);
        } else if (cardPlayed) {
            setCurrentSuit(cardPlayed.suit); // Set suit normally
             setMessage("Bot played. Your turn.");
        } else {
             setMessage("Bot drew cards. Your turn."); // Bot drew but couldn't play
        }


        setCurrentPlayer('player');

    }, [gameStatus, botHand, deck, isPlayableCard, effectiveSuit, topDiscardCard?.rank, currentUser, onGameEnd]);


  // Effect to start the game on mount
  useEffect(() => {
    startGame();
  }, [startGame]);


  const buttonStyle = `px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base`;
  const primaryButtonStyle = darkMode
    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
    : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white';
  const secondaryButtonStyle = darkMode
    ? 'bg-gray-600 hover:bg-gray-500 text-white'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
   const suitButtonStyle = `p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-md border-2`;


  return (
     <div className={``}>
       {/* Optional Gradient Background Removed */}
       {/* <div className={`absolute inset-0 transition-opacity duration-1000 ${darkMode ? 'opacity-20' : 'opacity-0'} bg-gradient-to-br from-purple-800 via-indigo-900 to-black`}></div> */}

       <div className="relative z-10 max-w-6xl mx-auto">
            {/* Back Button Removed */}
            {/* <button
                onClick={() => router.push('/dashboard')}
                className={`absolute top-0 left-0 m-3 p-2 rounded-full shadow-md transition-colors duration-300 z-20 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-200 text-gray-700'}`}
                title="Back to Dashboard"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                 </svg>
            </button> */}



             {/* Game Info Area */}
             <div className={`text-center mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-800/70' : 'bg-white/80 shadow-sm'}`}>
                 <p className="text-lg md:text-xl font-medium">{message}</p>
                 {gameStatus === 'playing' && effectiveSuit && (
                     <p className="text-sm md:text-base">Current Suit: <span className="font-bold">{SUIT_ICONS[effectiveSuit]} {effectiveSuit}</span></p>
                 )}
                 {gameStatus === 'playerWins' && <p className="text-green-500 font-bold text-xl mt-2">🎉 You Won! 🎉</p>}
                 {gameStatus === 'botWins' && <p className="text-red-500 font-bold text-xl mt-2">🤖 Bot Wins! 🤖</p>}
             </div>

              {/* Suit Choice Modal */}
             {isChoosingSuit && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                     <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow-xl`}
                     >
                         <h3 className="text-xl font-semibold mb-4 text-center">Choose the next suit:</h3>
                         <div className="flex justify-center gap-4">
                             {SUITS.map(suit => (
                                 <button
                                     key={suit}
                                     onClick={() => handlePlayerChooseSuit(suit)}
                                     className={`${suitButtonStyle} ${
                                         ['Physics', 'Astronomy'].includes(suit)
                                            ? 'border-blue-500 hover:bg-blue-500/20'
                                            : 'border-red-500 hover:bg-red-500/20'
                                     }`}
                                     title={`Choose ${suit}`}
                                 >
                                     <span className="text-3xl">{SUIT_ICONS[suit]}</span>
                                 </button>
                             ))}
                         </div>
                     </motion.div>
                 </div>
             )}


             {/* Game Board Area */}
             <div className="flex flex-col md:flex-row justify-around items-center gap-6 md:gap-10 mb-6">
                {/* Bot Hand */}
                 <div className="flex flex-col items-center">
                     <p className="font-semibold mb-2">Bot&apos;s Hand ({botHand.length})</p>
                     <div className="flex justify-center flex-wrap gap-[-30px] md:gap-[-40px] min-h-[8rem] md:min-h-[10rem] w-full max-w-md">
                        {botHand.map((card, index) => (
                            <div key={`bot-card-${index}`} className="relative" style={{ zIndex: index, marginLeft: index > 0 ? '-40px' : '0' }}> {/* Overlap effect */}
                                <CardDisplay card={null} hidden darkMode={darkMode} />
                            </div>
                        ))}
                         {botHand.length === 0 && gameStatus === 'playing' && <p className="text-sm italic">No cards</p>}
                     </div>
                 </div>

                 {/* Deck and Discard */}
                 <div className="flex flex-col items-center gap-4">
                    {/* Deck */}
                     <div className="text-center">
                         <p className="font-semibold mb-1">Deck ({deck.length})</p>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <CardDisplay
                                card={null} // Show back
                                hidden
                                darkMode={darkMode}
                                onClick={currentPlayer === 'player' && gameStatus === 'playing' && !isChoosingSuit && !drawnCardPlayable ? handlePlayerDrawCard : undefined}
                            />
                         </motion.div>
                     </div>
                     {/* Discard Pile */}
                     <div className="text-center">
                         <p className="font-semibold mb-1">Discard</p>
                         <div className="min-h-[8rem] md:min-h-[10rem] w-[5rem] md:w-[6rem] flex items-center justify-center">
                             {topDiscardCard ? (
                                 <CardDisplay card={topDiscardCard} darkMode={darkMode} />
                             ) : (
                                <div className={`w-20 h-28 md:w-24 md:h-36 rounded-lg border-2 border-dashed ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
                             )}
                         </div>
                     </div>
                 </div>
             </div>


             {/* Player Hand */}
            <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-semibold mb-3 text-center">Your Hand ({playerHand.length})</h2>
                 {drawnCardPlayable && (
                      <div className={`mb-4 text-center p-3 rounded-lg ${darkMode ? 'bg-blue-900/50 border border-blue-700' : 'bg-blue-100 border border-blue-300'}`}>
                           <p>You drew: {drawnCardPlayable.themeName} ({drawnCardPlayable.rank} {drawnCardPlayable.suitIcon})</p>
                           <div className="flex gap-4 justify-center mt-2">
                             <button
                                 onClick={() => handlePlayerPlayCard(drawnCardPlayable)}
                                 className={`${buttonStyle} ${primaryButtonStyle} !px-3 !py-1.5 text-sm`}
                             >
                                 Play Drawn Card
                             </button>
                              <button
                                 onClick={handleSkipDrawnCard}
                                 className={`${buttonStyle} ${secondaryButtonStyle} !px-3 !py-1.5 text-sm`}
                             >
                                 Keep Card & End Turn
                             </button>
                           </div>
                      </div>
                  )}
                <div className="flex justify-center flex-wrap gap-2 md:gap-3 min-h-[10rem] items-end">
                    {playerHand.length > 0 ? playerHand.map((card) => (
                        <CardDisplay
                            key={card.id}
                            card={card}
                            darkMode={darkMode}
                            onClick={() => handlePlayerPlayCard(card)}
                            isPlayable={currentPlayer === 'player' && gameStatus === 'playing' && !isChoosingSuit && isPlayableCard(card)}
                        />
                    )) : (
                         gameStatus !== 'playerWins' && <p className="text-lg italic text-center w-full">Hand is empty</p>
                    )}
                </div>
            </div>

             {/* Action Buttons Area */}
            <div className="flex justify-center gap-4 md:gap-6 mt-4">
                {gameStatus !== 'playing' && (
                     <button
                         onClick={startGame}
                         className={`${buttonStyle} ${primaryButtonStyle}`}
                     >
                         New Game
                     </button>
                )}
                 {currentPlayer === 'player' && gameStatus === 'playing' && !isChoosingSuit && !drawnCardPlayable && (
                     <button
                         onClick={handlePlayerDrawCard}
                         className={`${buttonStyle} ${secondaryButtonStyle}`}
                     >
                         Draw Card
                     </button>
                 )}
            </div>
       </div>
       
       {/* Help Icon & Tooltip */}
       <div className="fixed bottom-7 right-10 z-50">
         <div
           className={`relative flex items-center justify-center w-8 h-8 md:w-14 md:h-14 rounded-full cursor-help transition-colors ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
           onMouseEnter={() => setShowHelpTooltip(true)}
           onMouseLeave={() => setShowHelpTooltip(false)}
         >
           <span className="font-bold text-lg">?</span>
           <AnimatePresence>
             {showHelpTooltip && (
               <motion.div
                 initial={{ opacity: 0, y: 10, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 10, scale: 0.95 }}
                 transition={{ duration: 0.2 }}
                 className={`absolute bottom-full right-0 mb-2 w-64 p-3 rounded-lg shadow-xl text-sm ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700 border border-gray-200'}`}
               >
                 <p className="font-semibold mb-1">How to Play Crazy Eights:</p>
                 <p className="mb-2">
                   Goal: Be the first to empty your hand.
                 </p>
                 <p className="mb-2">
                   Play: Match the top discard card by rank or suit.
                 </p>
                 <p className="mb-2">
                   Eights (Oxygen): Are wild! Play an 8 and choose the next suit.
                 </p>
                 <p className="mb-2">
                     Draw: If you cannot play, draw from the deck until you can, or the deck is empty.
                 </p>
                 <a
                   href="https://en.wikipedia.org/wiki/Crazy_Eights"
                   target="_blank"
                   rel="noopener noreferrer"
                   className={`font-medium underline ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}
                 >
                   Full Rules (Wikipedia)
                 </a>
               </motion.div>
             )}
           </AnimatePresence>
         </div>
       </div>
     </div>
  );
}
