'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged, User } from 'firebase/auth'; // Import Firebase Auth
import { auth } from '@/lib/firebase'; // Import auth instance
import { updateGamePoints } from '@/app/utils/gamepoints'; // Import game points utility

// --- Card Definitions ---
type Suit = 'Physics' | 'Chemistry' | 'Biology' | 'Astronomy';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

interface Card {
  id: string; // Unique ID for each card instance
  suit: Suit;
  rank: Rank;
  value: number; // Yaniv value
  themeName: string;
  suitIcon: string;
}

interface YanivGameProps {
  onGameEnd: () => void; // Define prop type for the callback
}

// --- Game Constants ---
const SUITS: Suit[] = ['Physics', 'Chemistry', 'Biology', 'Astronomy'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']; // Ace first for value mapping
const SUIT_ICONS: Record<Suit, string> = {
  Physics: '⚛️', Chemistry: '🧪', Biology: '🧬', Astronomy: '🔭',
};
const RANK_ORDER_MAP: Record<Rank, number> = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
};
// Yaniv Card Values & Themes
const RANK_THEMES_YANIV: Record<Rank, { themeName: string; value: number }> = {
  'A': { themeName: 'Atom', value: 1 }, // Ace is 1
  '2': { themeName: 'Helium (He)', value: 2 },
  '3': { themeName: 'Lithium (Li)', value: 3 },
  '4': { themeName: 'Beryllium (Be)', value: 4 },
  '5': { themeName: 'Boron (B)', value: 5 },
  '6': { themeName: 'Carbon (C)', value: 6 },
  '7': { themeName: 'Nitrogen (N)', value: 7 },
  '8': { themeName: 'Oxygen (O)', value: 8 },
  '9': { themeName: 'Fluorine (F)', value: 9 },
  '10': { themeName: 'Neon (Ne)', value: 10 },
  'J': { themeName: 'Newton', value: 10 }, // Face cards are 10
  'Q': { themeName: 'Curie', value: 10 },
  'K': { themeName: 'Darwin', value: 10 },
};
const YANIV_LIMIT = 7; // Standard Yaniv limit is often 7 or 5, let's use 7
const MIN_RUN_LENGTH = 3; // Minimum cards for a consecutive suit run

// --- Utility Functions ---
const createDeck = (): Card[] => {
  const deck: Card[] = [];
  let idCounter = 0;
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const themeInfo = RANK_THEMES_YANIV[rank];
      deck.push({
        id: `card-${idCounter++}`,
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

const calculateHandValue = (hand: Card[]): number => {
  return hand.reduce((sum, card) => sum + card.value, 0);
};

// --- NEW: Validation Function ---
const isValidDiscardSet = (selectedSet: Card[]): boolean => {
    if (selectedSet.length === 0) return false;
    if (selectedSet.length === 1) return true; // Single card is always valid

    // Check for same rank
    const firstRank = selectedSet[0].rank;
    const allSameRank = selectedSet.every(card => card.rank === firstRank);
    if (allSameRank) return true;

    // Check for consecutive suit run (minimum length MIN_RUN_LENGTH)
    if (selectedSet.length < MIN_RUN_LENGTH) return false; // Must meet minimum length for a run

    const firstSuit = selectedSet[0].suit;
    const allSameSuit = selectedSet.every(card => card.suit === firstSuit);
    if (!allSameSuit) return false;

    // Sort by rank order for sequence check
    const sortedSet = [...selectedSet].sort((a, b) => RANK_ORDER_MAP[a.rank] - RANK_ORDER_MAP[b.rank]);

    for (let i = 0; i < sortedSet.length - 1; i++) {
        if (RANK_ORDER_MAP[sortedSet[i+1].rank] !== RANK_ORDER_MAP[sortedSet[i].rank] + 1) {
            return false; // Ranks are not consecutive
        }
    }

    return true; // It's a valid consecutive run
};

// --- NEW: Bot AI Helper ---
const findBestBotDiscard = (hand: Card[]): Card[] => {
    if (hand.length === 0) return [];

    let bestDiscard: Card[] = [];
    let lowestRemainingValue = Infinity;

    // Helper to calculate remaining value
    const calculateRemainingValue = (discardSet: Card[]) => {
        const remainingHand = hand.filter(card => !discardSet.find(d => d.id === card.id));
        return calculateHandValue(remainingHand);
    };

    // 1. Check for same rank sets (>= 2 cards)
    const ranks: { [key: string]: Card[] } = {};
    hand.forEach(card => {
        if (!ranks[card.rank]) ranks[card.rank] = [];
        ranks[card.rank].push(card);
    });

    for (const rank in ranks) {
        if (ranks[rank].length >= 2) {
            const currentSet = ranks[rank];
            const remainingValue = calculateRemainingValue(currentSet);
            if (remainingValue < lowestRemainingValue) {
                lowestRemainingValue = remainingValue;
                bestDiscard = currentSet;
            } else if (remainingValue === lowestRemainingValue && currentSet.length > bestDiscard.length) {
                // Prefer discarding more cards if values are equal
                bestDiscard = currentSet;
            }
        }
    }

    // 2. Check for consecutive suit runs (>= MIN_RUN_LENGTH)
    const suits: { [key: string]: Card[] } = {};
    hand.forEach(card => {
        if (!suits[card.suit]) suits[card.suit] = [];
        suits[card.suit].push(card);
    });

    for (const suit in suits) {
        if (suits[suit].length >= MIN_RUN_LENGTH) {
            const sortedSuitHand = [...suits[suit]].sort((a, b) => RANK_ORDER_MAP[a.rank] - RANK_ORDER_MAP[b.rank]);

            // Find all possible runs within this suit
            for (let i = 0; i <= sortedSuitHand.length - MIN_RUN_LENGTH; i++) {
                for (let len = MIN_RUN_LENGTH; len <= sortedSuitHand.length - i; len++) {
                    const potentialRun = sortedSuitHand.slice(i, i + len);
                    let isRun = true;
                    for (let j = 0; j < potentialRun.length - 1; j++) {
                        if (RANK_ORDER_MAP[potentialRun[j+1].rank] !== RANK_ORDER_MAP[potentialRun[j].rank] + 1) {
                            isRun = false;
                            break;
                        }
                    }

                    if (isRun) {
                        const remainingValue = calculateRemainingValue(potentialRun);
                        if (remainingValue < lowestRemainingValue) {
                            lowestRemainingValue = remainingValue;
                            bestDiscard = potentialRun;
                         } else if (remainingValue === lowestRemainingValue && potentialRun.length > bestDiscard.length) {
                             // Prefer discarding more cards if values are equal
                            bestDiscard = potentialRun;
                        }
                    }
                }
            }
        }
    }

    // 3. If no beneficial set/run found, discard the highest value single card
    if (bestDiscard.length === 0 && hand.length > 0) {
        bestDiscard = [hand.reduce((highest, card) =>
            card.value > highest.value ? card : highest, hand[0]
        )];
    }

    return bestDiscard;
};

// --- UI Components ---
const CardDisplay = ({ card, hidden, darkMode, onClick, isSelected, showValue }: {
  card: Card | null;
  hidden?: boolean;
  darkMode: boolean;
  onClick?: () => void;
  isSelected?: boolean; // Changed isSelected to boolean for simplicity with multi-select
  showValue?: boolean; // Show Yaniv value on card
}) => {
	console.log(card?.id)
  const cardBaseStyle = `w-20 h-28 md:w-24 md:h-36 rounded-lg border p-2 flex flex-col justify-between shadow-md transition-all duration-100 relative overflow-hidden`;
  const cardDarkStyle = ''//'bg-gray-700 border-gray-500 text-white';
  const cardLightStyle = 'bg-white border-gray-300 text-gray-900';
  const hiddenStyle = 'bg-gradient-to-br from-teal-500 to-cyan-600 border-teal-700';
  const selectedStyle = isSelected ? 'bg-black' : 'bg-gray-800'; // Add z-10
  const clickableStyle = onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : 'cursor-default';

  if (hidden || !card) {
    return (
      <motion.div
        layout // Enable layout animations even for hidden/placeholder
        className={`${cardBaseStyle} ${darkMode ? 'bg-gray-600 border-gray-400' : hiddenStyle} ${clickableStyle}`} // Apply clickable style to deck/placeholder
        onClick={onClick} // Allow clicking deck
        whileHover={onClick ? { scale: 1.03, y: -2 } : {}} // Subtle hover for deck
        whileTap={onClick ? { scale: 0.97 } : {}}
      >
      </motion.div>
    );
  }

  const rankColor = ['Physics', 'Astronomy'].includes(card.suit)
    ? (darkMode ? 'text-blue-300' : 'text-blue-700')
    : (darkMode ? 'text-red-300' : 'text-red-700');

  return (
    <motion.div
      layoutId={card.id}
      className={`${selectedStyle} ${cardBaseStyle} ${darkMode ? cardDarkStyle : cardLightStyle}  ${clickableStyle}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 20 }}
      whileHover={onClick ? { y: -5, scale: 1.04, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' } : {}}
    >
      {showValue && (
        <span className={`absolute top-1 right-1 text-xs font-bold px-1 py-0.5 rounded ${darkMode ? 'bg-gray-600/80' : 'bg-gray-200/80'}`}>
            {card.value}
        </span>
      )}
      <div className="text-left">
        <div className={`font-bold text-lg ${rankColor}`}>{card.rank}</div>
        <div className="text-xl">{card.suitIcon}</div>
      </div>
      <div className={`text-center text-[10px] font-semibold break-words ${rankColor}`}>
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
export default function YanivGame({ onGameEnd }: YanivGameProps) {
  const { darkMode } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null); // State for Firebase user

  // Game State
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]); // Main discard pile
  const [playerJustDiscarded, setPlayerJustDiscarded] = useState<Card[] | null>(null); // Cards player just discarded THIS turn
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [botHand, setBotHand] = useState<Card[]>([]);
  const [gamePhase, setGamePhase] = useState<'dealing' | 'playerDiscard' | 'playerDraw' | 'botTurn' | 'showdown' | 'roundOver'>('dealing');
  const [message, setMessage] = useState('Starting Round...');
  const [selectedCards, setSelectedCards] = useState<string[]>([]); // Store IDs of selected cards
  const [showdownHands, setShowdownHands] = useState<{ player: Card[], bot: Card[] } | null>(null);
  const [asaf, setAsaf] = useState(false); // Was the caller Asaf'd?
  const [showHelpTooltip, setShowHelpTooltip] = useState(false); // State for help tooltip

  // Memoized Calculations
  const playerHandValue = useMemo(() => calculateHandValue(playerHand), [playerHand]);
  const botHandValue = useMemo(() => calculateHandValue(botHand), [botHand]);
  // Top card of the MAIN pile (available for drawing)
  const topMainDiscardCard = useMemo(() => discardPile.length > 0 ? discardPile[discardPile.length - 1] : null, [discardPile]);
  const canPlayerCallYaniv = useMemo(() => playerHandValue <= YANIV_LIMIT && gamePhase === 'playerDiscard', [playerHandValue, gamePhase]);

  // --- Game Logic Functions ---

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const startGame = useCallback(() => {
    const newDeck = shuffleDeck(createDeck());
    const pHand: Card[] = [];
    const bHand: Card[] = [];

    for (let i = 0; i < 5; i++) {
      pHand.push(newDeck.pop()!);
      bHand.push(newDeck.pop()!);
    }

    const firstDiscard = newDeck.pop()!;

    setDeck(newDeck);
    setDiscardPile([firstDiscard]);
    setPlayerHand(pHand);
    setBotHand(bHand);
    setGamePhase('playerDiscard'); // Player starts by choosing discard
    setMessage('Your turn: Select card(s) to discard or Call Yaniv!'); // Updated message
    setSelectedCards([]);
    setShowdownHands(null);
    setAsaf(false);
    setPlayerJustDiscarded(null); // Reset temporary discard
  }, []);

  // Start game on mount
  useEffect(() => {
    startGame();
  }, [startGame]);

  // Allow selecting/deselecting multiple cards
  const handleCardSelect = (cardId: string) => {
    if (gamePhase !== 'playerDiscard') return;
    setSelectedCards(prev => {
        if (prev.includes(cardId)) {
            return prev.filter(id => id !== cardId); // Deselect
        } else {
            return [...prev, cardId]; // Select
        }
    });
  };

  // Player discards selected card(s) - UPDATED LOGIC
  const handlePlayerDiscard = () => {
    if (gamePhase !== 'playerDiscard' || selectedCards.length === 0) return;

    const cardsToDiscard = playerHand.filter(card => selectedCards.includes(card.id));

    if (!isValidDiscardSet(cardsToDiscard)) {
         setMessage(`Invalid discard set. Select a single card, cards of the same rank, or ${MIN_RUN_LENGTH}+ consecutive cards of the same suit.`);
         return;
    }

    const remainingHand = playerHand.filter(card => !selectedCards.includes(card.id));

    setPlayerHand(remainingHand);
    setPlayerJustDiscarded(cardsToDiscard); // Move to temporary state
    setSelectedCards([]); // Clear selection
    setGamePhase('playerDraw'); // Move to draw phase
    setMessage('Discarded. Now draw from Deck or Main Discard Pile.');
  };

  // Player draws from deck - UPDATED LOGIC
  const handleDrawFromDeck = () => {
    if (gamePhase !== 'playerDraw') return;

    let currentDeck = [...deck];
    const cardsToReshuffle = discardPile; // Use main pile for reshuffle

    if (currentDeck.length === 0) {
      // Reshuffle logic (using main discard pile)
      if (cardsToReshuffle.length <= 1) {
        setMessage("Deck empty, cannot draw!");
        // If draw fails, still need to merge the player's discard
        if (playerJustDiscarded) {
            setDiscardPile(currentPile => [...currentPile, ...playerJustDiscarded]);
            setPlayerJustDiscarded(null);
        }
        setMessage("Bot's turn..."); // Or maybe player's turn again if bot can't play? Yaniv rules vary. Let's go to bot.
        setGamePhase('botTurn');
        setTimeout(botTurn, 1200);
        return;
      }
      const topCard = cardsToReshuffle[cardsToReshuffle.length - 1];
      const baseCards = cardsToReshuffle.slice(0, cardsToReshuffle.length > 0 ? -1 : 0);
      currentDeck = shuffleDeck(baseCards);
      setDiscardPile(topCard ? [topCard] : []); // Keep only top card if it exists
      console.log("Reshuffled deck from discard pile.");
      if (currentDeck.length === 0) {
          setMessage("Deck empty even after reshuffle!");
          // Merge discard and end turn
          if (playerJustDiscarded) {
              setDiscardPile(currentPile => [...currentPile, ...playerJustDiscarded]);
              setPlayerJustDiscarded(null);
          }
          setMessage("Bot's turn...");
          setGamePhase('botTurn');
          setTimeout(botTurn, 1200);
          return;
      }
    }

    const drawnCard = currentDeck.pop()!;
    setPlayerHand(prev => [...prev, drawnCard]);
    setDeck(currentDeck);

    // End player turn - MERGE DISCARD HERE
    if (playerJustDiscarded) {
        // Ensure discardPile update uses the functional form if potentially stale
        setDiscardPile(currentPile => [...currentPile, ...playerJustDiscarded]); // Add discarded cards to main pile (no sort)
        setPlayerJustDiscarded(null); // Clear temporary pile
    }
    setMessage("Bot's turn...");
    setGamePhase('botTurn');
    setTimeout(botTurn, 1200);
  };

  // Player draws from MAIN discard pile - UPDATED LOGIC
  const handleDrawFromDiscard = () => {
    // Can only draw from the main pile's top card
    if (gamePhase !== 'playerDraw' || !topMainDiscardCard) return;

    // Player takes the top card from the MAIN discard pile
    const drawnCard = topMainDiscardCard;
    setPlayerHand(prev => [...prev, drawnCard]);
    setDiscardPile(prev => prev.slice(0, -1)); // Remove the drawn card from MAIN pile

    // End player turn - MERGE DISCARD HERE
    if (playerJustDiscarded) {
        // Ensure discardPile update uses the functional form if potentially stale
        setDiscardPile(currentPile => [...currentPile, ...playerJustDiscarded]); // Add player's discarded cards to main pile (no sort)
        setPlayerJustDiscarded(null); // Clear temporary pile
    }
    setMessage("Bot's turn...");
    setGamePhase('botTurn');
    setTimeout(botTurn, 1200);
  };

  const determineRoundOutcome = useCallback(async yanivCaller => { // Make it async
    // Ensure hands are revealed for calculation
    const hands = showdownHands || { player: playerHand, bot: botHand };
    const pVal = calculateHandValue(hands.player);
    const bVal = calculateHandValue(hands.bot);
    let outcomeMessage = "";
    let pointsChange = 0;
    let wasAsaf = false;

    console.log(`Showdown! Caller: ${yanivCaller}, Player: ${pVal}, Bot: ${bVal}`);

    if (yanivCaller === 'player') {
      if (bVal <= pVal) { // Bot had lower or equal score - Asaf! Note the <=
        outcomeMessage = `Asaf! Bot had ${bVal} (Your ${pVal}). You get -2 points!`;
        pointsChange = -2; // Penalty for Asaf
        wasAsaf = true;
      } else { // Player successfully called Yaniv
        outcomeMessage = `Yaniv successful! Your score: ${pVal}, Bot score: ${bVal}. You get +1 point.`;
        pointsChange = 1; // Reward for successful Yaniv
      }
    } else { // Bot called Yaniv
      if (pVal <= bVal) { // Player had lower or equal score - Asaf! Note the <=
        outcomeMessage = `Asaf! You had ${pVal} (Bot ${bVal}). Bot gets penalized. You get +2 points!`;
        pointsChange = 2; // Reward for causing Asaf
        wasAsaf = true;
      } else { // Bot successfully called Yaniv
        outcomeMessage = `Bot called Yaniv! Bot score: ${bVal}, Your score: ${pVal}. You get -1 point.`;
        pointsChange = -1; // Penalty for opponent's success
      }
    }

    setMessage(outcomeMessage);
    setGamePhase('roundOver');
    setAsaf(wasAsaf); // Set Asaf state

    // --- Update Game Points ---
    console.log("Round over. Updating score..."); // DEBUG
    await updateGamePoints(currentUser?.uid || null, pointsChange);
    console.log("Score update complete (Yaniv). Calling onGameEnd..."); // DEBUG
    onGameEnd();
     // --- End Game Points Update ---
  }, [showdownHands, playerHand, botHand, currentUser, onGameEnd]); // Dependencies based on current code

  // Player calls Yaniv
  const handleCallYaniv = () => {
    if (!canPlayerCallYaniv) return;

    setMessage("You called Yaniv! Revealing hands...");
    setGamePhase('showdown');
    setShowdownHands({ player: playerHand, bot: botHand }); // Reveal hands
    // Use setTimeout to allow seeing the hands before the outcome message appears
    setTimeout(() => determineRoundOutcome('player'), 1500);
  };

  // Bot's Turn Logic
  const botTurn = useCallback(() => {
    console.log("Bot turn started. Hand Value:", botHandValue);
    // 1. Check for Yaniv call
    if (botHandValue <= YANIV_LIMIT) {
      // Add delay before bot calls Yaniv
      setTimeout(() => {
          setMessage("Bot calls Yaniv! Revealing hands...");
          setGamePhase('showdown');
          setShowdownHands({ player: playerHand, bot: botHand });
          // Add another delay before showing outcome
          setTimeout(() => determineRoundOutcome('bot'), 1500);
      }, 1000); // Delay for bot's Yaniv call decision
      return; // Stop further execution for this turn
    }

    // 2. Decide what to discard using the new AI logic
    const cardsToDiscard = findBestBotDiscard(botHand);

    if (!cardsToDiscard || cardsToDiscard.length === 0) {
        console.error("Bot has no cards or failed to find a discard?");
        setMessage("Your turn.");
        setGamePhase('playerDiscard');
        return; // Bot cannot play
    }

    const newBotHandAfterDiscard = botHand.filter(card => !cardsToDiscard.find(d => d.id === card.id));
    console.log("Bot wants to discard:", cardsToDiscard.map(c => `${c.rank}${c.suitIcon}(${c.value})`).join(', '));


    // 3. Decide what to draw (BEFORE actually modifying the discard pile state)
    let drawFromDiscard = false;
    const potentialDrawFromDiscard = topMainDiscardCard; // Use memoized top card

    // --- UPDATED DRAW CONDITION ---
    if (potentialDrawFromDiscard && potentialDrawFromDiscard.value <= 7) {
        // Check if drawing this card improves the hand more than drawing from deck (simple check: value <= 7)
        // A more complex check could involve seeing if it completes a set/run, but let's stick to value for now.
        drawFromDiscard = true;
    }

    let finalBotHand = newBotHandAfterDiscard;
    let finalDeck = [...deck];
    let finalDiscardPile = [...discardPile]; // Start with current discard pile
    let drawnCard: Card | null = null;

    if (drawFromDiscard) {
      drawnCard = potentialDrawFromDiscard!;
      finalBotHand = [...newBotHandAfterDiscard, drawnCard];
      finalDiscardPile = finalDiscardPile.slice(0, -1); // Remove the drawn card from MAIN pile
      console.log("Bot draws from discard:", drawnCard.themeName);
    } else {
      // Draw from deck
      if (finalDeck.length === 0) {
           // Reshuffle logic: Use the discard pile *before* bot adds its cards
           if (finalDiscardPile.length < 1) { // Need at least one card to reshuffle (or leave as is)
                setMessage("Deck empty, bot cannot draw! Your turn.");
                 // Update state with just the discard action
                 setBotHand(newBotHandAfterDiscard);
                 // Add bot's discard to the current discard pile state
                 setDiscardPile(currentPile => [...currentPile, ...cardsToDiscard]); // Add discarded cards (no sort)
                 setGamePhase('playerDiscard');
                return; // Exit before the setTimeout
           }
          const topCard = finalDiscardPile.length > 0 ? finalDiscardPile[finalDiscardPile.length - 1] : null;
          const baseCards = finalDiscardPile.length > 0 ? finalDiscardPile.slice(0, -1) : [];

          // Ensure baseCards are actually available to shuffle
          if (baseCards.length === 0) {
              setMessage("Deck empty, nothing to reshuffle! Your turn.");
              setBotHand(newBotHandAfterDiscard);
              // Keep original top card (if any) and add bot's discard
              // topCard here is the actual last card from the original pile BEFORE bot discards
              const pileAfterDiscard = [...(topCard ? [topCard] : []), ...cardsToDiscard];
              // Set pile to top card + bot's discard (no sort)
              setDiscardPile(pileAfterDiscard); // Direct set is fine here as it's based on calculated value, not prev state
              setGamePhase('playerDiscard');
              return; // Exit before the setTimeout
          }

          finalDeck = shuffleDeck(baseCards);
          finalDiscardPile = topCard ? [topCard] : []; // Keep only the top card on the discard pile
          console.log("Bot reshuffled deck.");
           if (finalDeck.length === 0) {
                setMessage("Deck empty even after reshuffle! Your turn.");
                setBotHand(newBotHandAfterDiscard);
                 // finalDiscardPile here is the reshuffled pile's top card (if any)
                 // Add bot's discard to the single top card kept from before shuffle
                 setDiscardPile([...finalDiscardPile, ...cardsToDiscard]); // No sort, direct set fine
                setGamePhase('playerDiscard');
                return; // Exit before the setTimeout
           }
      }
      drawnCard = finalDeck.pop()!;
      finalBotHand = [...newBotHandAfterDiscard, drawnCard];
      console.log("Bot draws from deck:", drawnCard.themeName);
    }

     // 4. Update State & End Turn - Add bot's discarded cards AFTER draw decision
     setTimeout(() => {
        setBotHand(finalBotHand);
        setDeck(finalDeck);
        // Add the cards bot chose to discard onto the pile
        // finalDiscardPile here is the pile AFTER draw decision (original pile minus drawn card, or reshuffled pile's top card)
        setDiscardPile([...finalDiscardPile, ...cardsToDiscard]); // No sort, direct set fine
        setMessage("Bot finished turn. Your turn: Select card(s) to discard or Call Yaniv!");
        setGamePhase('playerDiscard');
     }, 800); // Delay after bot draws

  }, [botHand, deck, discardPile, botHandValue, playerHand, determineRoundOutcome, topMainDiscardCard]); // Added topMainDiscardCard dependency

  // Determine round outcome after Yaniv call

  const buttonStyle = `px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base`;
  const primaryButtonStyle = darkMode
    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
    : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white';
  const secondaryButtonStyle = darkMode
    ? 'bg-gray-600 hover:bg-gray-500 text-white'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
   const yanivButtonStyle = `px-6 py-3 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${darkMode ? 'bg-yellow-600 hover:bg-yellow-500 text-black' : 'bg-yellow-400 hover:bg-yellow-500 text-black'}`;


  // --- Render ---
  return (
    <div className={`p-4 md:p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Game Info Area */}
        <div className={`text-center mb-4 p-3 rounded-lg min-h-[4rem] flex flex-col items-center justify-center ${darkMode ? 'bg-gray-800/70' : 'bg-white/80 shadow-sm'} ${asaf && gamePhase === 'roundOver' ? (darkMode ? 'ring-2 ring-red-500' : 'ring-2 ring-red-400') : ''}`}>
            <p className="text-lg md:text-xl font-medium">{message}</p>
            {asaf && gamePhase === 'roundOver' && <p className='text-red-500 font-bold mt-1'>ASAF!</p>}
        </div>

        {/* Game Board Area - Centered Deck/Discard, Bot hand above, Player hand below */}
        <div className="flex flex-col items-center gap-6 md:gap-8 mb-6">

          {/* Bot Hand Area */}
          <div className="flex flex-col items-center w-full">
              <p className="font-semibold mb-2">Bot&apos;s Hand ({botHand.length})</p>
              <div className="flex justify-center flex-wrap gap-[-30px] md:gap-[-40px] min-h-[8rem] md:min-h-[10rem] max-w-lg">
                 {botHand.map((card, index) => (
                     <div key={`bot-card-${index}-${card.id}`} className="relative" style={{ zIndex: index, marginLeft: index > 0 ? '-40px' : '0' }}>
                         <CardDisplay card={showdownHands ? card : null} hidden={!showdownHands} darkMode={darkMode} showValue={!!showdownHands} />
                     </div>
                 ))}
                  {botHand.length === 0 && gamePhase !== 'roundOver' && <p className="text-sm italic">No cards</p>}
              </div>
               {showdownHands && <p className="mt-2 font-semibold">Bot Hand Value: {calculateHandValue(botHand)}</p>}
          </div>

           {/* Deck and Discard Pile Area - UPDATED */}
            <div className="flex justify-center items-center gap-4 md:gap-6 w-full">
                {/* Deck */}
                 <div className="text-center">
                     <p className="font-semibold mb-1">Deck ({deck.length})</p>
                      <CardDisplay
                          card={null} hidden
                          darkMode={darkMode}
                          onClick={gamePhase === 'playerDraw' ? handleDrawFromDeck : undefined}
                      />
                 </div>

                 {/* Main Discard Pile */}
                 <div className="text-center">
                     <p className="font-semibold mb-1">Discard</p>
                      <div className="min-h-[8rem] md:min-h-[10rem] w-[5rem] md:w-[6rem] flex items-center justify-center">
                        {topMainDiscardCard ? (
                            <CardDisplay
                                card={topMainDiscardCard}
                                darkMode={darkMode}
                                onClick={gamePhase === 'playerDraw' ? handleDrawFromDiscard : undefined} // Only main pile is clickable
                            />
                        ) : (
                            <div className={`w-20 h-28 md:w-24 md:h-36 rounded-lg border-2 border-dashed ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
                        )}
                     </div>
                 </div>

                  {/* Player's Temporary Discard Pile (Visible during playerDraw phase) */}
                  {playerJustDiscarded && gamePhase === 'playerDraw' && (
                     <div className="text-center border-l pl-4 md:pl-6 ml-2 md:ml-4">
                         <p className="font-semibold mb-1">Your Discard</p>
                          <div className="min-h-[8rem] md:min-h-[10rem] flex items-center justify-center flex-wrap gap-1">
                              {/* Show the top card stack-like, maybe slightly offset */}
                              {playerJustDiscarded.map((card, index) => (
                                  <div key={`temp-discard-${card.id}`} className="relative" style={{ zIndex: playerJustDiscarded.length - index, marginLeft: index > 0 ? '-45px' : '0' }}>
                                       <CardDisplay card={card} darkMode={darkMode} />
                                  </div>
                              ))}
                          </div>
                     </div>
                  )}
            </div>

        </div>

         {/* Player Hand Area - Update isSelected prop */}
        <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-3 text-center">
                Your Hand ({playerHandValue})
            </h2>
            <div className="flex justify-center flex-wrap gap-2 md:gap-3 min-h-[10rem] items-end">
                {playerHand.map((card) => (
                    <CardDisplay
                        key={card.id}
                        card={card}
                        darkMode={darkMode}
                        onClick={() => handleCardSelect(card.id)}
                        isSelected={selectedCards.includes(card.id)} // Pass boolean
                        showValue={!!showdownHands || gamePhase === 'roundOver'}
                    />
                ))}
                {playerHand.length === 0 && gamePhase !== 'roundOver' && <p className="text-lg italic text-center w-full">Hand is empty</p>}
            </div>
        </div>

        {/* Action Buttons Area - Update Discard Button disabled logic */}
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 mt-4 min-h-[3rem]">
           {/* Yaniv Button */}
            {gamePhase === 'playerDiscard' && (
                <motion.button
                    key="yaniv-button" // Key for animation presence
                    onClick={handleCallYaniv}
                    disabled={!canPlayerCallYaniv}
                    className={yanivButtonStyle}
                    title={canPlayerCallYaniv ? "Call Yaniv!" : `Hand value must be ${YANIV_LIMIT} or less`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    Call Yaniv ({playerHandValue})
                </motion.button>
            )}

            {/* Discard Button */}
            {gamePhase === 'playerDiscard' && (
                <motion.button
                    key="discard-button"
                    onClick={handlePlayerDiscard}
                    disabled={selectedCards.length === 0} // Disabled only if nothing selected
                    className={`${buttonStyle} ${secondaryButtonStyle}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    Discard Selected ({selectedCards.length})
                </motion.button>
            )}

            {/* Draw Buttons */}
            {gamePhase === 'playerDraw' && (
                 <motion.div key="draw-buttons" className="flex gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <button
                        onClick={handleDrawFromDeck}
                        className={`${buttonStyle} ${secondaryButtonStyle}`}
                    >
                        Draw from Deck ({deck.length})
                    </button>
                    <button
                        onClick={handleDrawFromDiscard}
                        disabled={!topMainDiscardCard} // Only based on main pile
                        className={`${buttonStyle} ${secondaryButtonStyle}`}
                    >
                        Draw from Discard
                    </button>
                 </motion.div>
            )}

             {/* New Round Button */}
             {gamePhase === 'roundOver' && (
                 <motion.button
                    key="new-round-button"
                     onClick={startGame}
                     className={`${buttonStyle} ${primaryButtonStyle}`}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                 >
                     Start Next Round
                 </motion.button>
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
                <p className="font-semibold mb-1">How to Play Yaniv:</p>
                <p className="mb-2">
                  Goal: Get hand value to {YANIV_LIMIT} or less & call &apos;Yaniv!&apos;. Lowest score wins round.
                </p>
                <p className="mb-2">
                   Discard: Single card, multiple cards of same rank, or {MIN_RUN_LENGTH}+ consecutive cards of same suit.
                </p>
                <p className="mb-2">
                    Draw: From deck OR the single top card of discard pile.
                </p>
                <a
                  href="https://en.wikipedia.org/wiki/Yaniv_(card_game)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-medium underline ${darkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
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
