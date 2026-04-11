"use client";

interface TrendSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  className?: string;
}

export default function TrendSparkline({
  data,
  width = 240,
  height = 56,
  color = "#1A6B4A",
  fillColor = "#D8EDE2",
  className,
}: TrendSparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const rawRange = max - min || 1;
  // Pad the y-axis so tight clusters don't render as dramatic cliffs.
  const yPad = Math.max(rawRange * 0.5, (min + max) * 0.05);
  const paddedMin = min - yPad;
  const paddedMax = max + yPad;
  const range = paddedMax - paddedMin;

  const pad = 3;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + h - ((v - paddedMin) / range) * h;
    return [x, y] as [number, number];
  });

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
    // width="100%" so the sparkline stretches to fill its container.
    // viewBox preserves the coordinate space used for path calculations.
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      fill="none"
      preserveAspectRatio="none"
      className={className}
    >
      <path d={fillD} fill={fillColor} opacity={0.6} />
      <path
        d={pathD}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2.5}
        fill={color}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
