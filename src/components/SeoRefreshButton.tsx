"use client";

import { useState } from "react";

export default function SeoRefreshButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/refresh-seo", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Refresh failed");
      setMessage(
        `Updated ${json.updated} of ${json.total} URLs from Search Console` +
          (json.notFound ? ` (${json.notFound} not matched)` : "")
      );
      setStatus("idle");
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div className="mb-4 flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
      >
        {status === "loading" ? "Refreshing…" : "↻ Refresh from Search Console"}
      </button>
      {message && (
        <span className={`text-sm ${status === "error" ? "text-red-600" : "text-neutral-500"}`}>
          {message}
        </span>
      )}
    </div>
  );
}
