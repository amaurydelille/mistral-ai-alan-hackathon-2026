import Link from "next/link";
import Nav from "@/components/Nav";

export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
      <Nav />
      <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
        {/* Pill badge */}
        <div className="mb-8 rounded-full border border-sage/30 bg-mint/50 px-4 py-1.5 text-xs font-medium text-sage uppercase tracking-widest">
          Mistral × Alan — Health AI Demo
        </div>

        {/* Main headline */}
        <h1 className="font-display text-6xl md:text-8xl font-semibold tracking-tight text-ink leading-[0.95] mb-6 max-w-3xl">
          Your health data, finally{" "}
          <span className="text-sage italic">talking to you.</span>
        </h1>

        <p className="text-lg text-ink-soft max-w-xl leading-relaxed mb-12">
          Not built for athletes. Built for the 95% — the people Alan actually
          insures. A personal coach that knows your body, your habits, your patterns.
        </p>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link
            href="/onboarding"
            className="rounded-full bg-sage px-8 py-4 text-base font-medium text-cream hover:bg-sage-dark transition-colors shadow-lg shadow-sage/20"
          >
            Start demo →
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-ink/10 bg-white/60 px-8 py-4 text-base font-medium text-ink-soft hover:border-ink/20 hover:text-ink transition-colors"
          >
            Skip to dashboard
          </Link>
        </div>

        {/* Demo persona hint */}
        <p className="mt-8 text-xs text-ink-soft/40">
          Demo persona: Marie, 31 · Product Manager, Paris
        </p>

        {/* Floating bottom stats */}
        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-8 text-xs text-ink-soft/50">
          <span>← → to navigate between screens</span>
          <span>·</span>
          <span>6 demo screens</span>
          <span>·</span>
          <span>No network required</span>
        </div>
      </div>
    </div>
  );
}
