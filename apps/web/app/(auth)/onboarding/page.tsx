"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

const STEPS = ["welcome", "accounts", "preferences", "ready"] as const;
type Step = (typeof STEPS)[number];

const providers = [
  { id: "gmail", name: "Gmail", color: "#ea4335", icon: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" },
  { id: "outlook", name: "Outlook", color: "#0078d4", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" },
  { id: "yahoo", name: "Yahoo", color: "#7b0099", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.36 14.83c-.13.22-.35.35-.59.35h-1.54c-.24 0-.46-.13-.59-.35L12 14.16l-1.64 2.67c-.13.22-.35.35-.59.35H8.23c-.24 0-.46-.13-.59-.35a.682.682 0 010-.7l2.72-4.43L7.91 7.87a.682.682 0 010-.7c.13-.22.35-.35.59-.35h1.54c.24 0 .46.13.59.35L12 9.84l1.37-2.67c.13-.22.35-.35.59-.35h1.54c.24 0 .46.13.59.35.13.22.13.49 0 .7l-2.45 3.83 2.72 4.43c.13.22.13.49 0 .7z" },
  { id: "icloud", name: "iCloud", color: "#3693f5", icon: "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" },
  { id: "imap", name: "Other (IMAP)", color: "#64748b", icon: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" },
];

const densityOptions = [
  { id: "compact", label: "Compact", desc: "More emails visible", lines: 5 },
  { id: "comfortable", label: "Comfortable", desc: "Balanced view", lines: 4 },
  { id: "spacious", label: "Spacious", desc: "Easy on the eyes", lines: 3 },
];

const featureHighlights = [
  { icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", title: "AI sorts your inbox overnight", color: "text-violet-400" },
  { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "Sub-50ms load from cache", color: "text-cyan-400" },
  { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", title: "E2E encrypted. Zero-knowledge.", color: "text-emerald-400" },
  { icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z", title: "Voice dictation built in", color: "text-amber-400" },
];

function StepIndicator({ current, total }: { current: number; total: number }): React.ReactNode {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current ? "w-8 bg-violet-500" : i < current ? "w-3 bg-violet-500/40" : "w-3 bg-white/10"
          }`}
          layout
        />
      ))}
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }): React.ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-8 shadow-lg shadow-violet-500/20"
      >
        <span className="font-[var(--font-italianno)] text-4xl text-white">A</span>
      </motion.div>

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
        Welcome to{" "}
        <span className="font-[var(--font-italianno)] text-4xl md:text-5xl bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
          AlecRae
        </span>
      </h1>
      <p className="text-white/40 text-lg mb-10 max-w-md">
        Let&apos;s set up your inbox in under 30 seconds. For real.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-10 max-w-sm w-full">
        {featureHighlights.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
          >
            <svg className={`w-5 h-5 ${f.color} flex-shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
            </svg>
            <span className="text-xs text-white/50 leading-relaxed">{f.title}</span>
          </motion.div>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="group w-full max-w-sm px-8 py-4 bg-white text-[#0a0a0f] font-semibold rounded-full hover:shadow-xl hover:shadow-violet-500/20 transition-all text-center relative overflow-hidden"
      >
        <span className="relative z-10">Let&apos;s Go</span>
        <div className="absolute inset-0 bg-gradient-to-r from-violet-200 to-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      <p className="text-white/20 text-xs mt-6">Takes about 30 seconds</p>
    </motion.div>
  );
}

function AccountsStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }): React.ReactNode {
  const [connected, setConnected] = useState<string[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = (id: string): void => {
    if (connected.includes(id)) return;
    setConnecting(id);
    setTimeout(() => {
      setConnected((prev: string[]) => [...prev, id]);
      setConnecting(null);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-lg mx-auto"
    >
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2 text-center">
        Connect your accounts
      </h2>
      <p className="text-white/40 text-center mb-8">
        One click per account. We handle the rest.
      </p>

      <div className="space-y-3 mb-8">
        {providers.map((p, i) => {
          const isConnected = connected.includes(p.id);
          const isConnecting = connecting === p.id;

          return (
            <motion.button
              key={p.id}
              type="button"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => handleConnect(p.id)}
              disabled={isConnected || isConnecting}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                isConnected
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15]"
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: p.color + "20" }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill={p.color}>
                  <path d={p.icon} />
                </svg>
              </div>
              <span className="flex-1 text-left font-medium text-white/80">{p.name}</span>
              {isConnecting && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/20 border-t-violet-400 rounded-full"
                />
              )}
              {isConnected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </motion.div>
              )}
              {!isConnected && !isConnecting && (
                <span className="text-xs text-white/30 font-medium">Connect</span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 text-white/50 hover:text-white font-medium rounded-full hover:bg-white/[0.04] transition-all"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 px-8 py-3 bg-white text-[#0a0a0f] font-semibold rounded-full hover:shadow-lg hover:shadow-violet-500/20 transition-all"
        >
          {connected.length > 0 ? `Continue with ${connected.length} account${connected.length > 1 ? "s" : ""}` : "Skip for now"}
        </button>
      </div>
    </motion.div>
  );
}

function PreferencesStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }): React.ReactNode {
  const [density, setDensity] = useState("comfortable");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [shortcuts, setShortcuts] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-lg mx-auto"
    >
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2 text-center">
        Make it yours
      </h2>
      <p className="text-white/40 text-center mb-8">
        You can change all of this later in Settings.
      </p>

      <div className="space-y-6 mb-8">
        <div>
          <label className="text-sm font-medium text-white/60 mb-3 block">Inbox Density</label>
          <div className="grid grid-cols-3 gap-3">
            {densityOptions.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDensity(d.id)}
                className={`p-4 rounded-xl border text-center transition-all ${
                  density === d.id
                    ? "bg-violet-500/10 border-violet-500/30 ring-1 ring-violet-500/20"
                    : "bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15]"
                }`}
              >
                <div className="space-y-1 mb-3 mx-auto max-w-[60px]">
                  {Array.from({ length: d.lines }).map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full ${density === d.id ? "bg-violet-400/40" : "bg-white/10"}`} />
                  ))}
                </div>
                <span className="text-xs font-medium text-white/70">{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <ToggleOption
            label="AI Inbox Agent"
            desc="Let AI triage, draft replies, and sort your inbox"
            enabled={aiEnabled}
            onToggle={() => setAiEnabled(!aiEnabled)}
            color="violet"
          />
          <ToggleOption
            label="Keyboard Shortcuts"
            desc="j/k to navigate, e to archive, # to delete, and more"
            enabled={shortcuts}
            onToggle={() => setShortcuts(!shortcuts)}
            color="cyan"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 text-white/50 hover:text-white font-medium rounded-full hover:bg-white/[0.04] transition-all"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 px-8 py-3 bg-white text-[#0a0a0f] font-semibold rounded-full hover:shadow-lg hover:shadow-violet-500/20 transition-all"
        >
          Finish Setup
        </button>
      </div>
    </motion.div>
  );
}

function ToggleOption({ label, desc, enabled, onToggle, color }: {
  label: string;
  desc: string;
  enabled: boolean;
  onToggle: () => void;
  color: string;
}): React.ReactNode {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
        enabled
          ? `bg-${color}-500/10 border-${color}-500/20`
          : "bg-white/[0.03] border-white/[0.08]"
      }`}
    >
      <div className="flex-1">
        <div className="text-sm font-medium text-white/80">{label}</div>
        <div className="text-xs text-white/35 mt-0.5">{desc}</div>
      </div>
      <div className={`w-10 h-6 rounded-full transition-all relative ${
        enabled ? `bg-${color}-500` : "bg-white/10"
      }`}>
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ left: enabled ? 20 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}

function ReadyStep(): React.ReactNode {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 20 }}
      className="flex flex-col items-center text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/20"
      >
        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3"
      >
        You&apos;re all set!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-white/40 text-lg mb-4 max-w-md"
      >
        Your inbox is ready. AI is already learning your style.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col items-center gap-3 mb-10 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
      >
        <div className="flex items-center gap-2 text-sm text-white/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          AI agent is analyzing your inbox...
        </div>
        <div className="flex items-center gap-2 text-sm text-white/50">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          Learning your writing style...
        </div>
        <div className="flex items-center gap-2 text-sm text-white/50">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Caching emails for offline access...
        </div>
      </motion.div>

      <motion.button
        type="button"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        onClick={() => router.push("/inbox")}
        className="group w-full max-w-sm px-8 py-4 bg-white text-[#0a0a0f] font-semibold rounded-full hover:shadow-xl hover:shadow-violet-500/20 transition-all text-center relative overflow-hidden"
      >
        <span className="relative z-10">Open My Inbox</span>
        <div className="absolute inset-0 bg-gradient-to-r from-violet-200 to-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Link href="/settings" className="text-white/25 text-xs mt-6 inline-block hover:text-white/40 transition-colors">
          or customize settings first
        </Link>
      </motion.div>
    </motion.div>
  );
}

function ConfettiParticle({ delay }: { delay: number }): React.ReactNode {
  const colors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const left = Math.random() * 100;
  const size = 4 + Math.random() * 6;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: `${left}%`, width: size, height: size, backgroundColor: color }}
      initial={{ top: -10, opacity: 1, rotate: 0 }}
      animate={{ top: "110%", opacity: 0, rotate: 360 + Math.random() * 360 }}
      transition={{ duration: 2 + Math.random() * 2, delay, ease: "easeIn" }}
    />
  );
}

export default function OnboardingPage(): React.ReactNode {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const showConfetti = step === "ready";

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-[200px] -left-[200px] w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)" }} />
      </div>

      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <ConfettiParticle key={i} delay={i * 0.05} />
          ))}
        </div>
      )}

      <div className="relative z-10 w-full max-w-xl">
        <div className="flex justify-center mb-10">
          <StepIndicator current={stepIndex} total={STEPS.length} />
        </div>

        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <WelcomeStep key="welcome" onNext={() => setStepIndex(1)} />
          )}
          {step === "accounts" && (
            <AccountsStep
              key="accounts"
              onNext={() => setStepIndex(2)}
              onBack={() => setStepIndex(0)}
            />
          )}
          {step === "preferences" && (
            <PreferencesStep
              key="preferences"
              onNext={() => setStepIndex(3)}
              onBack={() => setStepIndex(1)}
            />
          )}
          {step === "ready" && <ReadyStep key="ready" />}
        </AnimatePresence>
      </div>

      {step !== "ready" && (
        <div className="absolute bottom-6 text-center">
          <Link href="/inbox" className="text-white/20 text-xs hover:text-white/40 transition-colors">
            Skip setup — take me to my inbox
          </Link>
        </div>
      )}
    </div>
  );
}
