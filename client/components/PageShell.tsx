"use client";

import { motion } from "motion/react";
import Nav from "./Nav";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <div className="min-h-screen bg-cream">
      <Nav />
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`pt-20 ${className}`}
      >
        {children}
      </motion.main>
    </div>
  );
}
