import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 px-4">
      <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-4 md:mb-6 text-center py-1">Science Olympiad Practice</h1>
      <p className="text-base md:text-lg text-gray-700 mb-6 md:mb-8 text-center">
      Welcome! Generate online practice problemsets for Science Olympiad events. Built for the Div. C 2024-2025 season.
      </p>
      <Link href="/dashboard">
      <button className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full shadow-lg hover:scale-105 transform transition-all duration-300 w-full sm:w-auto">
        Start Practicing
      </button>
      </Link>
    </div>
  );
}