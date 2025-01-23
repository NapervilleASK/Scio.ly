"use client";

import { useState } from "react";
import Link from "next/link";
import Particles from "./Particles";

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen overflow-hidden bg-gradient-to-b from-blue-50 to-cyan-100">

      {/* First Viewport (Initial Content) */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <Particles />
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-4 md:mb-6 py-1">
          Scio.ly
        </h1>
        <p className="text-base md:text-lg text-gray-700 mb-6 md:mb-8">
          Over 2000 Science Olympiad tests into one website, designed for the ultimate studying experience.
        </p>
        <Link href="/dashboard">
          <button className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-300 to-cyan-400 text-white font-semibold rounded-full shadow-lg hover:scale-105 hover:shadow-xl transform transition-all duration-300 w-full sm:w-auto">
            Start Practicing
          </button>
        </Link>
      </div>

      {/* Second Viewport (About Us Content) */}
      <div className="relative z-10 w-full flex flex-col items-center min-h-screen px-4 text-center py-8 bg-black text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold mb-6">About Scio.ly</h2>
          <p className="text-lg mb-6">
            Scio.ly was created by a team of Naperville high school students, dedicated to the Science Olympiad competition.
            We aim to provide all Science Olympiad students with the best and easiest way to practice their events. Our team strives to
            provide the best tests in the most realistic and interactive way.
          </p>

          <img 
            src="./ASK.png"
            alt="Science Olympiad Practice"
            className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
          />

        </div>


      </div>

    </div>
  );
}