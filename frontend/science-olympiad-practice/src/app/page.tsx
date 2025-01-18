import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <h1 className="text-3xl md:text-5xl font-bold text-blue-600 mb-4 md:mb-6 text-center">Science Olympiad Practice</h1>
      <p className="text-base md:text-lg text-gray-700 mb-6 md:mb-8 text-center">
      Welcome! Practice problems for Science Olympiad events.
      </p>
      <Link href="/problems">
      <button className="px-6 py-3 md:px-8 md:py-4 bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-600 transition w-full sm:w-auto">
        Start Practicing
      </button>
      </Link>
    </div>
  );
}