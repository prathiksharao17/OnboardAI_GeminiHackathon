"use client";

import Link from "next/link";

export default function Home() {
  const steps = [
    {
      step: "01",
      title: "Paste GitHub URL",
      description: "Provide any public GitHub repository URL. OnboardAI instantly fetches the codebase architecture and core files.",
    },
    {
      step: "02",
      title: "AI Context Analysis",
      description: "Gemini 3 bypasses the manual grind, mapping out the processing pipelines, technical stack, and overall logical flow.",
    },
    {
      step: "03",
      title: "Instant Onboarding",
      description: "Receive a narrated video summary that explains what the repo is, the important files, and where you can add or contribute.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-zinc-950 font-sans selection:bg-emerald-500/30">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute top-0 h-full w-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-zinc-950" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-50">OnboardAI</span>
          </Link>
          <Link href="/generate" className="rounded-full bg-zinc-50 px-5 py-2 text-sm font-bold text-zinc-950 transition hover:scale-105 shadow-lg shadow-white/5">
            Generate Video
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-20 md:pt-32 md:pb-40 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-emerald-400 uppercase">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Powered by Gemini 3
        </div>
        <h1 className="mb-8 max-w-5xl mx-auto text-5xl font-extrabold tracking-tight text-white md:text-7xl lg:text-8xl leading-[1.1]">
          Understand any GitHub repo{" "}
          <span className="bg-gradient-to-b from-emerald-300 to-emerald-600 bg-clip-text text-transparent">
            in minutes, not hours.
          </span>
        </h1>
        <p className="mb-12 max-w-2xl mx-auto text-lg leading-relaxed text-zinc-400 md:text-xl">
          Stop manually digging through files and READMEs. OnboardAI analyzes the tech stack, processing pipelines, and architecture to explain the logical flow and what can be contributed.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row justify-center">
          <Link href="/generate" className="group relative flex h-14 items-center rounded-full bg-emerald-500 px-10 text-lg font-bold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_40px_8px_rgba(16,185,129,0.2)]">
            Analyze Repository
          </Link>
          <a href="#how-it-works" className="flex h-14 items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-10 text-lg font-semibold text-zinc-50 transition hover:bg-zinc-800">
            See Workflow
          </a>
        </div>
      </section>

      {/* Bento-Style Features Grid */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="mb-20 text-center md:text-left">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">The ultimate dev shortcut.</h2>
          <p className="mt-4 text-zinc-400 text-lg">Everything you need to know to start pushing code today.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {[
            { title: "Logical Flow Mapping", icon: "📚", col: "md:col-span-3", desc: "We map entry points and logic flow to see how the project actually works and how data travels through the system." },
            { title: "Important File Discovery", icon: "🔍", col: "md:col-span-3", desc: "Automatically identifies core business logic, config files, and the files you actually need to care about." },
            { title: "Narrated Summaries", icon: "🎬", col: "md:col-span-2", desc: "A 2-3 minute video overview that feels like a 1-on-1 session with the lead engineer." },
            { title: "Opportunity Guide", icon: "💡", col: "md:col-span-2", desc: "Identify what can be added or improved, helping you find your first contribution point instantly." },
            { title: "Tech Stack Audit", icon: "🛠️", col: "md:col-span-2", desc: "Instantly see every library, framework, and dependency used across the repository." },
            { title: "Student & Team Ready", icon: "🔓", col: "md:col-span-6", desc: "Perfect for students or new team members to get a high-level view of complex enterprise code without the overwhelm." }
          ].map((feature, i) => (
            <div key={i} className={`${feature.col} group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 transition-all hover:border-emerald-500/30 hover:bg-zinc-900/60`}>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-2xl group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="mb-2 text-xl font-bold text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white md:text-5xl tracking-tighter">Streamlined Onboarding</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((item, idx) => (
            <div key={idx} className="group relative rounded-3xl border border-zinc-800 bg-zinc-900/20 p-8 transition-all hover:border-emerald-500/30">
              <div className="mb-6 text-5xl font-black text-zinc-900 transition-colors group-hover:text-emerald-500/20">
                {item.step}
              </div>
              <h3 className="mb-4 text-2xl font-bold text-white">{item.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-32">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-500/20 bg-zinc-900/50 px-8 py-20 text-center backdrop-blur-sm">
          <h2 className="relative z-10 mb-6 text-4xl font-bold text-white md:text-6xl tracking-tight">Stop reading, start building.</h2>
          <p className="relative z-10 mb-10 text-zinc-400 text-lg max-w-xl mx-auto">Get the full summary and logical flow of any repo in seconds.</p>
          <Link href="/generate" className="relative z-10 inline-flex h-16 items-center rounded-full bg-emerald-500 px-12 text-lg font-bold text-zinc-950 transition-all hover:scale-105 hover:bg-emerald-400">
            Start My Onboarding
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-900 py-12 text-center text-zinc-500">
        <p className="text-sm font-medium tracking-widest uppercase">Built for Gemini Hackathon • 2026</p>
      </footer>
    </div>
  );
}