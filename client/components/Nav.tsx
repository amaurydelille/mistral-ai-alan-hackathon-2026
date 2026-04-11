"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SCREENS = [
  { href: "/onboarding", label: "Onboarding", short: "1" },
  { href: "/dashboard", label: "Dashboard", short: "2" },
  { href: "/forecast", label: "Forecast", short: "3" },
  { href: "/what-if", label: "What If", short: "4" },
  { href: "/one-thing", label: "One Thing", short: "5" },
  { href: "/recap", label: "Recap", short: "6" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  // Keyboard navigation for stage presenter mode
  useEffect(() => {
    const current = SCREENS.findIndex((s) => pathname.startsWith(s.href));
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && current < SCREENS.length - 1) {
        router.push(SCREENS[current + 1].href);
      }
      if (e.key === "ArrowLeft" && current > 0) {
        router.push(SCREENS[current - 1].href);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pathname, router]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 backdrop-blur-sm bg-cream/80 border-b border-mint-dark/40">
      <Link href="/" className="font-display text-xl font-semibold tracking-tight text-ink">
        vital
        <span className="text-sage">.</span>
      </Link>

      <div className="flex items-center gap-1">
        {SCREENS.map((screen) => {
          const isActive = pathname.startsWith(screen.href);
          return (
            <Link
              key={screen.href}
              href={screen.href}
              className={clsx(
                "relative px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sage text-cream"
                  : "text-ink-soft hover:text-ink hover:bg-mint"
              )}
            >
              <span className="hidden sm:inline">{screen.label}</span>
              <span className="sm:hidden">{screen.short}</span>
            </Link>
          );
        })}
      </div>

      <div className="text-xs text-ink-soft/60 font-mono hidden md:block">
        ← → to navigate
      </div>
    </nav>
  );
}
