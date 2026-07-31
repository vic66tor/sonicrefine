import React, { useState, useEffect } from 'react';
import type { ElectronAPI } from '../main/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

interface Project {
  id: string;
  title: string;
  inputPath: string;
  outputPath: string | null;
  originalFilename: string;
  outputFormat: string;
  status: string;
  settings: any;
  analysisData: any;
  durationSeconds: number | null;
  createdAt: string;
  completedAt: string | null;
}

interface ProcessingSettings {
  normalize: boolean;
  denoise: boolean;
  eqCorrection: boolean;
  multibandCompression: boolean;
  stereoEnhancement: boolean;
  limiting: boolean;
  loudnessNormalization: boolean;
  targetLufs: number;
}

const defaultSettings: ProcessingSettings = {
  normalize: true,
  denoise: false,
  eqCorrection: true,
  multibandCompression: true,
  stereoEnhancement: false,
  limiting: true,
  loudnessNormalization: true,
  targetLufs: -14,
};

export default function App() {
  const [view, setView] = useState<'home' | 'project'>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [settings, setSettings] = useState<ProcessingSettings>(defaultSettings);
  const [outputFormat, setOutputFormat] = useState('mp3');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadProjects();
    
    window.electronAPI.onProjectStatusUpdate((data) => {
      setProjects(prev => prev.map(p => 
        p.id === data.id ? { ...p, status: data.status, outputPath: data.outputPath } : p
      ));
      if (selectedProject?.id === data.id) {
        setSelectedProject(prev => prev ? { ...prev, status: data.status, outputPath: data.outputPath } : null);
      }
      if (data.status === 'completed' || data.status === 'failed') {
        setProcessing(false);
      }
    });

    return () => {
      window.electronAPI.removeProjectStatusListener();
    };
  }, [selectedProject?.id]);

  const loadProjects = async () => {
    const list = await window.electronAPI.getAllProjects();
    setProjects(list);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && /\.(mp3|wav|flac|m4a)$/i.test(file.name)) {
      await createProject((file as any).path, file.name);
    }
  };

  const handleFileSelect = async () => {
    const filePath = await window.electronAPI.openFileDialog();
    if (filePath) {
      const fileName = filePath.split(/[\\/]/).pop() || 'audio';
      await createProject(filePath, fileName);
    }
  };

  const createProject = async (filePath: string, fileName: string) => {
    const result = await window.electronAPI.createProject({
      title: fileName.replace(/\.[^.]+$/, ''),
      inputPath: filePath,
      outputFormat,
      settings,
    });

    if (result.success && result.project) {
      setProjects(prev => [result.project, ...prev]);
      setSelectedProject(result.project);
      setView('project');
    }
  };

  const handleProcess = async () => {
    if (!selectedProject) return;
    setProcessing(true);
    await window.electronAPI.processAudio(selectedProject.id, settings);
  };

  const handleShowInFolder = () => {
    if (selectedProject?.outputPath) {
      window.electronAPI.showInFolder(selectedProject.outputPath);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const toggleSetting = (key: keyof ProcessingSettings) => {
    if (key === 'targetLufs') return;
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Home View ─────────────────────────────────────────
  if (view === 'home') {
    return (
      <div className="h-screen flex flex-col bg-surface-900">
        {/* Header */}
        <header className="h-12 flex items-center px-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-500 to-orange-500" />
            <span className="text-sm font-bold gradient-text">SonicRefine</span>
          </div>
        </header>

        <div className="flex-1 flex">
          {/* Sidebar - Projects */}
          <aside className="w-64 border-r border-white/5 p-4">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-3">
              Recent Projects
            </h2>
            <div className="space-y-2">
              {projects.length === 0 ? (
                <p className="text-xs text-gray-500">No projects yet</p>
              ) : (
                projects.slice(0, 10).map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProject(p); setView('project'); }}
                    className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition"
                  >
                    <p className="text-sm truncate">{p.title}</p>
                    <p className="text-xs text-gray-500">
                      {p.status === 'completed' ? '✓ Done' : p.status}
                    </p>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Main - Drop Zone */}
          <main className="flex-1 flex items-center justify-center p-8">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={handleFileSelect}
              className={`w-full max-w-lg p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                isDragging 
                  ? 'border-brand-500 bg-brand-500/10' 
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-700 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Drop audio file here
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  Supports MP3, WAV, FLAC, M4A
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ─── Project View ─────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-surface-900">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView('home')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back
          </button>
          <span className="text-sm font-semibold">{selectedProject?.title}</span>
        </div>
        <StatusBadge status={selectedProject?.status || 'pending'} />
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Analysis */}
          {selectedProject?.analysisData && (
            <div className="glass rounded-xl p-5 mb-6">
              <h3 className="text-sm font-semibold mb-4">Audio Analysis</h3>
              <div className="grid grid-cols-4 gap-4">
                <Stat label="Duration" value={formatDuration(selectedProject.durationSeconds)} />
                <Stat label="Bitrate" value={`${selectedProject.analysisData.bitrate} kbps`} />
                <Stat label="Sample Rate" value={`${(selectedProject.analysisData.sampleRate / 1000).toFixed(1)} kHz`} />
                <Stat label="Channels" value={selectedProject.analysisData.channels === 2 ? 'Stereo' : 'Mono'} />
              </div>
            </div>
          )}

          {/* Waveform placeholder */}
          <div className="glass rounded-xl p-5 mb-6">
            <div className="h-24 flex items-end gap-[2px]">
              {Array.from({ length: 80 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t transition-all ${
                    selectedProject?.status === 'completed' ? 'bg-brand-500' : 'bg-gray-600'
                  }`}
                  style={{ 
                    height: `${20 + Math.random() * 80}%`,
                    opacity: processing ? 0.5 : 0.7,
                    animation: processing ? `wave-bar ${0.5 + Math.random() * 0.5}s ease-in-out ${i * 0.02}s infinite` : 'none',
                    transformOrigin: 'bottom'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Completed - Show result */}
          {selectedProject?.status === 'completed' && selectedProject.outputPath && (
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3 text-emerald-400">✓ Enhancement Complete</h3>
              <p className="text-sm text-gray-400 mb-4 break-all">
                Saved to: {selectedProject.outputPath}
              </p>
              <button
                onClick={handleShowInFolder}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg text-sm transition"
              >
                Show in Folder
              </button>
            </div>
          )}
        </main>

        {/* Sidebar - Settings */}
        <aside className="w-72 border-l border-white/5 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-4">Processing Settings</h3>
          
          <div className="space-y-3 mb-6">
            {Object.entries({
              normalize: 'Input Normalization',
              denoise: 'Noise Reduction',
              eqCorrection: 'EQ Correction',
              multibandCompression: 'Multiband Compression',
              stereoEnhancement: 'Stereo Enhancement',
              limiting: 'Limiting',
              loudnessNormalization: 'Loudness Normalization',
            }).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{label}</span>
                <button
                  onClick={() => toggleSetting(key as keyof ProcessingSettings)}
                  disabled={processing}
                  className={`w-10 h-5 rounded-full transition relative ${
                    settings[key as keyof ProcessingSettings] ? 'bg-brand-600' : 'bg-surface-600'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                    settings[key as keyof ProcessingSettings] ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold mb-3">Output Format</h3>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {['mp3', 'wav', 'flac', 'aac'].map(fmt => (
              <button
                key={fmt}
                onClick={() => setOutputFormat(fmt)}
                disabled={processing}
                className={`py-2 rounded-lg text-xs font-semibold uppercase transition ${
                  outputFormat === fmt
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-700 text-gray-400 hover:text-white'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {selectedProject?.status !== 'completed' && (
            <button
              onClick={handleProcess}
              disabled={processing || selectedProject?.status === 'processing'}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-orange-500 hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Enhance Audio
                </>
              )}
            </button>
          )}

          <p className="text-xs text-gray-500 mt-4">
            Perceptual enhancement — optimizes audio characteristics without claiming lossless reconstruction.
          </p>
        </aside>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-gray-500/20 text-gray-400', label: 'Pending' },
    analyzing: { color: 'bg-purple-500/20 text-purple-400', label: 'Analyzing' },
    processing: { color: 'bg-amber-500/20 text-amber-400', label: 'Processing' },
    completed: { color: 'bg-emerald-500/20 text-emerald-400', label: 'Completed' },
    failed: { color: 'bg-red-500/20 text-red-400', label: 'Failed' },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>
      {c.label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
