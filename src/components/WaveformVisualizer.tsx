"use client";

import { useMemo } from "react";

interface WaveformVisualizerProps {
  barCount?: number;
  animated?: boolean;
  color?: string;
  height?: number;
}

export default function WaveformVisualizer({
  barCount = 40,
  animated = false,
  color = "brand",
  height = 48,
}: WaveformVisualizerProps) {
  const bars = useMemo(() => {
    return Array.from({ length: barCount }, () => 0.2 + Math.random() * 0.8);
  }, [barCount]);

  const colorMap: Record<string, string> = {
    brand: "bg-brand-500",
    accent: "bg-accent-500",
    green: "bg-emerald-500",
    gray: "bg-gray-500",
  };

  return (
    <div
      className="flex items-end gap-[2px]"
      style={{ height }}
    >
      {bars.map((h, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t-sm ${colorMap[color] || colorMap.brand} ${animated ? "opacity-80" : "opacity-50"}`}
          style={{
            height: `${h * 100}%`,
            animation: animated
              ? `wave-bar ${0.8 + Math.random() * 0.6}s ease-in-out ${i * 0.03}s infinite`
              : undefined,
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}
