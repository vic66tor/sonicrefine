"use client";

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", label: "Pending" },
  uploading: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Uploading" },
  analyzing: { color: "bg-purple-500/20 text-purple-400 border-purple-500/30", label: "Analyzing" },
  processing: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "Processing" },
  completed: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Completed" },
  failed: { color: "bg-red-500/20 text-red-400 border-red-500/30", label: "Failed" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.color}`}
    >
      {(status === "analyzing" || status === "processing" || status === "uploading") && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
