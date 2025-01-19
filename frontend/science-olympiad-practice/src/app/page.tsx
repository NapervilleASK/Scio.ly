import Link from "next/link";
import Particles from "./Particles";

export default function HomePage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden bg-gradient-to-b from-blue-50 to-cyan-100">
      {/* Particles */}
      <Particles />

      {/* Content Overlay */}
      <div className="relative z-10 text-center">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-4 md:mb-6 py-1">
          Science Olympiad Practice
        </h1>
        <p className="text-base md:text-lg text-gray-700 mb-6 md:mb-8">
          Welcome! Generate online practice problem sets for Science Olympiad events. Built for the Div. C 2024-2025 season.
        </p>
        <Link href="/dashboard">
          <button className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-300 to-cyan-400 text-white font-semibold rounded-full shadow-lg hover:scale-105 hover:shadow-xl transform transition-all duration-300 w-full sm:w-auto">
            Start Practicing
          </button>
        </Link>
      </div>
    </div>
  );
}
