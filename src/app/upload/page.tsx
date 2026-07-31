"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/useAuth";

interface ProcessingSettings {
  normalize: boolean;
  denoise: boolean;
  eqCorrection: boolean;
  multibandCompression: boolean;
  stereoEnhancement: boolean;
  limiting: boolean;
  loudnessNormalization: boolean;
}

export default function UploadPage() {
  const { user, loading: authLoading, authHeaders } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [outputFormat, setOutputFormat] = useState("mp3");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<ProcessingSettings>({
    normalize: true,
    denoise: false,
    eqCorrection: true,
    multibandCompression: true,
    stereoEnhancement: false,
    limiting: true,
    loudnessNormalization: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === "audio/mpeg") {
      setFile(dropped);
      if (!title) {
        setTitle(dropped.name.replace(/\.mp3$/i, ""));
      }
    } else {
      setError("Please upload an MP3 file");
    }
  }, [title]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.mp3$/i, ""));
      }
      setError("");
    }
  };

  const toggleSetting = (key: keyof ProcessingSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an audio file");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a project title");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Create the project
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          title: title.trim(),
          originalFilename: file.name,
          outputFormat,
          processingSettings: settings,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      const { project } = await res.json();

      // Start processing (simulated)
      await fetch(`/api/projects/${project.id}/process`, {
        method: "POST",
        headers: authHeaders(),
      });

      router.push(`/project/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  };

  const settingsList: { key: keyof ProcessingSettings; label: string; desc: string }[] = [
    { key: "normalize", label: "Input Normalization", desc: "Normalize input levels before processing" },
    { key: "denoise", label: "Noise Reduction", desc: "Remove background noise and hiss" },
    { key: "eqCorrection", label: "EQ Correction", desc: "Adaptive frequency response optimization" },
    { key: "multibandCompression", label: "Multiband Compression", desc: "Dynamic range control across frequency bands" },
    { key: "stereoEnhancement", label: "Stereo Enhancement", desc: "Widen and improve stereo imaging" },
    { key: "limiting", label: "Limiting", desc: "Peak limiting for loudness and protection" },
    { key: "loudnessNormalization", label: "Loudness Normalization", desc: "Target -14 LUFS for streaming platforms" },
  ];

  if (authLoading) return null;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-2">Upload Audio</h1>
        <p className="text-gray-400 text-sm mb-8">
          Upload an MP3 file and configure your enhancement settings
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`glass rounded-2xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-brand-500 bg-brand-500/5"
                : file
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "hover:border-white/20"
            }`}
            onClick={() =>
              document.getElementById("file-input")?.click()
            }
          >
            <input
              id="file-input"
              type="file"
              accept=".mp3,audio/mpeg"
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-xs text-gray-400">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="ml-4 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-surface-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="font-semibold mb-1">Drop your MP3 file here</p>
                <p className="text-sm text-gray-400">or click to browse</p>
                <p className="text-xs text-gray-500 mt-2">
                  Supports MP3 files up to 100 MB
                </p>
              </>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              placeholder="My awesome track"
              required
            />
          </div>

          {/* Output format */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Output Format
            </label>
            <div className="grid grid-cols-4 gap-3">
              {["mp3", "wav", "flac", "aac"].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setOutputFormat(fmt)}
                  className={`py-2.5 rounded-lg text-sm font-semibold uppercase transition ${
                    outputFormat === fmt
                      ? "bg-brand-600 text-white"
                      : "bg-surface-700 text-gray-400 hover:text-white hover:bg-surface-600"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Processing settings */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Processing Pipeline
            </label>
            <div className="glass rounded-xl divide-y divide-white/5">
              {settingsList.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-gray-500">{s.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSetting(s.key)}
                    className={`relative w-11 h-6 rounded-full transition ${
                      settings[s.key]
                        ? "bg-brand-600"
                        : "bg-surface-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        settings[s.key]
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-800 rounded-xl p-4 border border-white/5">
            <p className="text-xs text-gray-400">
              ⚡ <strong className="text-gray-300">Perceptual Enhancement:</strong>{" "}
              Our pipeline optimizes the perceived quality of your audio through
              intelligent spectral analysis and adaptive processing. This is not a
              reconstruction of lossless source material — it&apos;s an enhancement
              of your audio&apos;s perceived characteristics.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating project...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Start Enhancement
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
