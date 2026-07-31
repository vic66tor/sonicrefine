"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import AudioPlayerComparison from "@/components/AudioPlayerComparison";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import { useAuth } from "@/lib/useAuth";

interface ProcessingSettings {
  normalize?: boolean;
  denoise?: boolean;
  eqCorrection?: boolean;
  multibandCompression?: boolean;
  stereoEnhancement?: boolean;
  limiting?: boolean;
  loudnessNormalization?: boolean;
}

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

interface Project {
  id: string;
  title: string;
  originalFilename: string;
  status: string;
  outputFormat: string;
  analysisData: AnalysisData | null;
  processingSettings: ProcessingSettings | null;
  durationSeconds: number | null;
  originalBitrate: number | null;
  sampleRate: number | null;
  channels: number | null;
  errorMessage: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading, authHeaders } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadFormat, setDownloadFormat] = useState("mp3");

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);

        // Poll if still processing
        if (
          ["pending", "uploading", "analyzing", "processing"].includes(
            data.project.status
          )
        ) {
          setTimeout(fetchProject, 2000);
        }
      } else {
        router.push("/dashboard");
      }
    } catch {
      console.error("Failed to fetch project");
    } finally {
      setLoading(false);
    }
  }, [id, authHeaders, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchProject();
    }
  }, [user, authLoading, router, fetchProject]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!project) return null;

  const isProcessing = ["uploading", "analyzing", "processing"].includes(
    project.status
  );
  const isCompleted = project.status === "completed";
  const isFailed = project.status === "failed";

  const analysis = project.analysisData;
  const settings = project.processingSettings;

  const handleDownload = async () => {
    const res = await fetch(
      `/api/projects/${id}/download?format=${downloadFormat}`,
      { headers: authHeaders() }
    );
    const data = await res.json();
    alert(
      `${data.message}\n\nFilename: ${data.filename}\n\n${data.note}`
    );
  };

  const handleReprocess = async () => {
    await fetch(`/api/projects/${id}/process`, {
      method: "POST",
      headers: authHeaders(),
    });
    fetchProject();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const pipelineSteps = [
    { label: "Upload", done: project.status !== "pending" },
    {
      label: "Analysis",
      done: ["analyzing", "processing", "completed"].includes(project.status),
      active: project.status === "analyzing",
    },
    {
      label: "Processing",
      done: ["processing", "completed"].includes(project.status),
      active: project.status === "processing",
    },
    {
      label: "Complete",
      done: project.status === "completed",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/dashboard" className="hover:text-white transition">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-white">{project.title}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-sm text-gray-400 flex items-center gap-3">
              <span>{project.originalFilename}</span>
              <span>•</span>
              <span>{formatDuration(project.durationSeconds)}</span>
              <span>•</span>
              <span>{project.outputFormat.toUpperCase()}</span>
            </p>
          </div>

          {isFailed && (
            <button
              onClick={handleReprocess}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition text-sm"
            >
              Retry Processing
            </button>
          )}
        </div>

        {/* Pipeline progress */}
        {isProcessing && (
          <div className="glass rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-semibold mb-4 text-gray-300">
              Processing Pipeline
            </h2>
            <div className="flex items-center gap-2">
              {pipelineSteps.map((step, i) => (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        step.done
                          ? "bg-brand-600 text-white"
                          : step.active
                          ? "bg-brand-600/30 text-brand-400 animate-pulse-glow"
                          : "bg-surface-600 text-gray-500"
                      }`}
                    >
                      {step.done && !step.active ? "✓" : i + 1}
                    </div>
                    <span
                      className={`text-xs mt-1.5 ${
                        step.done || step.active
                          ? "text-white"
                          : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < pipelineSteps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 -mt-5 ${
                        step.done ? "bg-brand-600" : "bg-surface-600"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {project.status === "analyzing" && (
              <div className="mt-6 bg-surface-800 rounded-xl p-4">
                <p className="text-sm text-gray-300 mb-2">
                  Analyzing audio characteristics...
                </p>
                <WaveformVisualizer
                  barCount={40}
                  animated
                  color="brand"
                  height={32}
                />
              </div>
            )}

            {project.status === "processing" && (
              <div className="mt-6 bg-surface-800 rounded-xl p-4">
                <p className="text-sm text-gray-300 mb-2">
                  Applying enhancement pipeline...
                </p>
                <div className="w-full h-2 bg-surface-600 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-600 to-accent-500 rounded-full animate-pulse w-3/4" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {isFailed && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8">
            <p className="text-red-400 text-sm font-medium">Processing Failed</p>
            {project.errorMessage && (
              <p className="text-red-400/70 text-xs mt-1">{project.errorMessage}</p>
            )}
          </div>
        )}

        {/* Audio player comparison */}
        {(isCompleted || analysis) && (
          <div className="mb-8">
            <AudioPlayerComparison
              title={project.title}
              analysisData={analysis}
              isProcessed={isCompleted}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Analysis results */}
          {analysis && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Audio Analysis</h2>
              <div className="space-y-3">
                <AnalysisRow
                  label="Bitrate"
                  value={`${analysis.bitrate} kbps`}
                />
                <AnalysisRow
                  label="Sample Rate"
                  value={`${((analysis.sampleRate ?? 0) / 1000).toFixed(1)} kHz`}
                />
                <AnalysisRow
                  label="Channels"
                  value={analysis.channels === 2 ? "Stereo" : "Mono"}
                />
                <AnalysisRow
                  label="Integrated Loudness"
                  value={`${analysis.loudness?.toFixed(1)} LUFS`}
                />
                <AnalysisRow
                  label="True Peak"
                  value={`${analysis.peakLevel?.toFixed(1)} dBTP`}
                />
                <AnalysisRow
                  label="Clipping Detected"
                  value={analysis.clipping ? "Yes ⚠️" : "No ✓"}
                  valueColor={analysis.clipping ? "text-red-400" : "text-emerald-400"}
                />
                <AnalysisRow
                  label="Dynamic Range"
                  value={`${analysis.dynamicRange?.toFixed(1)} dB`}
                />

                {analysis.spectralBalance && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-400 mb-2">
                      Spectral Balance
                    </p>
                    <div className="flex gap-2">
                      <SpectrumBar
                        label="Low"
                        value={analysis.spectralBalance.low}
                        color="bg-blue-500"
                      />
                      <SpectrumBar
                        label="Mid"
                        value={analysis.spectralBalance.mid}
                        color="bg-emerald-500"
                      />
                      <SpectrumBar
                        label="High"
                        value={analysis.spectralBalance.high}
                        color="bg-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Processing settings & download */}
          <div className="space-y-6">
            {settings && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Processing Settings
                </h2>
                <div className="space-y-2">
                  {Object.entries(settings).map(([key, enabled]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          enabled ? "text-emerald-400" : "text-gray-500"
                        }`}
                      >
                        {enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Download Enhanced Audio
                </h2>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {["mp3", "wav", "flac", "aac"].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setDownloadFormat(fmt)}
                      className={`py-2 rounded-lg text-xs font-semibold uppercase transition ${
                        downloadFormat === fmt
                          ? "bg-brand-600 text-white"
                          : "bg-surface-700 text-gray-400 hover:text-white"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full py-2.5 bg-gradient-to-r from-brand-600 to-accent-500 hover:opacity-90 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download {downloadFormat.toUpperCase()}
                </button>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Enhanced audio ready for download
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalysisRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-medium ${valueColor || "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

function SpectrumBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex-1">
      <div className="h-20 bg-surface-700 rounded-lg relative overflow-hidden flex items-end">
        <div
          className={`w-full ${color} rounded-t-lg transition-all`}
          style={{ height: `${value * 100}%`, opacity: 0.7 }}
        />
      </div>
      <p className="text-xs text-gray-400 text-center mt-1">{label}</p>
      <p className="text-xs text-white text-center font-medium">
        {(value * 100).toFixed(0)}%
      </p>
    </div>
  );
}
