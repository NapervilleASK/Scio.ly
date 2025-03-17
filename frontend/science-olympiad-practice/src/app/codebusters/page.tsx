'use client';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
const XLSX = require('xlsx');

interface QuoteData {
    author: string;
    quote: string;
    encrypted: string;
    cipherType: 'aristocrat' | 'hill';
    key?: string;        // For aristocrat
    matrix?: number[][]; // For hill
    solution?: { [key: string]: string };
    frequencyNotes?: { [key: string]: string };
    hillSolution?: {
        matrix: string[][];
        plaintext: string;
    };
}

// Helper functions for both ciphers
const mod26 = (n: number): number => ((n % 26) + 26) % 26;
const letterToNumber = (letter: string): number => letter.toUpperCase().charCodeAt(0) - 65;
const numberToLetter = (num: number): string => String.fromCharCode(mod26(num) + 65);

// Aristocrat cipher with unique mapping
const encryptAristocrat = (text: string): { encrypted: string; key: string } => {
    // Generate a random substitution key where no letter maps to itself
    const generateKey = (): string => {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        let result = new Array(26);
        let available = [...alphabet];
        
        // For each position in the alphabet
        for (let i = 0; i < 26; i++) {
            // Remove the current letter from available options
            available = available.filter(char => char !== alphabet[i]);
            
            // Randomly select from remaining letters
            const randomIndex = Math.floor(Math.random() * available.length);
            result[i] = available[randomIndex];
            
            // Restore available letters except the one we just used
            available = [...alphabet].filter(char => 
                !result.includes(char) && char !== alphabet[i]
            );
        }
        
        return result.join('');
    };

    const key = generateKey();
    const encrypted = text.toUpperCase().replace(/[A-Z]/g, char => 
        key[letterToNumber(char)] || char
    );

    return { encrypted, key };
};

// Hill cipher with 2x2 matrix
const encryptHill = (text: string): { encrypted: string; matrix: number[][] } => {
    // List of verified invertible matrices mod 26
    const invertibleMatrices = [
        [[3, 2], [5, 7]],   // det = 11
        [[5, 3], [7, 2]],   // det = 11
        [[7, 2], [3, 5]],   // det = 29
        [[5, 7], [2, 3]],   // det = 1
        [[3, 5], [2, 7]]    // det = 11
    ];

    // Select a random invertible matrix
    const matrix = invertibleMatrices[Math.floor(Math.random() * invertibleMatrices.length)];
    
    // Clean and pad the text
    const cleanText = text.replace(/[^A-Za-z]/g, '').toUpperCase();
    const paddedText = cleanText.length % 2 === 0 ? cleanText : cleanText + 'X';
    
    let encrypted = '';
    
    // Encrypt pairs of letters
    for (let i = 0; i < paddedText.length; i += 2) {
        const pair = [letterToNumber(paddedText[i]), letterToNumber(paddedText[i + 1])];
        
        // Matrix multiplication
        const encryptedPair = [
            mod26(matrix[0][0] * pair[0] + matrix[0][1] * pair[1]),
            mod26(matrix[1][0] * pair[0] + matrix[1][1] * pair[1])
        ];
        
        encrypted += numberToLetter(encryptedPair[0]) + numberToLetter(encryptedPair[1]);
    }
    
    // Add spaces every 5 characters for readability
    encrypted = encrypted.match(/.{1,5}/g)?.join(' ') || encrypted;
    
    return { encrypted, matrix };
};

// New helper function to calculate letter frequencies
const getLetterFrequencies = (text: string): { [key: string]: number } => {
    const frequencies: { [key: string]: number } = {};
    // Initialize all letters to 0
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
        frequencies[letter] = 0;
    });
    // Count occurrences
    text.split('').forEach(char => {
        if (/[A-Z]/.test(char)) {
            frequencies[char]++;
        }
    });
    return frequencies;
};

// Frequency table component
const FrequencyTable = ({ 
    text, 
    quoteIndex,
    frequencyNotes,
    onNoteChange 
}: { 
    text: string;
    quoteIndex: number;
    frequencyNotes?: { [key: string]: string };
    onNoteChange: (letter: string, note: string) => void;
}) => {
    const { darkMode } = useTheme();
    const frequencies = getLetterFrequencies(text);
    
    return (
        <div className={`mt-4 p-2 rounded ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Frequency Analysis</p>
            <div className="flex justify-between space-x-1">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
                    <div key={letter} className="flex flex-col items-center">
                        <div className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{letter}</div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{frequencies[letter]}</div>
                        <input
                            type="text"
                            maxLength={1}
                            value={frequencyNotes?.[letter] || ''}
                            onChange={(e) => onNoteChange(letter, e.target.value)}
                            className={`w-6 h-6 text-center border rounded text-sm mt-1 ${
                                darkMode 
                                    ? 'bg-gray-800 border-gray-600 text-gray-300 focus:border-blue-500' 
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                            }`}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Hill cipher display component
const HillDisplay = ({ 
    text, 
    matrix, 
    quoteIndex,
    solution,
    onSolutionChange,
    isTestSubmitted,
    quotes 
}: { 
    text: string;
    matrix: number[][];
    quoteIndex: number;
    solution?: { matrix: string[][]; plaintext: string };
    onSolutionChange: (type: 'matrix' | 'plaintext', value: string[][] | string) => void;
    isTestSubmitted: boolean;
    quotes: QuoteData[];
}) => {
    const { darkMode } = useTheme();
    const quote = quotes[quoteIndex];
    
    // Create a mapping of positions to correct letters, preserving spaces and punctuation
    const correctMapping: { [key: number]: string } = {};
    if (isTestSubmitted) {
        let letterIndex = 0;
        const encryptedLetters = text.replace(/[^A-Z]/g, '');
        const originalQuote = quote.quote.toUpperCase();
        let plainTextIndex = 0;
        
        // Map each encrypted letter position to its corresponding plaintext letter
        for (let i = 0; i < text.length; i++) {
            if (/[A-Z]/.test(text[i])) {
                while (plainTextIndex < originalQuote.length) {
                    if (/[A-Z]/.test(originalQuote[plainTextIndex])) {
                        correctMapping[i] = originalQuote[plainTextIndex];
                        plainTextIndex++;
                        break;
                    }
                    plainTextIndex++;
                }
            }
        }
    }

    return (
        <div className="font-mono">
            {/* Matrix display section */}
            <div className="flex gap-8 mb-6">
                <div>
                    <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Encryption Matrix:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {matrix.map((row, i) => 
                            row.map((num, j) => (
                                <div key={`${i}-${j}`} className={`w-12 h-12 flex flex-col items-center justify-center border rounded ${
                                    darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                                }`}>
                                    <span className={`text-lg font-bold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{num}</span>
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>({numberToLetter(num)})</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div>
                    <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Decryption Matrix:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {[0, 1].map(i => 
                            [0, 1].map(j => (
                                <input
                                    key={`solution-${i}-${j}`}
                                    type="text"
                                    maxLength={2}
                                    disabled={isTestSubmitted}
                                    value={solution?.matrix?.[i]?.[j] || ''}
                                    onChange={(e) => {
                                        const newMatrix = solution?.matrix || [['', ''], ['', '']];
                                        newMatrix[i][j] = e.target.value;
                                        onSolutionChange('matrix', newMatrix);
                                    }}
                                    className={`w-12 h-12 text-center border rounded text-lg ${
                                        darkMode 
                                            ? 'bg-gray-800 border-gray-600 text-gray-300 focus:border-blue-500' 
                                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                                    }`}
                                    placeholder="?"
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Encrypted text and solution section */}
            <div className="flex flex-wrap gap-y-8">
                {text.split('').map((char, i) => {
                    const isLetter = /[A-Z]/.test(char);
                    const value = solution?.plaintext?.charAt(i) || '';
                    const correctLetter = isTestSubmitted && isLetter ? correctMapping[i] : '';
                    const isCorrect = value.toUpperCase() === correctLetter;

                    return (
                        <div key={i} className="flex flex-col items-center mx-0.5">
                            <span className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{char}</span>
                            {isLetter && (
                                <div className="relative h-14">
                                    <input
                                        type="text"
                                        maxLength={1}
                                        disabled={isTestSubmitted}
                                        value={value}
                                        onChange={(e) => {
                                            const newValue = e.target.value.toUpperCase();
                                            let newPlaintext = solution?.plaintext || '';
                                            while (newPlaintext.length <= i) {
                                                newPlaintext += ' ';
                                            }
                                            newPlaintext = newPlaintext.substring(0, i) + newValue + newPlaintext.substring(i + 1);
                                            onSolutionChange('plaintext', newPlaintext);
                                        }}
                                        className={`w-6 h-6 text-center border rounded mt-1 text-sm ${
                                            darkMode 
                                                ? 'bg-gray-800 border-gray-600 text-gray-300 focus:border-blue-500' 
                                                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                                        } ${
                                            isTestSubmitted
                                                ? isCorrect
                                                    ? 'border-green-500 bg-green-100/10'
                                                    : 'border-red-500 bg-red-100/10'
                                                : ''
                                        }`}
                                    />
                                    {isTestSubmitted && !isCorrect && correctLetter && (
                                        <div className={`absolute top-10 left-1/2 -translate-x-1/2 text-xs ${
                                            darkMode ? 'text-red-400' : 'text-red-600'
                                        }`}>
                                            {correctLetter}
                                        </div>
                                    )}
                                </div>
                            )}
                            {!/[A-Z]/.test(char) && <div className="w-6 h-14 mt-1" />}
                        </div>
                    );
                })}
            </div>

            {/* Show original quote after submission */}
            {isTestSubmitted && (
                <div className={`mt-8 p-4 rounded ${
                    darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}>
                    <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Original Quote:
                    </p>
                    <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {quote.quote}
                    </p>
                </div>
            )}
        </div>
    );
};

export default function CodeBusters() {
    const { darkMode, setDarkMode } = useTheme();
    const [showResources, setShowResources] = useState(false);
    const [quotes, setQuotes] = useState<QuoteData[]>([]);
    const [autoFill, setAutoFill] = useState(true);
    const [progress, setProgress] = useState<{ [key: number]: boolean }>({});
    const [showAnswers, setShowAnswers] = useState<{ [key: number]: boolean }>({});
    const [isTestSubmitted, setIsTestSubmitted] = useState(false);
    const [testScore, setTestScore] = useState<number | null>(null);

    // Calculate progress for each quote
    const calculateQuoteProgress = (quote: QuoteData, index: number): number => {
        if (quote.cipherType === 'aristocrat') {
            const totalLetters = [...new Set(quote.encrypted.match(/[A-Z]/g) || [])].length;
            const filledLetters = quote.solution ? Object.keys(quote.solution).length : 0;
            return totalLetters > 0 ? (filledLetters / totalLetters) * 100 : 0;
        } else {
            // For Hill cipher
            const matrixProgress = quote.hillSolution?.matrix.reduce((acc, row) => 
                acc + row.filter(cell => cell !== '').length, 0) || 0;
            const plaintextProgress = (quote.hillSolution?.plaintext.replace(/\s/g, '').length || 0) / 
                (quote.encrypted.replace(/\s/g, '').length || 1);
            return ((matrixProgress / 4) * 50) + (plaintextProgress * 50); // Weight matrix and plaintext equally
        }
    };

    // Calculate overall progress
    const totalProgress = quotes.reduce((acc, quote, index) => 
        acc + calculateQuoteProgress(quote, index), 0) / (quotes.length || 1);

    // Handle submitting the entire test
    const handleSubmitTest = () => {
        let correctCount = 0;
        const results = quotes.map((quote, index) => {
            let isCorrect = false;
            if (quote.cipherType === 'aristocrat') {
                isCorrect = checkAristocratAnswer(index);
            } else {
                isCorrect = checkHillAnswer(index);
            }
            if (isCorrect) correctCount++;
            return isCorrect;
        });

        // Calculate score as percentage
        const score = (correctCount / quotes.length) * 100;
        setTestScore(score);
        setIsTestSubmitted(true);

        // Show all answers
        setShowAnswers(
            results.reduce((acc, _, index) => ({ ...acc, [index]: true }), {})
        );

        // Update progress
        setProgress(
            results.reduce((acc, isCorrect, index) => ({ ...acc, [index]: isCorrect }), {})
        );
    };

    // Handle checking answer for aristocrat cipher
    const checkAristocratAnswer = (quoteIndex: number): boolean => {
        const quote = quotes[quoteIndex];
        if (quote.cipherType !== 'aristocrat' || !quote.solution) return false;

        // Create a mapping from cipher text to plain text using the key
        const correctMapping: { [key: string]: string } = {};
        for (let i = 0; i < 26; i++) {
            const plainLetter = String.fromCharCode(65 + i);
            const cipherLetter = quote.key![i];
            correctMapping[cipherLetter] = plainLetter;
        }

        // Check if all mappings in the solution are correct
        const isCorrect = Object.entries(quote.solution).every(([cipher, plain]) => 
            correctMapping[cipher] === plain.toUpperCase()
        );

        setProgress(prev => ({
            ...prev,
            [quoteIndex]: isCorrect
        }));

        setShowAnswers(prev => ({
            ...prev,
            [quoteIndex]: true
        }));

        return isCorrect;
    };

    // Handle checking answer for Hill cipher
    const checkHillAnswer = (quoteIndex: number): boolean => {
        const quote = quotes[quoteIndex];
        if (quote.cipherType !== 'hill' || !quote.hillSolution) return false;

        // For Hill cipher, we'll check if the decrypted text matches the original quote
        const isCorrect = quote.hillSolution.plaintext.toUpperCase() === quote.quote.toUpperCase().replace(/[^A-Z]/g, '');

        setProgress(prev => ({
            ...prev,
            [quoteIndex]: isCorrect
        }));

        setShowAnswers(prev => ({
            ...prev,
            [quoteIndex]: true
        }));

        return isCorrect;
    };

    // Handle input change for aristocrat solution
    const handleSolutionChange = (quoteIndex: number, cipherLetter: string, plainLetter: string) => {
        setQuotes(prevQuotes => {
            const newQuotes = [...prevQuotes];
            const quote = newQuotes[quoteIndex];
            if (quote.cipherType === 'aristocrat') {
                quote.solution = {
                    ...quote.solution,
                    [cipherLetter]: plainLetter.toUpperCase()
                };
            }
            return newQuotes;
        });
    };

    // Handle frequency note change
    const handleFrequencyNoteChange = (quoteIndex: number, letter: string, note: string) => {
        setQuotes(prevQuotes => {
            const newQuotes = [...prevQuotes];
            const quote = newQuotes[quoteIndex];
            if (!quote.frequencyNotes) quote.frequencyNotes = {};
            quote.frequencyNotes[letter] = note.toUpperCase();
            return newQuotes;
        });
    };

    // Handle Hill cipher solution changes
    const handleHillSolutionChange = (quoteIndex: number, type: 'matrix' | 'plaintext', value: string[][] | string) => {
        setQuotes(prevQuotes => {
            const newQuotes = [...prevQuotes];
            const quote = newQuotes[quoteIndex];
            if (!quote.hillSolution) {
                quote.hillSolution = {
                    matrix: [['', ''], ['', '']],
                    plaintext: ''
                };
            }
            if (type === 'matrix') {
                quote.hillSolution.matrix = value as string[][];
            } else {
                quote.hillSolution.plaintext = value as string;
            }
            return newQuotes;
        });
    };

    // Component for displaying aristocrat cipher with input boxes
    const AristocratDisplay = ({ text, quoteIndex, solution, frequencyNotes }: { 
        text: string; 
        quoteIndex: number;
        solution?: { [key: string]: string };
        frequencyNotes?: { [key: string]: string };
    }) => {
        // Create mapping for correct answers
        const correctMapping: { [key: string]: string } = {};
        if (isTestSubmitted && quotes[quoteIndex].key) {
            for (let i = 0; i < 26; i++) {
                const plainLetter = String.fromCharCode(65 + i);
                const cipherLetter = quotes[quoteIndex].key![i];
                correctMapping[cipherLetter] = plainLetter;
            }
        }

        return (
            <div className="font-mono">
                <div className="flex flex-wrap gap-y-8">
                    {text.split('').map((char, i) => {
                        const isLetter = /[A-Z]/.test(char);
                        const value = autoFill 
                            ? solution?.[char] || ''
                            : solution?.[`${char}_${[...text].slice(0, i).filter(c => c === char).length}`] || '';
                        
                        const isCorrect = isLetter && value === correctMapping[char];
                        const showCorrectAnswer = isTestSubmitted && isLetter;
                        
                        return (
                            <div key={i} className="flex flex-col items-center mx-0.5">
                                <span className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{char}</span>
                                {isLetter && (
                                    <div className="relative h-14">
                                        <input
                                            type="text"
                                            maxLength={1}
                                            value={value}
                                            disabled={isTestSubmitted}
                                            onChange={(e) => handleSolutionChange(
                                                quoteIndex,
                                                char,
                                                e.target.value
                                            )}
                                            className={`w-6 h-6 text-center border rounded mt-1 text-sm ${
                                                darkMode 
                                                    ? 'bg-gray-800 border-gray-600 text-gray-300 focus:border-blue-500' 
                                                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                                            } ${
                                                showCorrectAnswer
                                                    ? isCorrect
                                                        ? 'border-green-500 bg-green-100/10'
                                                        : 'border-red-500 bg-red-100/10'
                                                    : ''
                                            }`}
                                        />
                                        {showCorrectAnswer && !isCorrect && (
                                            <div className={`absolute top-10 left-1/2 -translate-x-1/2 text-xs ${
                                                darkMode ? 'text-red-400' : 'text-red-600'
                                            }`}>
                                                {correctMapping[char]}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {!isLetter && <div className="w-6 h-14 mt-1" />}
                            </div>
                        );
                    })}
                </div>
                <FrequencyTable 
                    text={text}
                    quoteIndex={quoteIndex}
                    frequencyNotes={frequencyNotes}
                    onNoteChange={(letter, note) => handleFrequencyNoteChange(quoteIndex, letter, note)}
                />
            </div>
        );
    };

    useEffect(() => {
        const loadQuotes = async () => {
            try {
                const response = await fetch('/quotes.xlsx');
                const arrayBuffer = await response.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                const allQuotes = rows
                    .filter((row: any[]) => row.length >= 2)
                    .map((row: any[]) => ({
                        author: row[0],
                        quote: row[1],
                        encrypted: '',
                        cipherType: 'aristocrat' as const
                    }))
                    .filter(item => item.author && item.quote);

                // Randomly select and assign cipher types
                const shuffled = [...allQuotes].sort(() => Math.random() - 0.5);
                const selectedQuotes = [
                    ...shuffled.slice(0, 15).map(q => ({ ...q, cipherType: 'aristocrat' as const })),
                    ...shuffled.slice(15, 20).map(q => ({ ...q, cipherType: 'hill' as const }))
                ].sort(() => Math.random() - 0.5);

                // Encrypt each quote
                const encryptedQuotes = selectedQuotes.map(quote => {
                    if (quote.cipherType === 'aristocrat') {
                        const { encrypted, key } = encryptAristocrat(quote.quote);
                        return { ...quote, encrypted, key };
                    } else {
                        const { encrypted, matrix } = encryptHill(quote.quote);
                        return { ...quote, encrypted, matrix };
                    }
                });

                setQuotes(encryptedQuotes);
            } catch (error) {
                console.error('Error loading quotes:', error);
            }
        };

        loadQuotes();
    }, []);

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
                } bg-gradient-to-br from-blue-100 via-white to-cyan-100`}
            ></div>

            {/* Main Content */}
            <main className="relative p-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h1 className={`text-left text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Codebusters Practice
                        </h1>
                        {isTestSubmitted && testScore !== null && (
                            <span className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                                darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-900'
                            }`}>
                                Score: {Math.round(testScore)}%
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Progress: {Math.round(totalProgress)}%
                            </span>
                            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-green-500 transition-all duration-300"
                                    style={{ width: `${totalProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Test
                        </h2>
                        <div className="mt-4">

                            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                                {quotes.map((item, index) => (
                                    <div 
                                        key={index} 
                                        className={`p-4 border rounded shadow-sm hover:shadow-md transition-shadow ${
                                            darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <p className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                {item.author}
                                            </p>
                                            <span className={`px-2 py-1 rounded text-sm ${
                                                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {item.cipherType.charAt(0).toUpperCase() + item.cipherType.slice(1)}
                                            </span>
                                        </div>
                                        {item.cipherType === 'aristocrat' && item.key && (
                                            <div className={`mb-2 p-2 rounded ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                                <p className={`text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    Substitution Key:
                                                </p>
                                                <div className={`font-mono text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    <div>Plain:  ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
                                                    <div>Cipher: {item.key}</div>
                                                </div>
                                            </div>
                                        )}

                                        {item.cipherType === 'aristocrat' ? (
                                            <AristocratDisplay 
                                                text={item.encrypted} 
                                                quoteIndex={index}
                                                solution={item.solution}
                                                frequencyNotes={item.frequencyNotes}
                                            />
                                        ) : (
                                            <HillDisplay
                                                text={item.encrypted}
                                                matrix={item.matrix!}
                                                quoteIndex={index}
                                                solution={item.hillSolution}
                                                onSolutionChange={(type, value) => handleHillSolutionChange(index, type, value)}
                                                isTestSubmitted={isTestSubmitted}
                                                quotes={quotes}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Resource Page
                        </h2>
                        <button
                            className={`${
                                darkMode 
                                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                                    : 'bg-blue-500 hover:bg-blue-700 text-white'
                            } font-bold py-2 px-4 rounded transition-colors`}
                            onClick={() => setShowResources(!showResources)}
                        >
                            {showResources ? 'Hide Resources' : 'Show Resources'}
                        </button>
                        {showResources && (
                            <div className={`mt-4 p-4 border rounded ${
                                darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'
                            }`}>
                                <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Resource Sheet
                                </h2>
                                <iframe
                                    src="/2024_Div_C_Resource.pdf"
                                    className="w-full h-[600px]"
                                    title="Resource Sheet PDF"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Test Button */}
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
                    <button
                        onClick={handleSubmitTest}
                        disabled={isTestSubmitted}
                        className={`px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-300 ${
                            isTestSubmitted
                                ? 'opacity-50 cursor-not-allowed ' + (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500')
                                : darkMode
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {isTestSubmitted ? 'Test Submitted' : 'Submit Test'}
                    </button>
                </div>
            </main>

            {/* Dark Mode Toggle */}
            <button
                onClick={() => setDarkMode(!darkMode)}
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

            {/* Styled scrollbar */}
            <style jsx global>{`
                ::-webkit-scrollbar {
                    width: 8px;
                    transition: background 1s ease;
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
        </div>
    );
}