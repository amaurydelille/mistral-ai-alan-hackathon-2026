"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SCREENS = [
  { href: "/onboarding", label: "Onboarding", short: "1", navHref: "/onboarding?reset=1" },
  { href: "/overview", label: "Overview", short: "2" },
  { href: "/what-if", label: "What If", short: "3" },
  { href: "/promises", label: "Promises", short: "4" },
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
    <nav className="fixed top-0 left-0 right-0 z-50 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-4 px-8 py-4 backdrop-blur-sm bg-cream/80 border-b border-mint-dark/40">
      <div className="flex justify-start min-w-0">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight text-ink shrink-0">
          vital
          <span className="text-sage">.</span>
        </Link>
      </div>

      <div className="flex items-center justify-center gap-1 shrink-0">
        {SCREENS.map((screen) => {
          const isActive = pathname.startsWith(screen.href);
          return (
            <Link
              key={screen.href}
              href={"navHref" in screen ? screen.navHref! : screen.href}
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

      <div className="flex justify-end min-w-0">
        <span className="text-xs text-ink-soft/60 font-mono hidden md:inline text-right">
          ← → to navigate
        </span>
      </div>
    </nav>
  );
}
