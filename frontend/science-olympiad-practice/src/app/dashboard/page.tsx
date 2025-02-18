'use client';

import { useState, useEffect} from 'react';
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import { useTheme } from '@/contexts/ThemeContext';
import api from '../api'
interface Event {
  id: number;
  name: string;
  subject: string;
}

function EventDashboard() {
  const { darkMode, setDarkMode } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [sortOption, setSortOption] = useState<string>('alphabetical');
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const [settings, setSettings] = useState({
    questionCount: 50,
    timeLimit: 60,
    difficulty: 'any',
    types: 'multiple-choice',
  });

  const handleChange = (e: { target: { id: number | string; value: number | string } }) => {
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

  const handleUnlimited = () => {
    const selectedEventDetails = events.find(
      (event) => event.id === selectedEvent
    );

    if (!selectedEventDetails) {
      toast.info('Please select an event to start practicing.', {theme:'dark'});
      return;
    }

    router.push(
      `/unlimited?eventName=${encodeURIComponent(
        selectedEventDetails.name
      )}&difficulty=${settings.difficulty}&types=${settings.types}`
    );
  };

  const handleGenerateTest = () => {
    const selectedEventDetails = events.find(
      (event) => event.id === selectedEvent
    );

    if (!selectedEventDetails) {
      toast.info('Please select an event to generate the test.', {theme: 'dark'});
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
          { name: "Anatomy - Skeletal", category: "Life, Personal & Social Science" },
          { name: "Anatomy - Muscular", category: "Life, Personal & Social Science" },
          { name: "Anatomy - Integumentary", category: "Life, Personal & Social Science" },
          { name: "Astronomy", category: "Earth and Space Science" },
          { name: "Cell Biology", category: "Life, Personal & Social Science" },
          { name: "Chemistry Lab", category: "Physical Science & Chemistry" },
          { name: "Codebusters", category: "Inquiry & Nature of Science" },
          { name: "Crime Busters", category: "Physical Science & Chemistry" },
          { name: "Disease Detectives", category: "Life, Personal & Social Science" },
          { name: "Dynamic Planet", category: "Earth and Space Science" },
          { name: "Ecology", category: "Life, Personal & Social Science" },
          { name: "Entomology", category: "Life, Personal & Social Science" },
          { name: "Environmental Chemistry", category: "Life, Personal & Social Science" },
          { name: "Forensics", category: "Physical Science & Chemistry" },
          { name: "Fossils", category: "Earth and Space Science" },
          { name: "Geologic Mapping", category: "Earth and Space Science" },
          { name: "Green Generation", category: "Life, Personal & Social Science" },
          { name: "Materials Science", category: "Physical Science & Chemistry" },
          { name: "Meteorology", category: "Earth and Space Science" },
          { name: "Metric Mastery", category: "Inquiry & Nature of Science" },
          { name: "Microbe Mission", category: "Life, Personal & Social Science" },
          { name: "Optics", category: "Physical Science & Chemistry" },
          { name: "Potions and Poisons", category: "Physical Science & Chemistry" },
          { name: "Reach for the Stars", category: "Earth and Space Science" },
          { name: "Road Scholar", category: "Earth and Space Science" },
          { name: "Wind Power", category: "Physical Science & Chemistry" },
          { name: "Write It Do It", category: "Inquiry & Nature of Science" },
        ];

        const response = await fetch(
          api.api
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
    // Wrap the whole page in a relative container
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

      {/* Page Content */}
      <div className="relative flex flex-col items-center p-6">
        <h1
          className={`text-4xl font-bold mb-6 transition-colors duration-1000 ease-in-out ${
            darkMode
              ? 'bg-gradient-to-r from-blue-300 via-green-300 to-red-300 bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent'
          }`}
        >
          Scio.ly Dashboard
        </h1>
        {loading ? (
          <p className={`transition-colors duration-1000 ease-in-out ${darkMode ? 'text-white' : 'text-black'}`}>
            Loading events...
          </p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : events.length === 0 ? (
          <p className="text-gray-500">No events match the whitelist criteria.</p>
        ) : (
          <>
            <div className="mb-6">
              <label
                htmlFor="sort"
                className={`text-lg font-semibold mr-4 transition-colors duration-1000 ease-in-out ${
                  darkMode ? 'text-gray-200' : 'text-black'
                }`}
              >
                Sort by:
              </label>
              <select
                id="sort"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className={`p-2 border rounded-lg transition-all duration-1000 ease-in-out ${
                  darkMode
                    ? 'border-gray-600 bg-gray-800 text-white'
                    : 'border-gray-300 bg-white text-black'
                }`}
              >
                <option value="alphabetical">Alphabetical</option>
                <option value="subject">Subject</option>
              </select>
            </div>

            <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6">
              {/* Test Configuration */}
              <div
                className={`md:order-1 w-full md:w-80 transition-all duration-1000 ease-in-out ${
                  darkMode ? 'bg-palenight-100 shadow-gray-700' : 'bg-white shadow-lg'
                } p-8 rounded-lg`}
              >
                <h2
                  className={`text-2xl font-semibold mb-6 transition-colors duration-1000 ease-in-out ${
                    darkMode
                      ? 'bg-gradient-to-r from-blue-300 via-blue-200 to-cyan-300 bg-clip-text text-transparent'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent'
                  }`}
                >
                  Test Configuration
                </h2>
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="questionCount"
                      className={`block text-sm font-medium mb-2 transition-colors duration-1000 ease-in-out ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      id="questionCount"
                      min="1"
                      max="100"
                      value={settings.questionCount}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-none outline-none transition-all duration-1000 ease-in-out ${
                        darkMode
                          ? 'border-gray-600 bg-gray-800 text-white shadow-sm focus:border-regalblue-100 focus:ring-regalblue-100 p-2'
                          : 'border-gray-300 bg-gradient-to-r from-blue-50 to-cyan-50 text-black shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2'
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="timeLimit"
                      className={`block text-sm font-medium mb-2 transition-colors duration-1000 ease-in-out ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      id="timeLimit"
                      min="1"
                      max="120"
                      value={settings.timeLimit}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-none outline-none transition-all duration-1000 ease-in-out ${
                        darkMode
                          ? 'border-gray-600 bg-gray-800 text-white shadow-sm focus:border-regalblue-100 focus:ring-regalblue-100 p-2'
                          : 'border-gray-300 bg-gradient-to-r from-blue-50 to-cyan-50 text-black shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2'
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="difficulty"
                      className={`block text-sm font-medium mb-2 transition-colors duration-1000 ease-in-out ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Difficulty
                    </label>
                    <select
                      id="difficulty"
                      value={settings.difficulty}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-none outline-none transition-all duration-1000 ease-in-out p-2 h-10 shadow-sm ${
                        darkMode
                          ? 'border-gray-600 bg-gray-800 text-white'
                          : 'border-gray-300 bg-gradient-to-r from-blue-50 to-cyan-50 text-black'
                      }`}
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
                      className={`block text-sm font-medium mb-2 transition-colors duration-1000 ease-in-out ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Question Types
                    </label>
                    <select
                      id="types"
                      value={settings.types}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-none outline-none transition-all duration-1000 ease-in-out p-2 h-10 shadow-sm ${
                        darkMode
                          ? 'border-gray-600 bg-gray-800 text-white'
                          : 'border-gray-300 bg-gradient-to-r from-blue-50 to-cyan-50 text-black'
                      }`}
                    >
                      <option value="multiple-choice">MCQ only</option>
                      <option value="both">MCQ + FRQ</option>
                    </select>
                  </div>
                <button
                  onClick={handleGenerateTest}
                  className={`w-full mt-6 px-4 py-2 font-semibold rounded-lg transform transition-all duration-700 transform hover:scale-105  ${
                    darkMode
                      ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  }`}
                >
                  Generate Test
                </button>
                <button
                  onClick={handleUnlimited}
                  className={`w-full mt-6 px-4 py-2 font-semibold rounded-lg transition-all duration-700 transform hover:scale-105 ${
                    darkMode
                      ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  }`}
                >
                  Unlimited Practice
                </button>
                </div>
              </div>

              {/* Event List */}
              <div
                className={`md:order-2 flex-1 transition-all duration-1000 ease-in-out ${
                  darkMode ? 'bg-palenight-100 shadow-gray-700' : 'bg-white shadow-lg'
                } p-6 rounded-lg`}
              >
                <ul className="max-h-[67vh] overflow-y-auto overflow-x-hidden px-2">
                  <style jsx>{`
                    ul::-webkit-scrollbar {
                      width: 8px;
                      display: block !important;
                    }

                    ul::-webkit-scrollbar-thumb {
                      background: ${darkMode
                        ? 'linear-gradient(to bottom, rgb(36, 36, 36), rgb(111, 35, 72))'
                        : 'linear-gradient(to bottom, #3b82f6, #06b6d4)'};
                      border-radius: 4px;
                      transition: background 1s ease;
                    }
                    ul::-webkit-scrollbar-thumb:hover {
                      background: ${darkMode
                        ? 'linear-gradient(to bottom, rgb(23, 23, 23), rgb(83, 26, 54))'
                        : 'linear-gradient(to bottom, #2563eb, #0891b2)'};
                    }
                  `}</style>
                  {sortedEvents.map((event) => (
                    <li
                      key={event.id}
                      className={`py-4 px-4 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        selectedEvent === event.id
                          ? darkMode
                            ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100 shadow-md scale-105'
                            : 'bg-gradient-to-r from-blue-100 via-white to-cyan-100 shadow-md scale-105'
                          : darkMode
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => selectEvent(event.id)}
                    >
                      <div className="flex justify-between items-center">
                        <h2 className={`text-lg font-semibold transition-colors duration-1000 ease-in-out ${darkMode ? 'text-white' : 'text-black'}`}>
                          {event.name}
                        </h2>
                        <p className={`text-sm text-right transition-colors duration-1000 ease-in-out ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {event.subject}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Back Button (bottom-left) */}
              <button
                onClick={() => router.push('/welcome')}
                className={`fixed bottom-8 left-8 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
                  darkMode
                    ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100 text-white hover:shadow-regalblue-100/50'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-blue-500/50'
                }`}
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
                    strokeWidth={2.5}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
            </div>
          </>
        )}
        <ToastContainer />

        {/* Dark Mode Toggle (bottom-right) */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-110 transition-colors duration-1000 ease-in-out ${
            darkMode ? 'bg-gray-700' : 'bg-white'
          }`}
        >
          {darkMode ? (
            // Sun icon (click to switch to light mode)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l-1.414 1.414M7.05 7.05L5.636 5.636"
              />
            </svg>
          ) : (
            // Moon icon (click to switch to dark mode)
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
      </div>
    </div>
  );
}

export default EventDashboard;