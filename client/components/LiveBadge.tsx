"use client";

import { motion } from "motion/react";
import clsx from "clsx";

export default function LiveBadge({ source }: { source: "thryve-ml" | "biometric-proxy" }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border",
        source === "thryve-ml"
          ? "bg-mint border-mint-dark/40 text-sage"
          : "bg-amber-light border-amber/20 text-amber"
      )}
    >
      <span className={clsx(
        "w-1.5 h-1.5 rounded-full",
        source === "thryve-ml" ? "bg-sage animate-pulse" : "bg-amber"
      )} />
      {source === "thryve-ml" ? "Live · Thryve ML + Mistral" : "Live · Biometric signals + Mistral"}
    </motion.span>
  );
}
