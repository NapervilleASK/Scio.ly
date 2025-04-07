'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from "framer-motion"
import { useTheme } from '@/app/contexts/ThemeContext';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { updateGamePoints } from '@/app/utils/gamepoints';

interface BlackjackGameProps {
  onGameEnd: () => void; // Define prop type for the callback
}

// --- Card Definitions ---

type Suit = 'Physics' | 'Chemistry' | 'Biology' | 'Astronomy';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // Blackjack value
  themeName: string; // e.g., "Hydrogen", "Newton"
  suitIcon: string; // Emoji or symbol
}

// --- Game Constants ---

const SUITS: Suit[] = ['Physics', 'Chemistry', 'Biology', 'Astronomy'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUIT_ICONS: Record<Suit, string> = {
  Physics: '⚛️', // Atom Symbol
  Chemistry: '🧪', // Test Tube
  Biology: '🧬', // DNA
  Astronomy: '🔭', // Telescope
};

// Map ranks to science themes and values
const RANK_THEMES: Record<Rank, { themeName: string; value: number }> = {
  '2': { themeName: 'Helium (He)', value: 2 },
  '3': { themeName: 'Lithium (Li)', value: 3 },
  '4': { themeName: 'Beryllium (Be)', value: 4 },
  '5': { themeName: 'Boron (B)', value: 5 },
  '6': { themeName: 'Carbon (C)', value: 6 },
  '7': { themeName: 'Nitrogen (N)', value: 7 },
  '8': { themeName: 'Oxygen (O)', value: 8 },
  '9': { themeName: 'Fluorine (F)', value: 9 },
  '10': { themeName: 'Neon (Ne)', value: 10 },
  J: { themeName: 'Newton', value: 10 },
  Q: { themeName: 'Curie', value: 10 },
  K: { themeName: 'Darwin', value: 10 },
  A: { themeName: 'Microscope', value: 11 }, // Ace value handled dynamically
};

// --- Utility Functions ---

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const themeInfo = RANK_THEMES[rank];
      deck.push({
        suit,
        rank,
        value: themeInfo.value,
        themeName: themeInfo.themeName,
        suitIcon: SUIT_ICONS[suit],
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

const calculateHandValue = (hand: Card[]): number => {
  let value = 0;
  let aceCount = 0;
  for (const card of hand) {
    value += card.value;
    if (card.rank === 'A') {
      aceCount++;
    }
  }
  // Adjust for Aces
  while (value > 21 && aceCount > 0) {
    value -= 10; // Change Ace value from 11 to 1
    aceCount--;
  }
  return value;
};

// --- UI Components ---

const CardDisplay = ({ card, hidden, darkMode }: { card: Card | null; hidden?: boolean; darkMode: boolean }) => {
  const cardBaseStyle = `w-20 h-28 md:w-24 md:h-36 rounded-lg border p-2 flex flex-col justify-between shadow-md transition-all duration-300`;
  const cardDarkStyle = 'bg-gray-700 border-gray-500 text-white';
  const cardLightStyle = 'bg-white border-gray-300 text-gray-900';
  const hiddenStyle = 'bg-gradient-to-br from-blue-400 to-purple-500 border-blue-600';

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
      className={`${cardBaseStyle} ${darkMode ? cardDarkStyle : cardLightStyle}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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

export default function BlackjackGame({ onGameEnd }: BlackjackGameProps) {
  const { darkMode } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]); // Dealer's full hand
  const [dealerVisibleHand, setDealerVisibleHand] = useState<Card[]>([]); // Cards visible to player
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0); // Full score, revealed later
  const [gameStatus, setGameStatus] = useState<'betting' | 'playerTurn' | 'dealerTurn' | 'gameOver'>('betting');
  const [message, setMessage] = useState('Place your bet to start!'); // Game messages
  const [gameOver, setGameOver] = useState(true); // Start in game over state

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  // Initialize game
  const startGame = useCallback(() => {
    const newDeck = shuffleDeck(createDeck());
    const pHand: Card[] = [newDeck.pop()!, newDeck.pop()!];
    const dHand: Card[] = [newDeck.pop()!, newDeck.pop()!];

    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setDealerVisibleHand([dHand[0]]); // Show only the first dealer card

    const pScore = calculateHandValue(pHand);
    setPlayerScore(pScore);
    setDealerScore(calculateHandValue(dHand)); // Calculate full score but don't show yet

    setGameOver(false);

    // Check for immediate Blackjack
    if (pScore === 21) {
      setMessage('Blackjack! Player wins!');
      setGameStatus('gameOver');
      setDealerVisibleHand(dHand); // Reveal dealer hand on blackjack
      setGameOver(true);
    } else {
      setMessage('Your turn. Hit or Stand?');
      setGameStatus('playerTurn');
    }
  }, []);

  // Player hits
  const hit = async () => {
    if (gameStatus !== 'playerTurn' || gameOver) return;

    const newDeck = [...deck];
    const newCard = newDeck.pop();
    if (!newCard) return; // Should not happen with a standard deck

    const newHand = [...playerHand, newCard];
    const newScore = calculateHandValue(newHand);

    setDeck(newDeck);
    setPlayerHand(newHand);
    setPlayerScore(newScore);

    if (newScore > 21) {
      setMessage('Bust! Dealer wins.');
      setGameStatus('gameOver');
      setDealerVisibleHand(dealerHand); // Reveal dealer's hand
      setGameOver(true);
      // Update score and trigger callback on bust
      console.log('Player busted. Updating game points...'); // DEBUG
      await updateGamePoints(currentUser?.uid || null, -1); // Bust means -1 point
      console.log('Game points update complete (bust).'); // DEBUG
      console.log('Calling onGameEnd (fetchScore) after bust...'); // DEBUG
      onGameEnd(); // Trigger score refresh
      console.log('onGameEnd (fetchScore) called after bust.'); // DEBUG

    } else if (newScore === 21) {
        stand(); // Automatically stand on 21
    } else {
      setMessage('Hit or Stand?');
    }
  };

  // Player stands -> Dealer's turn
  const stand = () => {
    if (gameStatus !== 'playerTurn' || gameOver) return;
    setGameStatus('dealerTurn');
    setMessage("Dealer's turn...");
    setDealerVisibleHand(dealerHand); // Reveal dealer's hidden card
    // Use setTimeout to allow player to see the revealed card before dealer acts
    setTimeout(() => dealerPlays(dealerHand, deck), 1000);
  };

  // Dealer logic - Refactored
  const dealerPlays = (currentDealerHand: Card[], currentDeck: Card[]) => {
    const hand = [...currentDealerHand]; // Use const
    const tempDeck = [...currentDeck]; // Use const
    let currentDealerScore = calculateHandValue(hand);

    const performDealerHit = () => {
      if (currentDealerScore < 17) {
        const newCard = tempDeck.pop();
        if (!newCard) {
          // Deck ran out, finalize with current hand
          finalizeDealerTurn(hand, tempDeck);
          return;
        }
        hand.push(newCard);
        currentDealerScore = calculateHandValue(hand);

        // Update UI progressively
        setDealerHand([...hand]);
        setDealerVisibleHand([...hand]);
        // Optional: Update dealerScore state progressively for visual feedback, but we recalculate final score later
        // setDealerScore(currentDealerScore);

        // Schedule next check/hit
        setTimeout(performDealerHit, 500);
      } else {
        // Dealer stands (score is 17 or more)
        finalizeDealerTurn(hand, tempDeck);
      }
    };

    // Start the dealer's turn logic
    performDealerHit();
  };

  // New function to finalize dealer's turn and determine winner
  const finalizeDealerTurn = (finalDealerHand: Card[], finalDeck: Card[]) => {
    setDeck(finalDeck); // Update final deck state
    const finalDealerScore = calculateHandValue(finalDealerHand);
    setDealerHand(finalDealerHand); // Ensure final hand state is set
    setDealerVisibleHand(finalDealerHand); // Ensure final visibility
    setDealerScore(finalDealerScore); // Set final score state based on calculation

    // Use a final timeout to ensure state updates have likely processed before determining winner
    setTimeout(() => {
        // Use the current playerScore state, which should be stable after player's turn
        console.log(`Finalizing turn. Player score (state): ${playerScore}, Final Dealer Score: ${finalDealerScore}`); // DEBUG
        determineWinner(playerScore, finalDealerScore); // Pass calculated final scores
        setGameOver(true); // Set game over state here
        setGameStatus('gameOver');
    }, 2000); // Short delay
  };

  // Determine winner - Modified to rely only on arguments
  const determineWinner = async (pScore: number, dScore: number) => {
    // No longer need to setDealerVisibleHand or setDealerScore here,
    // as finalizeDealerTurn handles the final state updates.

    console.log(`Determining Winner. pScore Arg: ${pScore}, dScore Arg: ${dScore}`); // DEBUG

    let pointsChange = 0;
    let resultMessage = '';

    // --- Logic MUST use pScore and dScore arguments --- 
    if (pScore > 21) { // Should be caught by hit(), but double-check
      resultMessage = 'Player Busts! Dealer wins.';
      pointsChange = -1;
    } else if (dScore > 21) {
      resultMessage = 'Dealer Busts! Player wins.';
      pointsChange = 1;
    } else if (pScore === dScore) {
      resultMessage = 'Push! It\'s a tie.';
      pointsChange = 0;
    } else if (pScore > dScore) {
      resultMessage = 'Player wins!';
      pointsChange = 1;
    } else { // dScore > pScore
      resultMessage = 'Dealer wins.';
      pointsChange = -1;
    }
    // --- End argument-based logic ---

    setMessage(resultMessage);

    // Update game points in storage/db and wait for it to complete
    console.log('Updating game points...', pointsChange); // DEBUG
    await updateGamePoints(currentUser?.uid || null, pointsChange);
    console.log('Game points update complete.'); // DEBUG

    // Call the callback AFTER the score update is complete
    console.log('Calling onGameEnd (fetchScore)...'); // DEBUG
    onGameEnd();
    console.log('onGameEnd (fetchScore) called.'); // DEBUG
  };

  // Start a new game on mount or when game is over
  useEffect(() => {
    if (gameOver) {
       // Optionally add a small delay before starting new game automatically
       // Consider calling startGame() here directly if you want auto-restart
    }
     // Ensure game starts when component mounts if it's in gameOver state initially
     if (gameOver && playerHand.length === 0 && dealerHand.length === 0) {
        startGame();
     }
  }, [gameOver, startGame, playerHand.length, dealerHand.length]); // Added dependencies

  const buttonStyle = `px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`;
  const primaryButtonStyle = darkMode
    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
    : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white';
  const secondaryButtonStyle = darkMode
    ? 'bg-gray-600 hover:bg-gray-500 text-white'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';


  return (
    <div className={`p-4 md:p-8`}> {/* Simplified container */}

      <div className="max-w-4xl mx-auto">

        {/* Removed Back Button */}
        {/* Removed Title */}

        {/* Dealer's Area */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-semibold mb-3 text-center">Dealer&apos;s Hand {gameStatus === 'dealerTurn' || gameStatus === 'gameOver' ? `(${dealerScore})` : ''}</h2>
          <div className="flex justify-center items-center gap-2 md:gap-4 min-h-[10rem] md:min-h-[12rem]">
            {dealerVisibleHand.map((card, index) => (
              <CardDisplay key={`dealer-${index}`} card={card} darkMode={darkMode} />
            ))}
            {/* Show hidden card placeholder */}
            {gameStatus !== 'dealerTurn' && gameStatus !== 'gameOver' && dealerHand.length > 1 && (
                 <CardDisplay card={null} hidden darkMode={darkMode} />
            )}
          </div>
        </div>

        {/* Player's Area */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-semibold mb-3 text-center">Your Hand ({playerScore})</h2>
          <div className="flex justify-center items-center flex-wrap gap-2 md:gap-4 min-h-[10rem] md:min-h-[12rem]">
            {playerHand.map((card, index) => (
              <CardDisplay key={`player-${index}`} card={card} darkMode={darkMode} />
            ))}
          </div>
        </div>

        {/* Game Status Message */}
        <div className="text-center text-lg md:text-xl font-medium mb-6 md:mb-8 h-8">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 md:gap-6">
          {gameOver ? (
            <button
              onClick={startGame}
              className={`${buttonStyle} ${primaryButtonStyle}`}
            >
              New Game
            </button>
          ) : (
            <>
              <button
                onClick={hit}
                disabled={gameStatus !== 'playerTurn' || playerScore >= 21}
                className={`${buttonStyle} ${secondaryButtonStyle}`}
              >
                Hit (Draw)
              </button>
              <button
                onClick={stand}
                disabled={gameStatus !== 'playerTurn'}
                className={`${buttonStyle} ${secondaryButtonStyle}`}
              >
                Stand
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
