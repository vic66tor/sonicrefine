"use client";

import { useState } from "react";
import WaveformVisualizer from "./WaveformVisualizer";

interface AnalysisData {
  bitrate?: number;
  loudness?: number;
  peakLevel?: number;
  clipping?: boolean;
  spectralBalance?: { low: number; mid: number; high: number };
  dynamicRange?: number;
  stereoWidth?: number;
  sampleRate?: number;
  channels?: number;
}

interface AudioPlayerComparisonProps {
  title: string;
  analysisData?: AnalysisData | null;
  isProcessed: boolean;
}

export default function AudioPlayerComparison({
  title,
  analysisData,
  isProcessed,
}: AudioPlayerComparisonProps) {
  const [activeTab, setActiveTab] = useState<"original" | "enhanced">(
    "original"
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const analysis = analysisData as AnalysisData | null;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {isProcessed && (
          <div className="flex bg-surface-700 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab("original")}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition ${
                activeTab === "original"
                  ? "bg-surface-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setActiveTab("enhanced")}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition ${
                activeTab === "enhanced"
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Enhanced
            </button>
          </div>
        )}
      </div>

      {/* Waveform display */}
      <div className="bg-surface-800 rounded-xl p-4 mb-4">
        <WaveformVisualizer
          barCount={60}
          animated={isPlaying}
          color={activeTab === "enhanced" ? "brand" : "gray"}
          height={64}
        />
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-700 flex items-center justify-center transition"
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="white"
              className="ml-0.5"
            >
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <div className="flex-1 h-1 bg-surface-600 rounded-full">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              activeTab === "enhanced"
                ? "bg-brand-500"
                : "bg-gray-500"
            }`}
            style={{ width: isPlaying ? "35%" : "0%" }}
          />
        </div>
        <span className="text-xs text-gray-400 font-mono">
          {isPlaying ? "1:24" : "0:00"} / 4:05
        </span>
      </div>

      {/* Analysis metrics */}
      {analysis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="Loudness"
            value={`${analysis.loudness?.toFixed(1)} LUFS`}
            optimal={
              activeTab === "enhanced"
                ? "-14.0 LUFS"
                : undefined
            }
          />
          <MetricCard
            label="Peak Level"
            value={`${analysis.peakLevel?.toFixed(1)} dB`}
            optimal={
              activeTab === "enhanced" ? "-1.0 dB" : undefined
            }
          />
          <MetricCard
            label="Dynamic Range"
            value={`${analysis.dynamicRange?.toFixed(1)} dB`}
            optimal={
              activeTab === "enhanced" ? "9.2 dB" : undefined
            }
          />
          <MetricCard
            label="Stereo Width"
            value={`${((analysis.stereoWidth ?? 0) * 100).toFixed(0)}%`}
            optimal={
              activeTab === "enhanced" ? "82%" : undefined
            }
          />
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4 italic">
        Note: This is a perceptual enhancement — results represent optimized
        audio characteristics, not a reconstruction of lossless source quality.
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  optimal,
}: {
  label: string;
  value: string;
  optimal?: string;
}) {
  return (
    <div className="bg-surface-800 rounded-lg p-3">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
      {optimal && (
        <p className="text-xs text-brand-400 mt-0.5">→ {optimal}</p>
      )}
    </div>
  );
}
