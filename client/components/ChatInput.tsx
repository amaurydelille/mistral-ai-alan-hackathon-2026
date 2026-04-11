"use client";

import { useState, useRef } from "react";
import clsx from "clsx";

interface ChatInputProps {
  suggestions?: string[];
  onSubmit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function ChatInput({
  suggestions = [],
  onSubmit,
  placeholder = "Ask anything...",
  disabled = false,
  className,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      {/* Quick suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSubmit(s)}
              disabled={disabled}
              className="rounded-full border border-sage/30 bg-white/60 px-4 py-2 text-sm text-sage hover:bg-mint hover:border-sage/60 transition-all duration-150 disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Text input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit(value);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 rounded-2xl border border-mint-dark/40 bg-white/80 px-4 py-3 text-sm text-ink placeholder:text-ink-soft/40 focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 disabled:opacity-50 transition-colors"
        />
        <button
          onClick={() => handleSubmit(value)}
          disabled={disabled || !value.trim()}
          className="rounded-2xl bg-sage px-5 py-3 text-sm font-medium text-cream hover:bg-sage-dark transition-colors disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
