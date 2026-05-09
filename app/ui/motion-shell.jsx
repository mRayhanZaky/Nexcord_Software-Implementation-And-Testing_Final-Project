"use client";

import { motion } from "framer-motion";

export function NebulaShell({ children, className = "" }) {
  return (
    <div className={`nebula-shell ${className}`}>
      <div className="particle-field" />
      <div className="grid-glow" />
      {children}
    </div>
  );
}

export function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function BrandMark() {
  return (
    <span className="brand-mark">
      <span className="brand-glyph">N</span>
      NEXCORD
    </span>
  );
}

export const floatTransition = {
  duration: 5,
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
};
