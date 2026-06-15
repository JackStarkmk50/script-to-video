"use client";

import { useState, useRef } from "react";

type Status = "idle" | "generating" | "done" | "error";

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [platform, setPlatform] = useState<"replicate" | "magic-hour">("replicate");
  const [model, setModel] = useState("pixverse/pixverse-v6");
  const [script, setScript] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError("Please enter your API key.");
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
    setProgress("Sending script to API...");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          script: script.trim(),
          model: model.trim(),
          platform
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
        // Poll for result
        setProgress("Video is being generated...");
        await pollForResult(data.taskId, data.pollUrl);
      } else {
        throw new Error("Unexpected response from API.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setStatus("error");
    }
  };

  const pollForResult = async (taskId: string, pollUrl?: string) => {
    const maxAttempts = 120; // 10 minutes at 5s intervals
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      setProgress(`Generating video... (${Math.min(Math.round(((i + 1) / maxAttempts) * 100), 99)}%)`);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: apiKey.trim(),
            taskId,
            pollUrl,
            poll: true,
          }),
        });

        const data = await res.json();

        if (data.status === "completed" && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setStatus("done");
          return;
        } else if (data.status === "failed") {
          throw new Error(data.error || "Video generation failed.");
        }
        // Otherwise, keep polling
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Polling failed.";
        setError(message);
        setStatus("error");
        return;
      }
    }

    setError("Generation timed out. Please try again.");
    setStatus("error");
  };

  const handleReset = () => {
    setStatus("idle");
    setVideoUrl(null);
    setError(null);
    setProgress("");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <h1 className="text-sm font-semibold tracking-tight">TTV</h1>
          <span className="text-xs text-muted ml-1">Script to Video</span>
        </div>
        <nav className="flex items-center gap-1">
          <a href="/" className="px-3 py-1.5 text-xs font-medium text-foreground bg-foreground/5 rounded-md">
            Generator
          </a>
          <a href="/info" className="px-3 py-1.5 text-xs font-medium text-muted rounded-md hover:text-foreground hover:bg-foreground/5">
            Info
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Panel — Input */}
        <div className="w-full lg:w-[480px] flex flex-col border-r border-border bg-surface">
          {/* Platform & API Key & Model */}
          <div className="px-5 py-4 border-b border-border space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">
                Platform
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setPlatform("replicate"); setModel("pixverse/pixverse-v6"); }}
                  className={`flex-1 px-3 py-2 text-xs font-medium border rounded-md transition-all ${platform === "replicate" ? "bg-accent text-accent-foreground border-accent" : "bg-background text-muted border-border hover:border-foreground/30"}`}
                >
                  Replicate
                </button>
                <button
                  onClick={() => { setPlatform("magic-hour"); setModel("N/A"); }}
                  className={`flex-1 px-3 py-2 text-xs font-medium border rounded-md transition-all ${platform === "magic-hour" ? "bg-accent text-accent-foreground border-accent" : "bg-background text-muted border-border hover:border-foreground/30"}`}
                >
                  Magic Hour
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">
                API Token
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={platform === "replicate" ? "Enter Replicate token" : "Enter Magic Hour token"}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:border-foreground focus:ring-1 focus:ring-foreground/10 placeholder:text-muted/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground cursor-pointer"
                >
                  {showApiKey ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">
                Model Name
              </label>
              <input
                type="text"
                value={model}
                disabled={platform === "magic-hour"}
                onChange={(e) => setModel(e.target.value)}
                placeholder={platform === "replicate" ? "e.g. pixverse/pixverse-v6" : "Default"}
                className={`w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:border-foreground focus:ring-1 focus:ring-foreground/10 placeholder:text-muted/50 ${platform === "magic-hour" ? "opacity-30 cursor-not-allowed" : ""}`}
              />
            </div>
          </div>

          {/* Script Input */}
          <div className="flex-1 flex flex-col px-5 py-4 min-h-0">
            <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">
              Script
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Write your video script here...&#10;&#10;Describe the scene, narration, characters, mood, and any visual details you want in the generated video."
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
                  Generating...
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
                Write a script and click Generate to create your video.
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
                This may take a few minutes depending on the model.
              </p>
            </div>
          )}

          {status === "done" && videoUrl && (
            <div className="w-full max-w-2xl">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                autoPlay
                className="w-full rounded-lg border border-border shadow-sm"
              >
                Your browser does not support the video tag.
              </video>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-muted">Video generated successfully</p>
                <a
                  href={videoUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-foreground hover:underline"
                >
                  Download ↓
                </a>
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
    </div>
  );
}
