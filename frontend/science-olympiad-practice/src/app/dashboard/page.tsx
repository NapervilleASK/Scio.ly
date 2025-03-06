'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from '@/app/contexts/ThemeContext';
import api from '@/app/api';
import Header from '@/app/components/Header';

interface Event {
  id: number;
  name: string;
  subject: string;
}

interface Settings {
  questionCount: number;
  timeLimit: number;
  difficulty: string;
  types: string;
}

function EventDashboard() {
  const router = useRouter();
  const { darkMode, setDarkMode } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('alphabetical');
  const [settings, setSettings] = useState<Settings>({
    questionCount: 10,
    timeLimit: 15,
    difficulty: 'any',
    types: 'multiple-choice',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleGenerateTest = () => {
    if (!selectedEvent) {
      toast.error('Please select an event first');
      return;
    }

    const selectedEventObj = events.find((event) => event.id === selectedEvent);
    if (!selectedEventObj) return;

    const testParams = {
      eventName: selectedEventObj.name,
      questionCount: settings.questionCount,
      timeLimit: settings.timeLimit,
      difficulty: settings.difficulty,
      types: settings.types,
    };

    localStorage.setItem('testParams', JSON.stringify(testParams));
    localStorage.removeItem('testQuestions');
    router.push('/test');
  };

  const handleUnlimited = () => {
    if (!selectedEvent) {
      toast.error('Please select an event first');
      return;
    }

    const selectedEventObj = events.find((event) => event.id === selectedEvent);
    if (!selectedEventObj) return;

    const unlimitedParams = {
      eventName: selectedEventObj.name,
      difficulty: settings.difficulty,
      types: settings.types,
    };

    localStorage.setItem('testParams', JSON.stringify(unlimitedParams));
    localStorage.removeItem('testQuestions');
    router.push('/unlimited');
  };

  const selectEvent = (id: number) => {
    setSelectedEvent(id);
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
          { name: "Anatomy - Skeletal", category: "Life & Social Science" },
          { name: "Anatomy - Muscular", category: "Life & Social Science" },
          { name: "Anatomy - Integumentary", category: "Life & Social Science" },
          { name: "Astronomy", category: "Earth and Space Science" },
          { name: "Cell Biology", category: "Life & Social Science" },
          { name: "Chemistry Lab", category: "Physical Science & Chemistry" },
          { name: "Codebusters", category: "Inquiry & Nature of Science" },
          { name: "Crime Busters", category: "Physical Science & Chemistry" },
          { name: "Disease Detectives", category: "Life & Social Science" },
          { name: "Dynamic Planet - Glaciers", category: "Earth and Space Science" },
          { name: "Ecology", category: "Life & Social Science" },
          { name: "Entomology", category: "Life & Social Science" },
          { name: "Environmental Chemistry", category: "Life & Social Science" },
          { name: "Forensics", category: "Physical Science & Chemistry" },
          { name: "Fossils", category: "Earth and Space Science" },
          { name: "Geologic Mapping", category: "Earth and Space Science" },
          { name: "Green Generation", category: "Life & Social Science" },
          { name: "Materials Science", category: "Physical Science & Chemistry" },
          { name: "Meteorology", category: "Earth and Space Science" },
          { name: "Metric Mastery", category: "Inquiry & Nature of Science" },
          { name: "Microbe Mission", category: "Life & Social Science" },
          { name: "Optics", category: "Physical Science & Chemistry" },
          { name: "Potions and Poisons", category: "Physical Science & Chemistry" },
          { name: "Wind Power", category: "Physical Science & Chemistry" },
        ];

        const data = ['Astronomy', 'Fun', 'Fermi Questions', 'Entomology', 'Geologic Mapping', 'Optics', 'Codebusters', 'Anatomy - Integumentary', 'Anatomy - Nervous', 'Anatomy - Skeletal', 'Anatomy - Muscular', 'Thermodynamics', 'Wind Power', 'Dynamic Planet - Glaciers', 'Materials Science', 'Chemistry Lab', 'Ecology', 'Meteorology', 'Forensics', 'Disease Detectives', 'Fossils', 'Microbe Mission', 'Gravity Vehicle', 'Forestry', 'Crime Busters', "Dynamic Planet - Earth's Fresh Waters", 'Anatomy - Respiratory', 'Anatomy - Digestive', 'Anatomy - Cardiovascular', 'Trajectory', 'Scrambler', 'Road Scholar', 'Environmental Chemistry', 'Remote Sensing', 'Game On', 'Physics Lab', 'Plant Biology', 'Cell Biology', 'Experimental Design', 'Detector Building', "It's About Time", 'Mission Possible', 'Technical Problem Solving', 'Tower', 'Anatomy - Sense Organs', 'Protein Modeling', 'Rocks and Minerals', 'Robot Arm', 'Electric Vehicle', 'Designer Genes', 'Interrogating the Brain', 'Anatomy - Lymphatic', 'Anatomy - Excretory', 'Anatomy - Immune', 'Anatomy - Endocrine', 'Compound Machines', 'Green Generation', 'Herpetology', 'Hovercraft', 'Invasive Species', 'Machines', 'Mousetrap Vehicle', 'Ornithology', 'Sounds of Music', 'Dynamic Planet - Tectonics', 'Flight', 'Dynamic Planet - Earthquakes, Volcanoes, and Tectonics', 'Cybersecurity', 'Crave the Wave', 'Human Impact on Environment', 'Neuroscience', 'Data Science', 'Food Science', 'Dynamic Planet - Oceanography', 'Roller Coaster', 'WiFi Lab', 'Agricultural Science', 'Circuit Lab', 'Water Quality', 'Wright Stuff', 'Potions and Poisons']
        const eventsFromURL: Event[] = data
          .map((key, index) => ({
            id: index + 1,
            name: key,
            subject:  'Uncategorized',
          }))
          .filter((event) =>
            whitelist.some((whitelisted) => event.name === whitelisted.name)
          )
          .map((event) => ({
            ...event,
            subject:
              whitelist.find((whitelisted) => whitelisted.name === event.name)
                ?.category || event.subject,
          }));
        setEvents(eventsFromURL);

        const response = await fetch(api.api);
        const raw = await response.json();
        console.log(Object.keys(raw))
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Preselect and scroll to the event if a query parameter is provided.
  useEffect(() => {
    const storedEventParams = localStorage.getItem('eventParams');
    if (storedEventParams) {
        const eventToSelect = events.find(
          (event) => event.name === storedEventParams
        );
        if (eventToSelect) {
          setSelectedEvent(eventToSelect.id);
          const element = document.getElementById(`event-${eventToSelect.id}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          localStorage.removeItem('eventParams')
        }
  }
  }, [events]);

  return (
    <div className="relative min-h-screen">
      {/* Background Layers */}
      <div
        className={`fixed inset-0 transition-opacity duration-1000 ${
          darkMode ? 'opacity-100' : 'opacity-0'
        } bg-gradient-to-br from-regalblue-100 to-regalred-100`}
      ></div>
      <div
        className={`fixed inset-0 transition-opacity duration-1000 ${
          darkMode ? 'opacity-0' : 'opacity-100'
        } bg-gradient-to-br from-blue-100 via-white to-cyan-100`}
      ></div>

      <Header />

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <div className="mb-8">
          <h2 className={`text-3xl font-bold transition-colors duration-500 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Practice Dashboard
          </h2>
          <p className={`mt-2 transition-colors duration-500 ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Select an event and configure your practice session
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className={`animate-pulse text-lg font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Loading events...
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500 text-lg">{error}</div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className={`text-lg ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No events match the whitelist criteria.
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Event List */}
            <div className={`flex-1 transition-all duration-500 rounded-xl overflow-hidden ${
              darkMode ? 'bg-palenight-100' : 'bg-white shadow-md'
            }`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className={`font-medium ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Available Events
                </h3>
                <div className="flex items-center">
                  <label htmlFor="sort" className={`text-sm mr-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Sort:
                  </label>
                  <select
                    id="sort"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className={`text-sm rounded-md border-0 py-1.5 pl-3 pr-8 ${
                      darkMode 
                        ? 'bg-gray-700 text-white focus:ring-blue-500' 
                        : 'bg-gray-50 text-gray-900 focus:ring-blue-600'
                    } focus:ring-1 focus:outline-none`}
                  >
                    <option value="alphabetical">Alphabetical</option>
                    <option value="subject">Subject</option>
                  </select>
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                <style jsx>{`
                  div::-webkit-scrollbar {
                    width: 8px;
                  }
                  div::-webkit-scrollbar-thumb {
                    background: ${darkMode
                      ? 'linear-gradient(to bottom, rgb(36, 36, 36), rgb(111, 35, 72))'
                      : 'linear-gradient(to bottom, #3b82f6, #0ea5e9)'};
                    border-radius: 4px;
                  }
                  div::-webkit-scrollbar-thumb:hover {
                    background: ${darkMode
                      ? 'linear-gradient(to bottom, rgb(23, 23, 23), rgb(83, 26, 54))'
                      : 'linear-gradient(to bottom, #2563eb, #0284c7)'};
                  }
                `}</style>
                <ul className="space-y-1">
                  {sortedEvents.map((event) => (
                    <li
                      key={event.id}
                      id={`event-${event.id}`}
                      onClick={() => selectEvent(event.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedEvent === event.id
                          ? darkMode
                            ? 'bg-blue-600/20 border-l-4 border-blue-500'
                            : 'bg-blue-50 border-l-4 border-blue-500'
                          : darkMode
                            ? 'hover:bg-gray-700'
                            : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <h4 className={`font-medium ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {event.name}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {event.subject}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Test Configuration */}
            <div className={`w-full lg:w-96 transition-all duration-500 rounded-xl ${
              darkMode ? 'bg-palenight-100' : 'bg-white shadow-md'
            }`}>
              <div className="p-6">
                <h3 className={`text-xl font-semibold mb-6 ${
                  darkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  Test Configuration
                </h3>
                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="questionCount"
                      className={`block text-sm font-medium mb-2 ${
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
                      className={`block w-full rounded-md border-0 py-1.5 px-3 ${
                        darkMode
                          ? 'bg-gray-700 text-white focus:ring-blue-500'
                          : 'bg-gray-50 text-gray-900 focus:ring-blue-600'
                      } shadow-sm focus:ring-1 focus:outline-none`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="timeLimit"
                      className={`block text-sm font-medium mb-2 ${
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
                      className={`block w-full rounded-md border-0 py-1.5 px-3 ${
                        darkMode
                          ? 'bg-gray-700 text-white focus:ring-blue-500'
                          : 'bg-gray-50 text-gray-900 focus:ring-blue-600'
                      } shadow-sm focus:ring-1 focus:outline-none`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="difficulty"
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Difficulty
                    </label>
                    <select
                      id="difficulty"
                      value={settings.difficulty}
                      onChange={handleChange}
                      className={`block w-full rounded-md border-0 py-1.5 px-3 ${
                        darkMode
                          ? 'bg-gray-700 text-white focus:ring-blue-500'
                          : 'bg-gray-50 text-gray-900 focus:ring-blue-600'
                      } shadow-sm focus:ring-1 focus:outline-none`}
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
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Question Types
                    </label>
                    <select
                      id="types"
                      value={settings.types}
                      onChange={handleChange}
                      className={`block w-full rounded-md border-0 py-1.5 px-3 ${
                        darkMode
                          ? 'bg-gray-700 text-white focus:ring-blue-500'
                          : 'bg-gray-50 text-gray-900 focus:ring-blue-600'
                      } shadow-sm focus:ring-1 focus:outline-none`}
                    >
                      <option value="multiple-choice">MCQ only</option>
                      <option value="both">MCQ + FRQ</option>
                      <option value="free-response">FRQ only</option>
                    </select>
                  </div>
                  <div className="pt-4 space-y-3">
                    <button
                      onClick={handleGenerateTest}
                      disabled={!selectedEvent}
                      className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-300 ${
                        !selectedEvent 
                          ? 'opacity-50 cursor-not-allowed ' + (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500')
                          : darkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      Generate Test
                    </button>
                    <button
                      onClick={handleUnlimited}
                      disabled={!selectedEvent}
                      className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-300 ${
                        !selectedEvent 
                          ? 'opacity-50 cursor-not-allowed ' + (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500')
                          : darkMode
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      Unlimited Practice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-110 ${
          darkMode ? 'bg-gray-700' : 'bg-white'
        }`}
      >
        {darkMode ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="4" fill="currentColor" />
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

      {/* Back Button (bottom-left) */}
      <button
        onClick={() => router.push('/welcome')}
        className={`fixed bottom-8 left-8 p-4 rounded-full shadow-lg transition-transform duration-300 hover:scale-110 transition-colors duration-1000 ease-in-out ${
          darkMode
            ? 'bg-gradient-to-r from-regalblue-100 to-regalred-100'
            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
        } text-white z-50`}
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

      <ToastContainer theme={darkMode ? "dark" : "light"} />
    </div>
  );
}

export default EventDashboard;
