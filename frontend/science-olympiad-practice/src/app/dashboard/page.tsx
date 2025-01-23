'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Event {
  id: number;
  name: string;
  subject: string;
}

interface WhitelistItem {
  name: string;
  category: string;
}

function EventDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [sortOption, setSortOption] = useState<string>('alphabetical');
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const [settings, setSettings] = useState({
    questionCount: 10,
    timeLimit: 30,
    difficulty: 'easy',
    types: 'multiple-choice',
  });

  const handleChange = (e: { target: { id: any; value: any } }) => {
    const { id, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const selectEvent = (eventId: number) => {
    setSelectedEvent((prevSelected) =>
      prevSelected === eventId ? null : eventId
    );
  };

  const handleGenerateTest = () => {
    const selectedEventDetails = events.find(
      (event) => event.id === selectedEvent
    );

    if (!selectedEventDetails) {
      alert('Please select an event to generate the test.');
      return;
    }

    router.push(
      `/test?eventName=${encodeURIComponent(
        selectedEventDetails.name
      )}&questionCount=${settings.questionCount}&timeLimit=${
        settings.timeLimit
      }&difficulty=${settings.difficulty}&types=${settings.types}`
    );
  };

  const sortedEvents = [...events].sort((a, b) => {
    if (sortOption === 'alphabetical') {
      return a.name.localeCompare(b.name);
    } else if (sortOption === 'subject') {
      return a.subject.localeCompare(b.subject);
    }
    return 0;
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        const whitelist = [
          { name: "Air Trajectory", category: "Physical Science & Chemistry" },
          { name: "Anatomy - Skeletal", category: "Life, Personal & Social Science" },
          { name: "Anatomy - Muscular", category: "Life, Personal & Social Science" },
          { name: "Anatomy - Integumentary", category: "Life, Personal & Social Science" },
          { name: "Astronomy", category: "Earth and Space Science" },
          { name: "Bungee Drop", category: "Inquiry & Nature of Science" },
          { name: "Chemistry Lab", category: "Physical Science & Chemistry" },
          { name: "Codebusters", category: "Inquiry & Nature of Science" },
          { name: "Crime Busters", category: "Physical Science & Chemistry" },
          { name: "Disease Detectives", category: "Life, Personal & Social Science" },
          { name: "Dynamic Planet", category: "Earth and Space Science" },
          { name: "Ecology", category: "Life, Personal & Social Science" },
          { name: "Electric Vehicle", category: "Technology & Engineering" },
          { name: "Entomology", category: "Life, Personal & Social Science" },
          { name: "Experimental Design", category: "Inquiry & Nature of Science" },
          { name: "Forensics", category: "Physical Science & Chemistry" },
          { name: "Fossils", category: "Earth and Space Science" },
          { name: "Geologic Mapping", category: "Earth and Space Science" },
          { name: "Helicopter", category: "Technology & Engineering" },
          { name: "Materials Science", category: "Physical Science & Chemistry" },
          { name: "Meteorology", category: "Earth and Space Science" },
          { name: "Metric Mastery", category: "Inquiry & Nature of Science" },
          { name: "Microbe Mission", category: "Life, Personal & Social Science" },
          { name: "Mission Possible", category: "Technology & Engineering" },
          { name: "Optics", category: "Physical Science & Chemistry" },
          { name: "Potions and Poisons", category: "Physical Science & Chemistry" },
          { name: "Reach for the Stars", category: "Earth and Space Science" },
          { name: "Road Scholar", category: "Earth and Space Science" },
          { name: "Robot Tour", category: "Technology & Engineering" },
          { name: "Scrambler", category: "Technology & Engineering" },
          { name: "Tower", category: "Technology & Engineering" },
          { name: "Wind Power", category: "Physical Science & Chemistry" },
          { name: "Write It Do It", category: "Inquiry & Nature of Science" }
        ];
        

        const response = await fetch(
          'https://gist.githubusercontent.com/Kudostoy0u/93a0bda74009801d5020bc5be8586a98/raw/4fa012fdd49fa4beaa623eb572ca9e7526024a10/final.json'
        );
        const data = await response.json();

        const eventsFromURL: Event[] = Object.keys(data)
          .map((key, index) => ({
            id: index + 1,
            name: key,
            subject: data[key].category || 'Uncategorized',
          }))
          .filter((event) =>
            whitelist.some(
              (whitelisted) => event.name === whitelisted.name
            )
          )
          .map((event) => ({
            ...event,
            subject:
              whitelist.find(
                (whitelisted) => whitelisted.name === event.name
              )?.category || event.subject,
          }));

        setEvents(eventsFromURL);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 p-6">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-6">
        Scio.ly Dashboard
      </h1>
      {loading ? (
        <p>Loading events...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500">No events match the whitelist criteria.</p>
      ) : (
        <>
          <div className="mb-6">
            <label htmlFor="sort" className="text-lg font-semibold mr-4 text-black">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg text-black"
            >
              <option value="alphabetical">Alphabetical</option>
              <option value="subject">Subject</option>
            </select>
          </div>

          <div className="w-full max-w-4xl flex gap-6">
            {/* Event list */}
            <div className="flex-1 bg-white p-6 rounded-lg shadow-lg">
                <ul className="max-h-[60vh] overflow-y-auto overflow-x-hidden px-2">
                <style jsx>{`
                ul::-webkit-scrollbar {
                  width: 8px;
                }
                ul::-webkit-scrollbar-track {
                  background: #f1f1f1;
                  border-radius: 4px;
                }
                ul::-webkit-scrollbar-thumb {
                  background: linear-gradient(to bottom, #3b82f6, #06b6d4);
                  border-radius: 4px;
                }
                ul::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(to bottom, #2563eb, #0891b2);
                }
                `}</style>
              {sortedEvents.map((event) => (
                <li
                key={event.id}
                className={`py-4 px-4 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedEvent === event.id
                  ? 'bg-gradient-to-r from-blue-100 via-white to-cyan-100 shadow-md scale-105'
                  : 'hover:bg-gray-50'
                }`}
                onClick={() => selectEvent(event.id)}
                >
                <div className="flex justify-between items-center">
                  <h2 className="text-black text-lg font-semibold">
                  {event.name}
                  </h2>
                    <p className="text-sm text-gray-500 text-right">{event.subject}</p>
                </div>
                </li>
              ))}
              </ul>
            </div>

            {/* Test configuration */}
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
                    min="10"
                    max="25"
                    value={settings.questionCount}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-black"
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
                    value={settings.timeLimit}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-black"
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
                    value={settings.difficulty}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-black"
                  >
                    <option value="any">Any</option>
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
                    value={settings.types}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-black"
                  >
                    <option value="multiple-choice">MCQ</option>
                    <option value="both">MCQ + FRQ</option>
                  </select>
                </div>
                <button
                  onClick={handleGenerateTest}
                  className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg shadow-md hover:scale-105 transform transition-all duration-300"
                >
                  Generate Test
                </button>
                <button
                  className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg shadow-md hover:scale-105 transform transition-all duration-300"
                >
                  Unlimited Practice
                </button>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="fixed bottom-8 left-8 p-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:scale-110 transition-transform duration-300 hover:shadow-xl"
            >
              <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
              </svg>
            </button>

          </div>
        </>
      )}
    </div>
  );
}

export default EventDashboard;
