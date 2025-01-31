"use client";

import { Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { FiArrowRight } from "react-icons/fi";
import Lenis from "@studio-freight/lenis";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  animate,
  useScroll,
  useTransform,
} from "framer-motion";
import Link from "next/link";

const COLORS_TOP = ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"];
const SCROLL_THRESHOLD = 700;
const SECTION_HEIGHT = 700;

const ParallaxImg = ({ className, alt, src, start, end, zIndex, rotate }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`${start}px end`, `end ${end * -1}px`],
  });
  const opacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0.75, 1], [1, 0.85]);
  const y = useTransform(scrollYProgress, [0, 1], [start, end]);
  const transform = useMotionTemplate`translateY(${y}px) scale(${scale}) rotate(${rotate}deg)`;
  
  return (
    <motion.img
      src={src}
      alt={alt}
      className={`${className} absolute object-cover rounded-lg shadow-xl`}
      ref={ref}
      style={{ transform, opacity, zIndex }}
    />
  );
};

const ParallaxImages = () => {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-24">
      <div className="relative h-[1000px]">
        {/* Top left image - smaller */}
        <ParallaxImg
          src="/ASK.png"
          alt="Science Image 1"
          start={-100}
          end={100}
          zIndex={1}
          rotate={0}
          className="left-[10%] top-[15%] w-[250px] h-[375px]"
        />
        {/* Center image - larger */}
        <ParallaxImg
          src="/ASK.png"
          alt="Science Image 2"
          start={-50}
          end={50}
          zIndex={3}
          rotate={0}
          className="left-1/2 -translate-x-1/2 top-[25%] w-[400px] h-[600px]"
        />
        {/* Bottom right image - smaller */}
        <ParallaxImg
          src="/ASK.png"
          alt="Science Image 3"
          start={100}
          end={-100}
          zIndex={2}
          rotate={0}
          className="right-[10%] top-[35%] w-[250px] h-[375px]"
        />
      </div>
    </div>
  );
};

export default function HomePage() {
  const color = useMotionValue(COLORS_TOP[0]);
  const { scrollY } = useScroll();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      smoothTouch: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const controls = animate(color, COLORS_TOP, {
      ease: "easeInOut",
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
    return controls.stop;
  }, []);

  const clip1 = useTransform(scrollY, [0, SCROLL_THRESHOLD], [0, 50]);
  const clip2 = useTransform(scrollY, [0, SCROLL_THRESHOLD], [100, 50]);
  const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;

  const backgroundImage = useMotionTemplate`radial-gradient(132% 132% at 50% 10%, rgba(2, 6, 23, 0.8) 50%, ${color})`;
  const border = useMotionTemplate`1px solid ${color}`;
  const boxShadow = useMotionTemplate`0px 4px 24px ${color}`;

  // Calculate when parallax section should fade out
  const parallaxFadeOut = [SCROLL_THRESHOLD + SECTION_HEIGHT - 400, SCROLL_THRESHOLD + SECTION_HEIGHT - 200];

  return (
    <div className="relative h-[300vh]">
      <motion.section
        style={{
          backgroundImage,
          clipPath,
        }}
        className="fixed top-0 w-full grid min-h-screen place-content-center overflow-hidden bg-gray-950 px-4 py-24 text-gray-200"
      >
        <div className="relative z-10 flex flex-col items-center w-full text-center">
          <h1 className="text-5xl font-bold leading-tight text-gray-100 sm:text-6xl">
            Scio.ly
          </h1>
          <p className="my-6 max-w-xl text-lg leading-relaxed text-gray-300">
            Over 2000 Science Olympiad tests into one website, designed for the ultimate studying experience.
          </p>
          <Link href="/dashboard">
            <motion.button
              style={{ border, boxShadow }}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className="group relative flex w-fit items-center gap-1.5 rounded-full bg-gray-950/10 px-6 py-3 text-gray-50 transition-colors hover:bg-gray-950/50"
            >
              Start Practicing
              <FiArrowRight className="transition-transform group-hover:-rotate-45 group-active:-rotate-12" />
            </motion.button>
          </Link>
        </div>

        <div className="absolute inset-0 z-0">
          <Canvas>
            <Stars radius={50} count={2500} factor={4} fade speed={2} />
          </Canvas>
        </div>

        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[35vh] bg-gradient-to-b from-transparent to-black"
          style={{
            opacity: useTransform(scrollY, [SCROLL_THRESHOLD - 200, SCROLL_THRESHOLD], [0, 1]),
          }}
        />
      </motion.section>

      <motion.section
        className="absolute top-[100vh] w-full"
        style={{
          opacity: useTransform(
            scrollY,
            [SCROLL_THRESHOLD, SCROLL_THRESHOLD + 200, ...parallaxFadeOut],
            [0, 1, 1, 0]
          ),
        }}
      >
        <ParallaxImages />
      </motion.section>

      <motion.section
        className="absolute top-[200vh] h-screen w-full flex items-center justify-center text-white"
        style={{
          opacity: useTransform(scrollY, [SCROLL_THRESHOLD + SECTION_HEIGHT, SCROLL_THRESHOLD + SECTION_HEIGHT + 200], [0, 1]),
          background: useMotionTemplate`linear-gradient(to bottom, rgba(2, 6, 23, 1), rgba(2, 6, 23, 0.9), rgba(2, 6, 23, 0.8))`,
        }}
      >
        <h2 className="text-4xl font-bold">Welcome to the Next Section</h2>
      </motion.section>
    </div>
  );
}