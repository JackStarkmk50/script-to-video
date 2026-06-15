"use client";

import { useState, useRef, useEffect } from "react";

type Status = "idle" | "generating" | "done" | "error";

interface HistoryItem {
  taskId: string;
  prompt: string;
  videoUrl: string;
  filename: string;
  timestamp: number;
}

export default function Home() {
  const [comfyUrl, setComfyUrl] = useState("http://127.0.0.1:8188");
  const [frames, setFrames] = useState(108);
  const [aspectRatio, setAspectRatio] = useState<"landscape" | "portrait">("landscape");
  const [script, setScript] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [tab, setTab] = useState<"generator" | "recents">("generator");
  
  // History states
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleGenerate = async () => {
    if (!comfyUrl.trim()) {
      setError("Please enter your Server URL.");
      setStatus("error");
      return;
    }
    if (!script.trim()) {
      setError("Please write a script first.");
      setStatus("error");
      return;
    }

    setStatus("generating");
    setVideoUrl(null);
    setError(null);
    setProgress("Submitting prompt to Server...");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: script.trim(),
          comfyUrl: comfyUrl.trim(),
          frames,
          aspectRatio,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setStatus("done");
      } else if (data.taskId) {
        setProgress("Queued! Waiting for Server to start rendering...");
        await pollForResult(data.taskId);
      } else {
        throw new Error("Unexpected response from API.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setStatus("error");
    }
  };

  const pollForResult = async (taskId: string) => {
    const maxAttempts = 180; // 15 minutes at 5s intervals
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            poll: true,
            comfyUrl: comfyUrl.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Polling request failed");
        }

        if (data.status === "completed" && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setStatus("done");
          return;
        } else if (data.status === "failed") {
          throw new Error(data.error || "Video generation failed.");
        } else if (data.status === "running") {
          setProgress(`Rendering video... (${Math.min(Math.round(((i + 1) / maxAttempts) * 100), 99)}%)`);
        } else if (data.status === "queued") {
          setProgress("Waiting in Server queue...");
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Polling failed.";
        setError(message);
        setStatus("error");
        return;
      }
    }

    setError("Generation timed out. Please check Server.");
    setStatus("error");
  };

  const handleReset = () => {
    setStatus("idle");
    setVideoUrl(null);
    setError(null);
    setProgress("");
  };

  const fetchHistory = async () => {
    if (!comfyUrl.trim()) return;
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await fetch(`/api/history?comfyUrl=${encodeURIComponent(comfyUrl.trim())}`);
      if (!res.ok) {
        throw new Error("Failed to retrieve server history.");
      }
      const data = await res.json();
      setHistoryItems(data.items || []);
    } catch (err: any) {
      setHistoryError(err.message || "Failed to load recent history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (tab === "recents") {
      fetchHistory();
    }
  }, [tab]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "recents") {
        setTab("recents");
      }
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <h1 className="text-sm font-semibold tracking-tight">TTV</h1>
          <span className="text-xs text-muted ml-1">Script to Video</span>
        </div>
        <nav className="flex items-center gap-1 bg-background/50 p-0.5 rounded-lg border border-border">
          <button
            onClick={() => setTab("generator")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === "generator" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            Generator
          </button>
          <button
            onClick={() => setTab("recents")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === "recents" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            Recents
          </button>
          <a href="/info" className="px-3 py-1.5 text-xs font-medium text-muted rounded-md hover:text-foreground transition-all">
            Info
          </a>
        </nav>
      </header>

      {tab === "generator" ? (
        /* Generator Tab */
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Left Panel — Input */}
          <div className="w-full lg:w-[480px] flex flex-col border-r border-border bg-surface">
            {/* Server URL & Settings */}
            <div className="px-5 py-4 border-b border-border space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">
                  Server URL
                </label>
                <input
                  type="text"
                  value={comfyUrl}
                  onChange={(e) => setComfyUrl(e.target.value)}
                  placeholder="e.g. https://xxxx.ngrok-free.app"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:border-foreground focus:ring-1 focus:ring-foreground/10 placeholder:text-muted/50"
                />
                <p className="text-xs text-muted mt-1.5">
                  Enter your Server address or ngrok tunnel URL.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">
                  Frames
                </label>
                <input
                  type="number"
                  value={frames}
                  onChange={(e) => setFrames(Math.max(1, parseInt(e.target.value) || 108))}
                  min={1}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:border-foreground focus:ring-1 focus:ring-foreground/10"
                />
                <p className="text-xs text-muted mt-1.5">
                  Number of frames to generate. At 24 fps: 108 ≈ 4.5s, 240 ≈ 10s
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={aspectRatio === "portrait"}
                    onChange={(e) => setAspectRatio(e.target.checked ? "portrait" : "landscape")}
                    className="h-4 w-4 rounded border-border text-foreground focus:ring-foreground/20 bg-background accent-accent"
                  />
                  <span className="text-xs font-medium text-muted uppercase tracking-wider">
                    Generate Portrait (9:16)
                  </span>
                </label>
                <p className="text-xs text-muted mt-1.5">
                  Checked: 720x1280 (Portrait). Unchecked: 1280x720 (Landscape).
                </p>
              </div>
            </div>

            {/* Script Input */}
            <div className="flex-1 flex flex-col px-5 py-4 min-h-0">
              <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">
                Script / Prompt
              </label>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder={"Describe the scene in detail...\n\nExample: A cinematic close-up of a futuristic street performer playing a glowing neon violin at night in a rainy cyberpunk city.\n\n[SOUND]\nsoft violin music, cinematic ambient city rain"}
                className="flex-1 w-full px-3 py-3 text-sm font-mono leading-relaxed bg-background border border-border rounded-md resize-none focus:border-foreground focus:ring-1 focus:ring-foreground/10 placeholder:text-muted/40 min-h-[200px]"
              />
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t border-border flex items-center gap-3">
              <button
                onClick={handleGenerate}
                disabled={status === "generating"}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-accent text-accent-foreground rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {status === "generating" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Rendering...
                  </span>
                ) : (
                  "Generate Video"
                )}
              </button>
              {(status === "done" || status === "error") && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 text-sm font-medium border border-border rounded-md hover:bg-background cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Character count */}
            <div className="px-5 pb-3">
              <span className="text-xs text-muted font-mono">
                {script.length} characters
              </span>
            </div>
          </div>

          {/* Right Panel — Output */}
          <div className="flex-1 flex items-center justify-center bg-background p-6 min-h-[300px]">
            {status === "idle" && (
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <p className="text-sm text-muted">
                  Write your prompt and click Generate Video.
                </p>
              </div>
            )}

            {status === "generating" && (
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-foreground/20 flex items-center justify-center">
                  <svg className="animate-spin h-6 w-6 text-foreground" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-sm font-medium mb-1">{progress}</p>
                <p className="text-xs text-muted">
                  Your GPU is processing the LTX-2 workflow.
                </p>
              </div>
            )}

            {status === "done" && videoUrl && (
              <div className={`w-full flex flex-col items-center justify-center ${aspectRatio === "portrait" ? "max-w-[360px]" : "max-w-4xl"}`}>
                <div className="relative w-full rounded-lg border border-border shadow-lg overflow-hidden bg-black aspect-video flex items-center justify-center" style={{ aspectRatio: aspectRatio === "portrait" ? "9/16" : "16/9" }}>
                  <video
                    ref={videoRef}
                    src={`/api/video?url=${encodeURIComponent(videoUrl)}`}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="w-full flex items-center justify-between mt-3 px-1">
                  <p className="text-xs text-muted">Rendered ({aspectRatio === "portrait" ? "720x1280" : "1280x720"})</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => videoRef.current?.requestFullscreen()}
                      className="text-xs font-medium text-foreground hover:underline flex items-center gap-1"
                    >
                      Full Screen ⛶
                    </button>
                    <a
                      href={`/api/download?url=${encodeURIComponent(videoUrl)}`}
                      download
                      className="text-xs font-medium text-foreground hover:underline"
                    >
                      Download ↓
                    </a>
                  </div>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-red-200 bg-red-50 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-red-600 mb-1">Generation Failed</p>
                <p className="text-xs text-muted">{error}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Recents Tab */
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Recent Generations</h2>
                <p className="text-xs text-muted">All past videos generated from your ComfyUI Server history.</p>
              </div>
              <button
                onClick={fetchHistory}
                disabled={loadingHistory}
                className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {loadingHistory ? "Refreshing..." : "Refresh History"}
              </button>
            </div>

            {loadingHistory && (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <svg className="animate-spin h-6 w-6 text-foreground" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-muted">Retrieving history from server...</p>
              </div>
            )}

            {!loadingHistory && historyError && (
              <div className="text-center py-20 border border-border border-dashed rounded-lg bg-surface">
                <p className="text-sm text-red-500 font-medium mb-1">Failed to fetch history</p>
                <p className="text-xs text-muted mb-4">{historyError}</p>
                <button
                  onClick={fetchHistory}
                  className="px-4 py-2 text-xs font-medium bg-foreground text-background rounded-md hover:opacity-90"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loadingHistory && !historyError && historyItems.length === 0 && (
              <div className="text-center py-20 border border-border border-dashed rounded-lg bg-surface">
                <p className="text-sm text-muted mb-1">No videos found</p>
                <p className="text-xs text-muted">Generate a video first, or make sure your server is running and accessible.</p>
              </div>
            )}

            {!loadingHistory && !historyError && historyItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historyItems.map((item) => (
                  <div key={item.taskId} className="bg-surface rounded-lg border border-border shadow-sm flex flex-col overflow-hidden group">
                    <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                      <video
                        src={`/api/video?url=${encodeURIComponent(item.videoUrl)}`}
                        controls
                        preload="metadata"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <p className="text-xs font-mono text-muted">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                        <p className="text-sm text-foreground line-clamp-3 font-medium leading-relaxed font-sans" title={item.prompt}>
                          {item.prompt || "No prompt text found"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <span className="text-[10px] font-mono text-muted truncate max-w-[150px]">
                          {item.filename}
                        </span>
                        <a
                          href={`/api/download?url=${encodeURIComponent(item.videoUrl)}`}
                          download
                          className="px-2.5 py-1 text-xs font-medium bg-accent text-accent-foreground rounded hover:opacity-90 transition-opacity"
                        >
                          Download ↓
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
