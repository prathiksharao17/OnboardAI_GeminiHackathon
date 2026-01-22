"use client";

import { FormEvent, useState, useRef } from "react";
import Link from "next/link";

type Scene = {
  id: string;
  title: string;
  narration: string;
  onScreenText?: string[];
  visual?: {
    type: string;
    description: string;
    highlights?: string[];
  };
};

type ScriptResponse = {
  projectName: string;
  oneLiner: string;
  techStack?: string[];
  scenes: Scene[];
  setup?: {
    steps?: string[];
    runCommands?: string[];
  };
};

type VideoResponse = {
  ok: boolean;
  video?: {
    base64: string;
    mimeType: string;
    size: number;
    sizeMB: string;
  };
  metadata?: {
    projectName: string;
    sceneCount: number;
    totalScenes: number;
    estimatedDurationSeconds: number;
  };
  error?: string;
};

export default function GeneratePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<ScriptResponse | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoData, setVideoData] = useState<VideoResponse["video"] | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setScript(null);
    try {
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      const data = await res.json();
      if (!data.ok) {
        const errorMsg = data.error || "Something went wrong";
        setError(errorMsg + (data.retryable ? " You can try again." : ""));
        return;
      }
      setScript(data.script);
      setVideoData(null);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateVideo() {
    if (!script) return;
    setGeneratingVideo(true);
    setError(null);
    try {
      const res = await fetch("/api/video/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ script }),
      });
      const data: VideoResponse = await res.json();
      if (!data.ok) {
        setError(data.error || "Failed to generate video");
        return;
      }
      setVideoData(data.video || null);
    } catch (err: any) {
      setError(err.message || "Failed to generate video");
    } finally {
      setGeneratingVideo(false);
    }
  }

  function downloadVideo() {
    if (!videoData || !script) return;
    const binaryString = atob(videoData.base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: videoData.mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.projectName.replace(/\s+/g, "_")}_onboarding.mp4`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 font-sans selection:bg-emerald-500/30">
      {/* Enhanced Green Tint Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Main Ambient Glow */}
        <div className="absolute -top-[10%] -left-[10%] h-[60%] w-[60%] rounded-full bg-emerald-500/15 blur-[120px] opacity-70" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[50%] rounded-full bg-emerald-600/10 blur-[100px] opacity-50" />
        
        {/* Noise Layer */}
        <div className="absolute top-0 h-full w-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-25 brightness-110 contrast-125" />
        
        {/* The Grid with Emerald Tint */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b9811a_1px,transparent_1px),linear-gradient(to_bottom,#10b9811a_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/0 via-zinc-950/40 to-zinc-950" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-zinc-950" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-50">OnboardAI</span>
          </Link>
          <Link href="/" className="rounded-full bg-zinc-50 px-5 py-2 text-sm font-bold text-zinc-950 transition hover:scale-105 shadow-lg shadow-white/5">
            ← Back to Home
          </Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-emerald-400 uppercase">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Gemini 3 Deep-Code Analysis
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl leading-[1.1]">
            Generate Your <span className="bg-gradient-to-b from-emerald-300 to-emerald-600 bg-clip-text text-transparent">Onboarding Script</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            Stop manually digging through files. Analyze the tech stack, processing pipelines, and logical flow of any repository instantly.
          </p>
        </div>

        <div className="mx-auto mb-20 max-w-3xl rounded-[2.5rem] border border-zinc-800 bg-zinc-900/40 p-10 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 block">
                GitHub Repository URL
              </label>
              <input
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-5 text-zinc-50 placeholder-zinc-700 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 shadow-inner"
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !repoUrl.trim()}
              className="flex w-full h-16 items-center justify-center gap-3 rounded-2xl bg-emerald-500 text-lg font-extrabold text-zinc-950 transition hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] disabled:bg-zinc-800 disabled:text-zinc-600"
            >
              {loading ? (
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
              ) : (
                "✨ Analyze Codebase"
              )}
            </button>
          </form>

          {error && (
            <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-center text-sm text-red-400 animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}
        </div>

        {script && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Project Summary Card */}
            <div className="rounded-[3rem] border border-emerald-500/20 bg-zinc-900/60 p-10 md:p-12 backdrop-blur-md shadow-2xl">
              <div className="flex flex-col gap-10 md:flex-row md:items-start justify-between">
                <div className="flex-1 space-y-6">
                  <div className="inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/20">
                    Analysis Complete
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">{script.projectName}</h2>
                  <p className="text-xl text-zinc-400 leading-relaxed font-medium">{script.oneLiner}</p>
                  
                  {script.techStack && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {script.techStack.map((tech, i) => (
                        <span key={i} className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-5 py-2 text-xs font-bold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGenerateVideo}
                  disabled={generatingVideo}
                  className="group relative flex h-20 items-center gap-4 rounded-3xl bg-zinc-50 px-10 text-xl font-black text-zinc-950 transition hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xl"
                >
                  {generatingVideo ? (
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                  ) : (
                    <>🎬 Generate Video</>
                  )}
                </button>
              </div>

              {script.setup?.runCommands && (
                <div className="mt-12 rounded-[2rem] bg-zinc-950 p-8 border border-zinc-800/50">
                  <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">Entrypoint / Pipeline Setup</p>
                  <pre className="overflow-x-auto font-mono text-sm text-emerald-400/90 leading-relaxed">
                    {script.setup.runCommands.join("\n")}
                  </pre>
                </div>
              )}
            </div>

            {/* Video Player Section */}
            {videoData && (
              <div className="rounded-[3rem] border border-purple-500/30 bg-purple-500/5 p-10 backdrop-blur-xl animate-in zoom-in-95 duration-700">
                <div className="mb-8 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Onboarding Overview Video</h3>
                  <button onClick={downloadVideo} className="text-sm font-bold text-purple-400 hover:text-purple-300 flex items-center gap-2 transition-colors">
                    <span className="text-lg">⬇️</span> Download MP4
                  </button>
                </div>
                <div className="aspect-video overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl">
                  <video ref={videoRef} controls className="h-full w-full" src={`data:${videoData.mimeType};base64,${videoData.base64}`} />
                </div>
              </div>
            )}

            <div className="grid gap-10 lg:grid-cols-2">
              <div className="space-y-8">
                <h3 className="text-2xl font-bold text-white flex items-center gap-4">
                  <span className="h-1.5 w-10 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                  Narrated Script
                </h3>
                <div className="space-y-6">
                  {script.scenes.map((scene, idx) => (
                    <div key={idx} className="group rounded-[2rem] border border-zinc-800 bg-zinc-900/20 p-8 hover:border-emerald-500/30 transition-all duration-500">
                      <div className="mb-4 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Scene {idx + 1} • {scene.title}</div>
                      <p className="text-zinc-100 text-lg leading-relaxed font-semibold">"{scene.narration}"</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-2xl font-bold text-white flex items-center gap-4">
                  <span className="h-1.5 w-10 bg-purple-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.5)]" />
                  Visual Plan
                </h3>
                <div className="space-y-6">
                  {script.scenes.map((scene, idx) => (
                    <div key={idx} className="group rounded-[2rem] border border-zinc-800 bg-zinc-900/20 p-8 hover:border-purple-500/30 transition-all duration-500">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-[10px] font-bold text-purple-400 uppercase tracking-widest">{scene.visual?.type}</span>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Visual Logic</span>
                      </div>
                      <p className="text-zinc-400 leading-relaxed mb-6 font-medium">{scene.visual?.description}</p>
                      {scene.visual?.highlights && (
                        <ul className="space-y-2 border-t border-zinc-800/50 pt-4">
                          {scene.visual.highlights.map((h, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                              <span className="h-1 w-1 rounded-full bg-purple-500" />
                              {h}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-900 py-16 text-center">
         <p className="text-xs font-bold tracking-[0.5em] text-zinc-700 uppercase">OnboardAI • Repository Intelligence Layer</p>
      </footer>
    </div>
  );
}