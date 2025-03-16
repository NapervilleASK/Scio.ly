'use client';
import React, { useState, useEffect } from 'react';
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
    const frequencies = getLetterFrequencies(text);
    
    return (
        <div className="mt-4 p-2 bg-gray-50 rounded">
            <p className="text-sm text-gray-600 mb-2">Frequency Analysis</p>
            <div className="flex justify-between space-x-1">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
                    <div key={letter} className="flex flex-col items-center">
                        <div className="text-sm font-bold">{letter}</div>
                        <div className="text-xs text-gray-600">{frequencies[letter]}</div>
                        <input
                            type="text"
                            maxLength={1}
                            value={frequencyNotes?.[letter] || ''}
                            onChange={(e) => onNoteChange(letter, e.target.value)}
                            className="w-6 h-6 text-center border rounded text-sm mt-1"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

// New component for Hill cipher display
const HillDisplay = ({ 
    text, 
    matrix, 
    quoteIndex,
    solution,
    onSolutionChange 
}: { 
    text: string;
    matrix: number[][];
    quoteIndex: number;
    solution?: { matrix: string[][]; plaintext: string };
    onSolutionChange: (type: 'matrix' | 'plaintext', value: string[][] | string) => void;
}) => {
    return (
        <div className="font-mono">
            {/* Matrix display section */}
            <div className="flex gap-8 mb-6">
                <div>
                    <p className="text-sm text-gray-600 mb-2">Encryption Matrix:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {matrix.map((row, i) => 
                            row.map((num, j) => (
                                <div key={`${i}-${j}`} className="w-12 h-12 flex flex-col items-center justify-center border rounded bg-gray-50">
                                    <span className="text-lg font-bold">{num}</span>
                                    <span className="text-xs text-gray-500">({numberToLetter(num)})</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div>
                    <p className="text-sm text-gray-600 mb-2">Decryption Matrix:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {[0, 1].map(i => 
                            [0, 1].map(j => (
                                <input
                                    key={`solution-${i}-${j}`}
                                    type="text"
                                    maxLength={2}
                                    value={solution?.matrix?.[i]?.[j] || ''}
                                    onChange={(e) => {
                                        const newMatrix = solution?.matrix || [['', ''], ['', '']];
                                        newMatrix[i][j] = e.target.value;
                                        onSolutionChange('matrix', newMatrix);
                                    }}
                                    className="w-12 h-12 text-center border rounded text-lg"
                                    placeholder="?"
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Encrypted text and solution section */}
            <div className="flex flex-wrap">
                {text.split('').map((char, i) => (
                    <div key={i} className="flex flex-col items-center m-0.5">
                        <span className="text-lg">{char}</span>
                        {/[A-Z]/.test(char) && (
                            <input
                                type="text"
                                maxLength={1}
                                value={solution?.plaintext?.charAt(i) || ''}
                                onChange={(e) => {
                                    const newValue = e.target.value.toUpperCase();
                                    let newPlaintext = solution?.plaintext || '';
                                    // Ensure the string is at least as long as the position we're editing
                                    while (newPlaintext.length <= i) {
                                        newPlaintext += ' ';
                                    }
                                    // Replace the character at position i
                                    newPlaintext = newPlaintext.substring(0, i) + newValue + newPlaintext.substring(i + 1);
                                    onSolutionChange('plaintext', newPlaintext);
                                }}
                                className="w-6 h-6 text-center border rounded mt-1 text-sm"
                            />
                        )}
                        {!/[A-Z]/.test(char) && <div className="w-6 h-6 mt-1" />}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function CodeBusters() {
    const [showResources, setShowResources] = useState(false);
    const [quotes, setQuotes] = useState<QuoteData[]>([]);
    const [autoFill, setAutoFill] = useState(true);

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
        return (
            <div className="font-mono">
                <div className="flex flex-wrap">
                    {text.split('').map((char, i) => {
                        const isLetter = /[A-Z]/.test(char);
                        const value = autoFill 
                            ? solution?.[char] || ''
                            : solution?.[`${char}_${[...text].slice(0, i).filter(c => c === char).length}`] || '';
                        
                        return (
                            <div key={i} className="flex flex-col items-center m-0.5">
                                <span className="text-lg">{char}</span>
                                {isLetter && (
                                    <input
                                        type="text"
                                        maxLength={1}
                                        value={value}
                                        onChange={(e) => handleSolutionChange(
                                            quoteIndex,
                                            char,
                                            e.target.value
                                        )}
                                        className="w-6 h-6 text-center border rounded mt-1 text-sm"
                                    />
                                )}
                                {!isLetter && <div className="w-6 h-6 mt-1" />}
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
        <main className="min-h-screen p-8">
            <h1 className="text-left text-3xl font-bold mb-4">Codebusters Practice</h1>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Encrypted Quotes</h2>
                    <div className="mt-4">
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="font-medium text-yellow-800">Cipher Types:</p>
                            <ul className="list-disc ml-4 text-yellow-700">
                                <li>Aristocrat: Simple substitution cipher (15 quotes)</li>
                                <li>Hill: 2x2 matrix encryption (5 quotes)</li>
                            </ul>
                        </div>

                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                            {quotes.map((item, index) => (
                                <div 
                                    key={index} 
                                    className="p-4 border rounded shadow-sm hover:shadow-md transition-shadow bg-white"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-medium text-blue-600">{item.author}</p>
                                        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                                            {item.cipherType.charAt(0).toUpperCase() + item.cipherType.slice(1)}
                                        </span>
                                    </div>
                                    {item.cipherType === 'aristocrat' && item.key && (
                                        <div className="mb-2 p-2 bg-gray-50 rounded">
                                            <p className="text-sm text-gray-600 mb-1">Substitution Key:</p>
                                            <div className="font-mono text-sm">
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
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* resource page toggle */}
                <div>
                    <h2 className="text-xl font-semibold mb-2">Resource Page</h2>
                    <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => setShowResources(!showResources)}
                    >
                    {showResources ? 'Hide Resources' : 'Show Resources'}
                    </button>
                    {showResources && (
                    <div className="mt-4 p-4 border rounded">
                        <h2 className="text-xl font-semibold mb-2">Resource Sheet</h2>
                        <iframe
                        src="/2024_Div_C_Resource.pdf"
                        className="w-full h-[600px]"
                        title="Resource Sheet PDF"
                        />
                    </div>
                    )}
                </div>
            </div>
        </main>
    );
}
