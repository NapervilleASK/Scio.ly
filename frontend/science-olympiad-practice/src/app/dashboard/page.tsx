'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Event {
  id: number;
  name: string;
  subject: string;
}

const events: Event[] = [
  { id: 1, name: 'Anatomy and Physiology', subject: 'Life, Personal & Social Science' },
  { id: 2, name: 'Disease Detectives', subject: 'Life, Personal & Social Science' },
  { id: 3, name: 'Ecology', subject: 'Life, Personal & Social Science' },
  { id: 4, name: 'Entomology', subject: 'Life, Personal & Social Science' },
  { id: 5, name: 'Microbe Mission', subject: 'Life, Personal & Social Science' },
  { id: 6, name: 'Astronomy', subject: 'Earth & Space Science' },
  { id: 7, name: 'Dynamic Planet', subject: 'Earth & Space Science' },
  { id: 8, name: 'Fossils', subject: 'Earth & Space Science' },
  { id: 9, name: 'Geologic Mapping', subject: 'Earth & Space Science' },
  { id: 10, name: 'Chem Lab', subject: 'Physical Science & Chemistry' },
  { id: 11, name: 'Forensics', subject: 'Physical Science & Chemistry' },
  { id: 12, name: 'Materials Science', subject: 'Physical Science & Chemistry' },
  { id: 13, name: 'Optics', subject: 'Physical Science & Chemistry' },
  { id: 14, name: 'Wind Power', subject: 'Physical Science & Chemistry' },
];

function EventDashboard() {
  const [sortOption, setSortOption] = useState<string>('alphabetical');
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null); // Only one event can be selected
  const router = useRouter();

  const selectEvent = (eventId: number) => {
    setSelectedEvent((prevSelected) => (prevSelected === eventId ? null : eventId));
  };

  const handleGenerateTest = () => {
    const selectedEventDetails = events.find((event) => event.id === selectedEvent);
    if (selectedEventDetails) {
      router.push(
        `/test?events=${encodeURIComponent(
          JSON.stringify([selectedEventDetails])
        )}`
      );
    } else {
      alert('Please select an event to generate the test.');
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    if (sortOption === 'alphabetical') {
      return a.name.localeCompare(b.name);
    } else if (sortOption === 'subject') {
      return a.subject.localeCompare(b.subject);
    }
    return 0;
  });

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 p-6">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-6">
        Test Generator Dashboard
      </h1>
      <div className="mb-6">
        <label htmlFor="sort" className="text-lg font-semibold mr-4">
          Sort by:
        </label>
        <select
          id="sort"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg"
        >
          <option value="alphabetical">Alphabetical</option>
          <option value="subject">Subject</option>
        </select>
      </div>

      <div className="w-full max-w-4xl flex gap-6">
        {/* Event List */}
        <div className="flex-1 bg-white p-6 rounded-lg shadow-lg">
          <ul className="divide-y divide-gray-200">
            {sortedEvents.map((event) => (
              <li
              key={event.id}
              className={`py-4 cursor-pointer ${
                selectedEvent === event.id
                  ? 'bg-blue-100 border-l-4' // Apply blue left bar and background for selected event
                  : 'hover:bg-gray-50' // Apply hover effect for non-selected events
              }`}
              onClick={() => selectEvent(event.id)}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">{event.name}</h2>
                <p className="text-sm text-gray-500">{event.subject}</p>
              </div>
            </li>
            ))}
          </ul>
        </div>

        {/* Test Configuration */}
        <div className="w-80 bg-white p-8 rounded-lg shadow-lg ml-6">
          <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            Test Configuration
          </h2>
          <div className="space-y-6">
            <div>
              <label
                htmlFor="questionCount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Number of Questions
              </label>
              <input
                type="number"
                id="questionCount"
                min="1"
                max="25"
                defaultValue="10"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-gradient-to-r from-blue-50 to-cyan-50"
              />
            </div>
            <div>
              <label
                htmlFor="timeLimit"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Time Limit (minutes)
              </label>
              <input
                type="number"
                id="timeLimit"
                min="5"
                max="120"
                defaultValue="30"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-gradient-to-r from-blue-50 to-cyan-50"
              />
            </div>
            <div>
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Difficulty
              </label>
              <select
                id="difficulty"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-gradient-to-r from-blue-50 to-cyan-50"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="types"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Question Types
              </label>
              <select
                id="types"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-gradient-to-r from-blue-50 to-cyan-50"
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="free-response">Free Response</option>
                <option value="both">Both</option>
              </select>
            </div>
            <button
              onClick={handleGenerateTest}
              className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
            >
              Generate Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDashboard;
