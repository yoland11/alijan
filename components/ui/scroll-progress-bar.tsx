"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.22,
  });

  return (
    <motion.div
      className="no-print pointer-events-none fixed inset-x-0 top-0 z-[90] h-[3px] origin-right bg-gradient-to-l from-ajn-gold via-ajn-goldSoft to-white/90 shadow-[0_0_18px_rgba(212,175,55,0.35)]"
      style={{ scaleX }}
    />
  );
}
