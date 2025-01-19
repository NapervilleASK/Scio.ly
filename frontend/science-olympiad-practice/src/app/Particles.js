"use client";

import { useEffect } from "react";

export default function Particles() {
  useEffect(() => {
    const particlesContainer = document.createElement("div");
    particlesContainer.className = "particles-container";
    document.body.appendChild(particlesContainer);

    const particleCount = 50; // Number of particles

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";

      // Randomize initial position
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.left = `${Math.random() * 100}%`;

      // Append particle to the container
      particlesContainer.appendChild(particle);
    }

    return () => {
      // Cleanup on unmount
      document.body.removeChild(particlesContainer);
    };
  }, []);

  return null;
}
