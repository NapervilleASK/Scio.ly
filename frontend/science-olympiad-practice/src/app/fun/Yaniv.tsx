'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
import { motion } from 'framer-motion';
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
const YANIV_LIMIT = 20;

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

// --- UI Components ---
const CardDisplay = ({ card, hidden, darkMode, onClick, isSelected, showValue }: {
  card: Card | null;
  hidden?: boolean;
  darkMode: boolean;
  onClick?: () => void;
  isSelected?: string[];
  showValue?: boolean; // Show Yaniv value on card
}) => {
	console.log(card?.id)
  const cardBaseStyle = `w-20 h-28 md:w-24 md:h-36 rounded-lg border p-2 flex flex-col justify-between shadow-md transition-all duration-100 relative overflow-hidden`;
  const cardDarkStyle = ''//'bg-gray-700 border-gray-500 text-white';
  const cardLightStyle = 'bg-white border-gray-300 text-gray-900';
  const hiddenStyle = 'bg-gradient-to-br from-teal-500 to-cyan-600 border-teal-700';
  const selectedStyle = isSelected?.[0] === card?.id ? '' : 'bg-gray-700 border-gray-500 text-white'//'w-40 ring-4 ring-offset-2 ring-yellow-400 scale-105 -translate-y-2 shadow-xl' : '';
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
  const [discardPile, setDiscardPile] = useState<Card[]>([]); // Keep history
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [botHand, setBotHand] = useState<Card[]>([]);
  const [gamePhase, setGamePhase] = useState<'dealing' | 'playerDiscard' | 'playerDraw' | 'botTurn' | 'showdown' | 'roundOver'>('dealing');
  const [message, setMessage] = useState('Starting Round...');
  const [selectedCards, setSelectedCards] = useState<string[]>([]); // Store IDs of selected cards
  const [showdownHands, setShowdownHands] = useState<{ player: Card[], bot: Card[] } | null>(null);
  const [yanivCaller, setYanivCaller] = useState<'player' | 'bot' | null>(null);
  const [asaf, setAsaf] = useState(false); // Was the caller Asaf'd?

  // Memoized Calculations
  const playerHandValue = useMemo(() => calculateHandValue(playerHand), [playerHand]);
  const botHandValue = useMemo(() => calculateHandValue(botHand), [botHand]);
  const topDiscardCard = useMemo(() => discardPile.length > 0 ? discardPile[discardPile.length - 1] : null, [discardPile]);
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
    setMessage('Your turn: Select 1 card to discard or Call Yaniv!');
    setSelectedCards([]);
    setShowdownHands(null);
    setYanivCaller(null);
    setAsaf(false);
  }, []);

  // Start game on mount
  useEffect(() => {
    startGame();
  }, [startGame]);


  // Modified to handle single selection: Clicking a card selects it, clicking another swaps, clicking selected deselects.
  const handleCardSelect = (cardId: string) => {
    if (gamePhase !== 'playerDiscard') return;
    setSelectedCards(prev => {
        // If the clicked card is already selected, deselect it
        if (prev.includes(cardId)) {
            return [];
        }
        // Otherwise, select only the clicked card
        return [cardId];
    });
  };

  // Player discards selected card(s)
  const handlePlayerDiscard = () => {
    if (gamePhase !== 'playerDiscard') return; // Check phase

    if (selectedCards.length !== 1) { // Enforce exactly one card selected
         setMessage("Please select exactly one card to discard.");
         return;
    }

    const cardToDiscard = playerHand.find(card => card.id === selectedCards[0]);

    if (!cardToDiscard) {
        console.error("Selected card not found in hand");
        setSelectedCards([]); // Clear invalid selection
        return;
    }

    const remainingHand = playerHand.filter(card => card.id !== selectedCards[0]);

    setPlayerHand(remainingHand);
    setDiscardPile(prev => [...prev, cardToDiscard]); // Add the single selected card
    setSelectedCards([]); // Clear selection
    setGamePhase('playerDraw'); // Move to draw phase
    setMessage('Discarded. Now draw from Deck or Discard Pile.');
  };

  // Player draws from deck
  const handleDrawFromDeck = () => {
    if (gamePhase !== 'playerDraw') return;

    let currentDeck = [...deck];
    if (currentDeck.length === 0) {
      // Reshuffle logic
      if (discardPile.length <= 1) {
        setMessage("Deck empty, cannot draw!");
        // Potentially end round here if discard also can't be drawn? Or wait for bot.
        return;
      }
      const topCard = discardPile[discardPile.length - 1];
      const cardsToShuffle = discardPile.slice(0, -1);
      currentDeck = shuffleDeck(cardsToShuffle);
      setDiscardPile([topCard]);
      console.log("Reshuffled deck from discard pile.");
      if (currentDeck.length === 0) {
          setMessage("Deck empty even after reshuffle!");
          // End turn without draw if reshuffle yields nothing
          setMessage("Bot's turn...");
          setGamePhase('botTurn');
          setTimeout(botTurn, 1200);
          return;
      }
    }

    const drawnCard = currentDeck.pop()!;
    setPlayerHand(prev => [...prev, drawnCard]);
    setDeck(currentDeck);

    // End player turn
    setMessage("Bot's turn...");
    setGamePhase('botTurn');
    setTimeout(botTurn, 1200); // Give bot time to "think"
  };

  // Player draws from discard
  const handleDrawFromDiscard = () => {
    if (gamePhase !== 'playerDraw' || !topDiscardCard) return;

    // Player takes the top card from the discard pile
    const drawnCard = topDiscardCard;
    setPlayerHand(prev => [...prev, drawnCard]);
    setDiscardPile(prev => prev.slice(0, -1)); // Remove the drawn card

    // End player turn
    setMessage("Bot's turn...");
    setGamePhase('botTurn');
    setTimeout(botTurn, 1200);
  };

  const determineRoundOutcome = useCallback(async () => { // Make it async
    // Ensure hands are revealed for calculation
    const hands = showdownHands || { player: playerHand, bot: botHand };
    const pVal = calculateHandValue(hands.player);
    const bVal = calculateHandValue(hands.bot);
    let outcomeMessage = "";
    let pointsChange = 0;
    let wasAsaf = false;

    if (!yanivCaller) {
        console.error("Determining outcome without a Yaniv caller.");
        return; // Should not happen
    }

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
  }, [showdownHands, playerHand, botHand, yanivCaller, currentUser, onGameEnd]); // Dependencies: added currentUser, onGameEnd

  // Player calls Yaniv
  const handleCallYaniv = () => {
    if (!canPlayerCallYaniv) return;

    setMessage("You called Yaniv! Revealing hands...");
    setYanivCaller('player');
    setGamePhase('showdown');
    setShowdownHands({ player: playerHand, bot: botHand }); // Reveal hands
    // Use setTimeout to allow seeing the hands before the outcome message appears
    setTimeout(determineRoundOutcome, 1500);
  };

  // Bot's Turn Logic
  const botTurn = useCallback(() => {
    console.log("Bot turn started. Hand Value:", botHandValue);
    // 1. Check for Yaniv call
    if (botHandValue <= YANIV_LIMIT) {
      // Add delay before bot calls Yaniv
      setTimeout(() => {
          setMessage("Bot calls Yaniv! Revealing hands...");
          setYanivCaller('bot');
          setGamePhase('showdown');
          setShowdownHands({ player: playerHand, bot: botHand });
          // Add another delay before showing outcome
          setTimeout(determineRoundOutcome, 1500);
      }, 1000); // Delay for bot's Yaniv call decision
      return; // Stop further execution for this turn
    }

    // 2. Decide what to discard (simple: highest value card)
    let cardToDiscard: Card | null = null;
    if (botHand.length > 0) {
      cardToDiscard = botHand.reduce((highest, card) =>
        card.value > highest.value ? card : highest, botHand[0]
      );
    }

    if (!cardToDiscard) {
        console.error("Bot has no card to discard?");
        setMessage("Your turn.");
        setGamePhase('playerDiscard');
        return;
    }

     // Discard the card - state update happens later after draw decision
    const newBotHandAfterDiscard = botHand.filter(card => card.id !== cardToDiscard!.id);
    const newDiscardPileAfterBot = [...discardPile, cardToDiscard]; // Temporarily add bot discard
    console.log("Bot discards:", cardToDiscard.themeName, cardToDiscard.value);

    // 3. Decide what to draw
    let drawFromDiscard = false;
    const potentialDrawFromDiscard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null; // Card available before bot discarded

    if (potentialDrawFromDiscard && potentialDrawFromDiscard.value <= 5) {
        drawFromDiscard = true;
    }

    let finalBotHand = newBotHandAfterDiscard;
    let finalDeck = [...deck];
    let finalDiscardPile = newDiscardPileAfterBot; // Start with bot's card on top
    let drawnCard: Card | null = null;

    if (drawFromDiscard) {
      drawnCard = potentialDrawFromDiscard!;
      finalBotHand = [...newBotHandAfterDiscard, drawnCard];
      // Discard pile now only contains the card the bot just discarded (potentialDraw is removed)
      finalDiscardPile = finalDiscardPile.slice(0, -1); // Remove the drawn card (which was under the bot's discard)
      console.log("Bot draws from discard:", drawnCard.themeName);
    } else {
      // Draw from deck
      if (finalDeck.length === 0) {
           if (finalDiscardPile.length <= 1) { // Cannot reshuffle if only bot's card is there
                setMessage("Deck empty, bot cannot draw! Your turn.");
                 // Update state with just the discard action
                 setBotHand(newBotHandAfterDiscard);
                 setDiscardPile(finalDiscardPile);
                 setGamePhase('playerDiscard');
                return;
           }
          const topCard = finalDiscardPile[finalDiscardPile.length - 1]; // Keep bot's discard
          const cardsToShuffle = finalDiscardPile.slice(0, -1); // Shuffle cards under bot's discard
          finalDeck = shuffleDeck(cardsToShuffle);
          finalDiscardPile = [topCard]; // Reset discard pile to just bot's discard
          console.log("Bot reshuffled deck.");
           if (finalDeck.length === 0) {
                setMessage("Deck empty even after reshuffle! Your turn.");
                setBotHand(newBotHandAfterDiscard);
                setDiscardPile(finalDiscardPile);
                setGamePhase('playerDiscard');
                return;
           }
      }
      drawnCard = finalDeck.pop()!;
      finalBotHand = [...newBotHandAfterDiscard, drawnCard];
      console.log("Bot draws from deck:", drawnCard.themeName);
    }

     // 4. Update State & End Turn - apply all changes together
     setTimeout(() => {
        setBotHand(finalBotHand);
        setDeck(finalDeck);
        setDiscardPile(finalDiscardPile); // Update discard pile after draw decision
        setMessage("Bot finished turn. Your turn: Select 1 card to discard or Call Yaniv!");
        setGamePhase('playerDiscard');
     }, 800); // Delay after bot draws

  }, [botHand, deck, discardPile, botHandValue, playerHand, determineRoundOutcome]); // Added determineRoundOutcome

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

           {/* Deck and Discard Pile Area */}
           {/* Changed items-end to items-center for vertical alignment */}
            <div className="flex justify-center items-center gap-6 md:gap-10 w-full">
                {/* Deck */}
                 <div className="text-center">
                     <p className="font-semibold mb-1">Deck ({deck.length})</p>
                      <CardDisplay
                          card={null} hidden
                          darkMode={darkMode}
                          onClick={gamePhase === 'playerDraw' ? handleDrawFromDeck : undefined}
                      />
                 </div>
                 {/* Discard Pile */}
                 <div className="text-center">
                     <p className="font-semibold mb-1">Discard</p>
                      <div className="min-h-[8rem] md:min-h-[10rem] w-[5rem] md:w-[6rem] flex items-center justify-center">
                        {topDiscardCard ? (
                            <CardDisplay
                                card={topDiscardCard}
                                darkMode={darkMode}
                                onClick={gamePhase === 'playerDraw' ? handleDrawFromDiscard : undefined}
                            />
                        ) : (
                            <div className={`w-20 h-28 md:w-24 md:h-36 rounded-lg border-2 border-dashed ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
                        )}
                     </div>
                 </div>
            </div>

        </div>

         {/* Player Hand Area */}
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
                        isSelected={selectedCards}
                        showValue={!!showdownHands || gamePhase === 'roundOver'} // Also show value on round over
                    />
                ))}
                {playerHand.length === 0 && gamePhase !== 'roundOver' && <p className="text-lg italic text-center w-full">Hand is empty</p>}
            </div>
        </div>

        {/* Action Buttons Area */}
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
                    disabled={selectedCards.length !== 1} // Only allow discard if exactly 1 card is selected
                    className={`${buttonStyle} ${secondaryButtonStyle}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    Discard Selected
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
                        disabled={!topDiscardCard}
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
    </div>
  );
}
