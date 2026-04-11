"use client";

interface TrendSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
}

export default function TrendSparkline({
  data,
  width = 120,
  height = 36,
  color = "#1A6B4A",
  fillColor = "#D8EDE2",
}: TrendSparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pad = 3;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return [x, y] as [number, number];
  });

  // Smooth curve using cubic bezier approximation
  const pathD = points.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const prev = points[i - 1];
    const cpX = (prev[0] + x) / 2;
    return `${acc} C ${cpX} ${prev[1]}, ${cpX} ${y}, ${x} ${y}`;
  }, "");

  const fillD =
    pathD +
    ` L ${points[points.length - 1][0]} ${height} L ${points[0][0]} ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className="overflow-visible"
    >
      <path d={fillD} fill={fillColor} opacity={0.6} />
      <path
        d={pathD}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}
