"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import WaveformVisualizer from "@/components/WaveformVisualizer";

const features = [
  {
    icon: "🔍",
    title: "Intelligent Analysis",
    desc: "Deep analysis of bitrate, loudness, clipping, spectral balance and dynamic range before any processing begins.",
  },
  {
    icon: "🎛️",
    title: "Adaptive EQ & Compression",
    desc: "AI-driven EQ correction and multiband compression that adapts to your audio's unique characteristics.",
  },
  {
    icon: "🎧",
    title: "Stereo Enhancement",
    desc: "Widen the stereo image and improve spatial definition without introducing artifacts.",
  },
  {
    icon: "🔊",
    title: "Loudness Optimization",
    desc: "Broadcast-ready loudness normalization with intelligent limiting for maximum punch.",
  },
  {
    icon: "🧹",
    title: "Noise Reduction",
    desc: "Optional denoising to clean up background noise while preserving signal clarity.",
  },
  {
    icon: "📦",
    title: "Multi-Format Export",
    desc: "Export your enhanced audio in MP3, WAV, FLAC, or AAC at optimal quality settings.",
  },
];

const steps = [
  { num: "01", title: "Upload", desc: "Drop your MP3 file or browse to upload" },
  { num: "02", title: "Analyze", desc: "AI examines your audio's characteristics" },
  { num: "03", title: "Enhance", desc: "Intelligent processing pipeline runs" },
  { num: "04", title: "Export", desc: "Download in your preferred format" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-sm text-brand-300 mb-8">
              <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
              AI-Powered Audio Enhancement
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="gradient-text">Transform</span> your audio
              <br />
              into its{" "}
              <span className="gradient-text">best version</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Upload any MP3 file and let our AI enhance its perceived quality.
              Advanced spectral analysis, adaptive EQ, multiband compression,
              and intelligent loudness optimization — all fully automated.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-semibold rounded-xl transition shadow-lg shadow-brand-600/25 text-center"
              >
                Start Enhancing — Free
              </Link>
              <Link
                href="#features"
                className="w-full sm:w-auto px-8 py-3.5 glass hover:bg-white/5 font-semibold rounded-xl transition text-center"
              >
                See How It Works
              </Link>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              ✦ Perceptual enhancement — we optimize, not reconstruct lossless quality
            </p>
          </div>

          {/* Hero waveform */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500 ml-2 font-mono">
                  audio_project.mp3 — Enhanced
                </span>
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-2">Original</p>
                  <WaveformVisualizer barCount={50} color="gray" height={40} />
                </div>
                <div className="text-2xl text-brand-400">→</div>
                <div className="flex-1">
                  <p className="text-xs text-brand-400 mb-2">Enhanced</p>
                  <WaveformVisualizer barCount={50} color="brand" height={40} animated />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">
            Four steps to{" "}
            <span className="gradient-text">better sound</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="glass rounded-xl p-6 group hover:border-brand-500/30 transition">
                <span className="text-4xl font-black text-brand-500/20 group-hover:text-brand-500/40 transition">
                  {step.num}
                </span>
                <h3 className="text-lg font-semibold mt-2 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            Processing{" "}
            <span className="gradient-text">Pipeline</span>
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
            Every file goes through a comprehensive multi-stage enhancement
            pipeline designed by audio engineers.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="glass rounded-xl p-6 hover:border-brand-500/30 transition group"
              >
                <div className="text-3xl mb-3">{feat.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-400">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to <span className="gradient-text">enhance</span>?
          </h2>
          <p className="text-gray-400 mb-8">
            Upload your first track and hear the difference.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3.5 bg-gradient-to-r from-brand-600 to-accent-500 hover:opacity-90 text-white font-semibold rounded-xl transition shadow-lg"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-500 to-accent-500" />
            <span className="text-sm font-semibold gradient-text">SonicRefine</span>
          </div>
          <p className="text-xs text-gray-500">
            © 2025 SonicRefine. Perceptual audio enhancement powered by AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
