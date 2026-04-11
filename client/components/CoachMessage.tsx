"use client";

import { useState, useEffect, useRef } from "react";
import clsx from "clsx";

interface CoachMessageProps {
  text: string;
  from?: "coach" | "user";
  typewriter?: boolean;
  speed?: number; // ms per char
  onDone?: () => void;
  className?: string;
}

export default function CoachMessage({
  text,
  from = "coach",
  typewriter = false,
  speed = 18,
  onDone,
  className,
}: CoachMessageProps) {
  const [displayed, setDisplayed] = useState(typewriter ? "" : text);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!typewriter) {
      setDisplayed(text);
      return;
    }
    setDisplayed("");
    indexRef.current = 0;

    const tick = () => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current < text.length) {
        id = setTimeout(tick, speed);
      } else {
        onDone?.();
      }
    };
    let id = setTimeout(tick, speed);
    return () => clearTimeout(id);
  }, [text, typewriter, speed, onDone]);

  const isCoach = from === "coach";

  return (
    <div
      className={clsx(
        "flex gap-3",
        isCoach ? "flex-row" : "flex-row-reverse",
        className
      )}
    >
      {isCoach && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sage flex items-center justify-center text-cream text-xs font-semibold font-display mt-0.5">
          V
        </div>
      )}

      <div
        className={clsx(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isCoach
            ? "bg-white/90 border border-mint-dark/30 text-ink rounded-tl-sm shadow-sm"
            : "bg-sage text-cream rounded-tr-sm"
        )}
      >
        {displayed}
        {typewriter && displayed.length < text.length && (
          <span className="inline-block w-0.5 h-3.5 bg-sage ml-0.5 animate-pulse align-text-bottom" />
        )}
      </div>
    </div>
  );
}
