'use client';
import React, { useState } from 'react';

export default function CodeBusters() {
    const [showResources, setShowResources] = useState(false);

    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-6">Code Busters Practice</h1>
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
        </main>
    );
}
// toggle resource sheet
// toggle autofill/no autofill
