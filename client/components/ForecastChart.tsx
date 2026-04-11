"use client";

import { motion } from "motion/react";

interface ForecastChartProps {
  /** Smoothed composite scores for the last N days (typically 7). */
  historical: number[];
  /** Projected composite scores for next 3 days. */
  projected: number[];
  /** ISO date strings for the historical x-axis labels. */
  historicalDates?: string[];
  className?: string;
}

const W = 620;
const H = 160;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

// Risk thresholds
const MODERATE_Y = 40;
const HIGH_Y = 65;

function toSvgY(value: number): number {
  // value 0-100 → SVG y (0 = top)
  return PAD.top + CHART_H - (value / 100) * CHART_H;
}

function toSvgX(index: number, total: number): number {
  return PAD.left + (index / (total - 1)) * CHART_W;
}

function pointsToPath(pts: [number, number][]): string {
  if (!pts.length) return "";
  return pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const prev = pts[i - 1];
    const cpX = (prev[0] + x) / 2;
    return `${acc} C ${cpX} ${prev[1]}, ${cpX} ${y}, ${x} ${y}`;
  }, "");
}

function riskColor(value: number): string {
  if (value >= HIGH_Y) return "#D86849";     // coral
  if (value >= MODERATE_Y) return "#E8A04B"; // amber
  return "#1A6B4A";                           // sage
}

export default function ForecastChart({
  historical,
  projected,
  historicalDates = [],
  className,
}: ForecastChartProps) {
  const allValues = [...historical, ...projected];
  const totalPoints = allValues.length;
  if (totalPoints < 2) return null;

  // Build all SVG points
  const allPoints: [number, number][] = allValues.map((v, i) => [
    toSvgX(i, totalPoints),
    toSvgY(v),
  ]);

  const histPoints = allPoints.slice(0, historical.length);
  const projPoints = allPoints.slice(historical.length - 1); // include last hist point as join

  // Historical path
  const histPath = pointsToPath(histPoints);

  // Projected path (starts from last historical point)
  const projPath = pointsToPath(projPoints);

  // Area fill for historical
  const areaPath = histPath
    + ` L ${histPoints[histPoints.length - 1][0]} ${PAD.top + CHART_H}`
    + ` L ${histPoints[0][0]} ${PAD.top + CHART_H} Z`;

  // Threshold line Y positions
  const moderateLineY = toSvgY(MODERATE_Y);
  const highLineY = toSvgY(HIGH_Y);

  // Today divider (last historical point)
  const todayX = histPoints[histPoints.length - 1][0];

  // X-axis labels (show first, middle, today, proj labels)
  const projLabels = ["Today", "Tmrw", "Day 3"];
  const projLabelPoints = projected.map((_, i) => allPoints[historical.length + i]);

  // Format date label
  function fmtDate(iso: string): string {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00Z");
    return d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3);
  }

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: "auto", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A6B4A" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#1A6B4A" stopOpacity="0.01" />
          </linearGradient>
          {/* Clip the dashed line so it animates in from left */}
          <clipPath id="projClip">
            <rect x={todayX} y="0" width={W} height={H} />
          </clipPath>
        </defs>

        {/* ── Risk zone fills ─────────────────────────────────────────── */}
        {/* Green zone: 0-40 */}
        <rect
          x={PAD.left} y={moderateLineY}
          width={CHART_W} height={PAD.top + CHART_H - moderateLineY}
          fill="#D8EDE2" opacity={0.25}
        />
        {/* Amber zone: 40-65 */}
        <rect
          x={PAD.left} y={highLineY}
          width={CHART_W} height={moderateLineY - highLineY}
          fill="#FDF3E3" opacity={0.4}
        />
        {/* Red zone: 65-100 */}
        <rect
          x={PAD.left} y={PAD.top}
          width={CHART_W} height={highLineY - PAD.top}
          fill="#FCEEE9" opacity={0.4}
        />

        {/* ── Threshold lines ──────────────────────────────────────────── */}
        <line
          x1={PAD.left} y1={moderateLineY} x2={PAD.left + CHART_W} y2={moderateLineY}
          stroke="#E8A04B" strokeWidth={1} strokeDasharray="4 4" opacity={0.6}
        />
        <line
          x1={PAD.left} y1={highLineY} x2={PAD.left + CHART_W} y2={highLineY}
          stroke="#D86849" strokeWidth={1} strokeDasharray="4 4" opacity={0.6}
        />
        {/* Threshold labels */}
        <text x={PAD.left - 4} y={moderateLineY + 4} textAnchor="end" fontSize={9} fill="#E8A04B" fontFamily="monospace">40</text>
        <text x={PAD.left - 4} y={highLineY + 4} textAnchor="end" fontSize={9} fill="#D86849" fontFamily="monospace">65</text>

        {/* ── Today divider ─────────────────────────────────────────────── */}
        <line
          x1={todayX} y1={PAD.top - 4} x2={todayX} y2={PAD.top + CHART_H}
          stroke="#4A4F48" strokeWidth={1} strokeDasharray="3 3" opacity={0.3}
        />
        <text x={todayX} y={PAD.top - 6} textAnchor="middle" fontSize={9} fill="#4A4F48" opacity={0.5} fontFamily="monospace">NOW</text>

        {/* ── Historical area fill ─────────────────────────────────────── */}
        <path d={areaPath} fill="url(#histGrad)" />

        {/* ── Historical line ──────────────────────────────────────────── */}
        <motion.path
          d={histPath}
          stroke="#1A6B4A"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />

        {/* ── Projected line (dashed, color-coded to final risk) ───────── */}
        <motion.path
          d={projPath}
          stroke={riskColor(projected[projected.length - 1] ?? 50)}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="5 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.8, ease: "easeOut" }}
        />

        {/* ── Historical dots ──────────────────────────────────────────── */}
        {histPoints.map(([x, y], i) => {
          const val = historical[i];
          return (
            <motion.circle
              key={`h-${i}`}
              cx={x} cy={y} r={3}
              fill={riskColor(val)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05 * i, duration: 0.25 }}
            />
          );
        })}

        {/* ── Projected dots (larger, more prominent) ─────────────────── */}
        {projected.map((val, i) => {
          const [x, y] = allPoints[historical.length + i];
          return (
            <motion.circle
              key={`p-${i}`}
              cx={x} cy={y} r={5}
              fill={riskColor(val)}
              stroke="white"
              strokeWidth={2}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.9 + 0.12 * i, duration: 0.3 }}
            />
          );
        })}

        {/* ── X-axis labels ────────────────────────────────────────────── */}
        {/* Historical dates — show first, ~middle, last before today */}
        {historicalDates.length > 0 && [0, Math.floor(historicalDates.length / 2)].map((idx) => {
          const [x] = histPoints[idx] ?? [0, 0];
          return (
            <text key={`dl-${idx}`} x={x} y={H - 4} textAnchor="middle" fontSize={9} fill="#4A4F48" opacity={0.45} fontFamily="monospace">
              {fmtDate(historicalDates[idx])}
            </text>
          );
        })}
        {/* Projected labels */}
        {projLabelPoints.map(([x], i) => (
          <text key={`proj-lbl-${i}`} x={x} y={H - 4} textAnchor="middle" fontSize={9} fill={riskColor(projected[i])} fontFamily="monospace" fontWeight="600">
            {projLabels[i]}
          </text>
        ))}
      </svg>
    </div>
  );
}
