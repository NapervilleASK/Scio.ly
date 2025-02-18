"use client";

import { Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef} from "react";
import { FiArrowRight} from "react-icons/fi"; 
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
const SCROLL_THRESHOLD = 550;
const SECTION_HEIGHT = 1100;

const ParallaxImg = ({ className, alt, src, start, end, zIndex, rotate }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`${start}px end`, `end ${end * -1}px`],
  });
  
  const opacity = useTransform(scrollYProgress, [0.1, 0.2, 0.8, 0.9], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0.1, 0.2, 0.8, 0.9], [0.9, 1, 1, 0.85]);
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
    <div className="mx-auto w-full max-w-6xl px-4 py-32">
      <div className="relative h-[210]">
        <ParallaxImg
          src="/cat1.png"
          alt="Science Image 1"
          start={-120}
          end={120}
          zIndex={1}
          rotate={0}
          className="left-[15%] top-[8vh] w-[15vw] h-[35vh]"
        />
        <ParallaxImg
          src="/ASK.png"
          alt="Science Image 2"
          start={-100}
          end={100}
          zIndex={3}
          rotate={0}
          className="left-1/2 -translate-x-1/2 top-[20vh] w-[40%] h-[50vh]"
        />
        <ParallaxImg
          src="/cat2.jpg"
          alt="Science Image 3"
          start={0}
          end={-100}
          zIndex={2}
          rotate={0}
          className="right-[15%] top-[52vh] w-[15vw] h-[35vh]"
        />
      </div>
    </div>
  );
};

export default function HomePage() {
  const color = useMotionValue(COLORS_TOP[0]);
  const aboutColor = useMotionValue(COLORS_TOP[2]);
  const { scrollY } = useScroll();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
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

    const aboutControls = animate(aboutColor, [...COLORS_TOP].reverse(), {
      ease: "easeInOut",
      duration: 8,
      repeat: Infinity,
      repeatType: "mirror",
    });

    return () => {
      controls.stop();
      aboutControls.stop();
    };
  }, [aboutColor, color]);

  const clip1 = useTransform(scrollY, [0, SCROLL_THRESHOLD], [0, 50]);
  const clip2 = useTransform(scrollY, [0, SCROLL_THRESHOLD], [100, 50]);
  const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;

  const backgroundImage = useMotionTemplate`radial-gradient(132% 132% at 50% 10%, rgba(2, 6, 23, 0.8) 50%, ${color})`;
  const border = useMotionTemplate`1px solid ${color}`;
  const boxShadow = useMotionTemplate`0px 4px 24px ${color}`;

  const parallaxFadeOut = [
    SCROLL_THRESHOLD + SECTION_HEIGHT - 400,
    SCROLL_THRESHOLD + SECTION_HEIGHT - 100
  ];


  return (
    <div className="relative h-[300vh] bg-black">
      {/* Hero Section */}
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
          <Link href="/welcome">
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
          className="absolute bottom-0 left-0 right-0 h-[100vh] bg-gradient-to-b from-transparent to-black"
          style={{
            opacity: useTransform(scrollY, [SCROLL_THRESHOLD - 300, SCROLL_THRESHOLD], [0, 1]),
          }}
        />
      </motion.section>

      {/* Parallax Section */}
      <motion.section
        className="absolute top-[100vh] w-full"
        style={{
          opacity: useTransform(
            scrollY,
            [SCROLL_THRESHOLD - 200, SCROLL_THRESHOLD, ...parallaxFadeOut],
            [0, 1, 1, 0]
          ),
        }}
      >
        <ParallaxImages />
      </motion.section>

      {/* About Section */}
      <motion.section
        className="relative top-[200vh] h-screen w-full flex items-center justify-center text-white"
        style={{
          backgroundImage,
          opacity: useTransform(
            scrollY,
            [SCROLL_THRESHOLD + SECTION_HEIGHT - 1200, SCROLL_THRESHOLD + SECTION_HEIGHT],
            [0, 1]
          ),
        }}
      >
        <div className="w-full max-w-6xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-12">
          <motion.div 
            className="lg:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-300">
              About Us
            </h2>
            <p className="text-lg leading-relaxed text-gray-300 mb-6">
              Scio.ly was created by a team of Naperville high school students, dedicated to the Science Olympiad competition.
              We aim to provide all Science Olympiad students with the best and easiest way to practice their events.
            </p>
            <p className="text-lg leading-relaxed text-gray-300">
              Our team strives to provide the best tests in the most realistic and interactive way.
            </p>
          </motion.div>
          <motion.div 
            className="lg:w-[55%] relative flex justify-center"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.img
              src="/ASK.png"
              alt="Science Olympiad"
              className="relative w-[300px] h-[42vh] object-cover rounded-2xl shadow-2xl"
            />
          </motion.div>

          {/* Background Canvas */}
          <div className="absolute inset-0 z-0 opacity-30">
            <Canvas>
              <Stars radius={50} count={1500} factor={4} fade speed={1} />
            </Canvas>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
