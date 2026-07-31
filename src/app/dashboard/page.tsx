"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import { useAuth } from "@/lib/useAuth";

interface Project {
  id: string;
  title: string;
  originalFilename: string;
  status: string;
  outputFormat: string;
  durationSeconds: number | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading, authHeaders } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects", {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchProjects();
    }
  }, [user, authLoading, router, fetchProjects]);

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.name?.split(" ")[0]}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {projects.length} project{projects.length !== 1 ? "s" : ""} in
              your library
            </p>
          </div>
          <Link
            href="/upload"
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Project
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Total Projects
            </p>
            <p className="text-3xl font-bold">{projects.length}</p>
          </div>
          <div className="glass rounded-xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Completed
            </p>
            <p className="text-3xl font-bold text-emerald-400">
              {projects.filter((p) => p.status === "completed").length}
            </p>
          </div>
          <div className="glass rounded-xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              In Progress
            </p>
            <p className="text-3xl font-bold text-amber-400">
              {
                projects.filter(
                  (p) =>
                    p.status === "processing" ||
                    p.status === "analyzing" ||
                    p.status === "uploading"
                ).length
              }
            </p>
          </div>
        </div>

        {/* Projects list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-surface-600 rounded w-1/3 mb-3" />
                <div className="h-4 bg-surface-600 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-surface-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500">
                <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-gray-400 text-sm mb-6">
              Upload your first audio file to get started
            </p>
            <Link
              href="/upload"
              className="inline-block px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition"
            >
              Upload Audio
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="glass rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-brand-500/30 transition group block"
              >
                <div className="w-12 h-12 bg-surface-700 rounded-lg flex-shrink-0 overflow-hidden p-1">
                  <WaveformVisualizer
                    barCount={12}
                    color={project.status === "completed" ? "brand" : "gray"}
                    height={40}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate group-hover:text-brand-300 transition">
                    {project.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
                    <span>{project.originalFilename}</span>
                    <span>•</span>
                    <span>{formatDuration(project.durationSeconds)}</span>
                    <span>•</span>
                    <span>{project.outputFormat.toUpperCase()}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <StatusBadge status={project.status} />
                  <span className="text-xs text-gray-500">
                    {formatDate(project.createdAt)}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-600 group-hover:text-brand-400 transition"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
