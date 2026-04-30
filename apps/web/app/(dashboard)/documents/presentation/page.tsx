"use client";

import { useState } from "react";
import { Box, Text, Button } from "@alecrae/ui";
import { motion, AnimatePresence } from "motion/react";
import { fadeInUp, useAlecRaeReducedMotion, withReducedMotion, SPRING_BOUNCY } from "../../../../lib/animations";

interface Slide {
  id: number;
  title: string;
  layout: "title" | "content" | "metrics" | "chart" | "timeline" | "team";
  bgGradient: string;
}

const SLIDES: Slide[] = [
  { id: 1, title: "AlecRae — Investor Update Q3 2026", layout: "title", bgGradient: "from-violet-600 to-indigo-800" },
  { id: 2, title: "Agenda", layout: "content", bgGradient: "from-slate-800 to-slate-900" },
  { id: 3, title: "Key Metrics", layout: "metrics", bgGradient: "from-slate-800 to-slate-900" },
  { id: 4, title: "Revenue Growth", layout: "chart", bgGradient: "from-slate-800 to-slate-900" },
  { id: 5, title: "Product Roadmap", layout: "timeline", bgGradient: "from-slate-800 to-slate-900" },
  { id: 6, title: "Our Team", layout: "team", bgGradient: "from-slate-800 to-slate-900" },
];

function SlideContent({ slide }: { slide: Slide }): React.ReactNode {
  switch (slide.layout) {
    case "title":
      return (
        <Box className="flex flex-col items-center justify-center h-full text-center text-white px-12">
          <Text variant="heading-lg" className="text-3xl font-bold mb-4">{slide.title}</Text>
          <Text variant="body-md" className="opacity-70 text-lg">Confidential — Q3 2026</Text>
          <Box className="mt-8 px-6 py-2 rounded-full border border-white/30">
            <Text variant="caption" className="text-white/80">Craig Taylor, CEO</Text>
          </Box>
        </Box>
      );
    case "content":
      return (
        <Box className="flex flex-col h-full text-white p-8">
          <Text variant="heading-md" className="text-xl font-bold mb-6 text-violet-300">{slide.title}</Text>
          <Box className="space-y-4 flex-1">
            {["Company Overview & Traction", "Key Metrics & Revenue", "Product Roadmap", "Go-to-Market Strategy", "Team & Hiring Plan", "Financial Projections"].map((item, i) => (
              <Box key={i} className="flex items-center gap-3">
                <Box className="w-8 h-8 rounded-full bg-violet-500/30 flex items-center justify-center flex-shrink-0">
                  <Text variant="caption" className="text-violet-300 font-bold">{String(i + 1)}</Text>
                </Box>
                <Text variant="body-sm" className="text-white/90">{item}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      );
    case "metrics":
      return (
        <Box className="flex flex-col h-full text-white p-8">
          <Text variant="heading-md" className="text-xl font-bold mb-6 text-violet-300">{slide.title}</Text>
          <Box className="grid grid-cols-2 gap-4 flex-1">
            {[
              { label: "MRR", value: "$88.5K", change: "+198%" },
              { label: "Users", value: "12,400", change: "+340%" },
              { label: "Retention", value: "94%", change: "+8%" },
              { label: "NPS", value: "72", change: "+12" },
            ].map((metric) => (
              <Box key={metric.label} className="bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center border border-white/10">
                <Text variant="heading-md" className="text-2xl font-bold">{metric.value}</Text>
                <Text variant="caption" className="text-white/60 mt-1">{metric.label}</Text>
                <Text variant="caption" className="text-emerald-400 mt-1">{metric.change}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      );
    case "chart":
      return (
        <Box className="flex flex-col h-full text-white p-8">
          <Text variant="heading-md" className="text-xl font-bold mb-6 text-violet-300">{slide.title}</Text>
          <Box className="flex-1 flex items-end gap-3 pb-8 px-4">
            {[28, 35, 42, 50, 62, 74, 88, 105, 114].map((val, i) => (
              <Box key={i} className="flex-1 flex flex-col items-center gap-1">
                <Box className="w-full rounded-t bg-gradient-to-t from-violet-500 to-violet-400" style={{ height: `${String(val)}%` }} />
                <Text variant="caption" className="text-white/50 text-xs">Q{String(Math.floor(i / 3) + 1)}</Text>
              </Box>
            ))}
          </Box>
          <Box className="border-t border-white/10 pt-2 text-center">
            <Text variant="caption" className="text-white/50">Monthly Revenue ($K)</Text>
          </Box>
        </Box>
      );
    case "timeline":
      return (
        <Box className="flex flex-col h-full text-white p-8">
          <Text variant="heading-md" className="text-xl font-bold mb-6 text-violet-300">{slide.title}</Text>
          <Box className="flex-1 flex items-center">
            <Box className="w-full relative">
              <Box className="h-0.5 bg-violet-500/30 absolute top-4 left-0 right-0" />
              <Box className="flex justify-between">
                {["Q3 2026\nMobile Launch", "Q4 2026\nEnterprise", "Q1 2027\nMarco Reid", "Q2 2027\nScale"].map((item, i) => (
                  <Box key={i} className="flex flex-col items-center gap-2 relative z-10">
                    <Box className={`w-8 h-8 rounded-full flex items-center justify-center ${i === 0 ? "bg-violet-500" : "bg-violet-500/30"}`}>
                      <Text variant="caption" className="text-white font-bold text-xs">{String(i + 1)}</Text>
                    </Box>
                    <Text variant="caption" className="text-center text-white/80 whitespace-pre-line text-xs">{item}</Text>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      );
    case "team":
      return (
        <Box className="flex flex-col h-full text-white p-8">
          <Text variant="heading-md" className="text-xl font-bold mb-6 text-violet-300">{slide.title}</Text>
          <Box className="grid grid-cols-2 gap-4 flex-1">
            {[
              { name: "Craig Taylor", role: "CEO & Founder", color: "bg-violet-500" },
              { name: "Sarah Chen", role: "VP Engineering", color: "bg-cyan-500" },
              { name: "Alex Rivera", role: "Head of Product", color: "bg-emerald-500" },
              { name: "Jordan Lee", role: "Head of Growth", color: "bg-amber-500" },
            ].map((person) => (
              <Box key={person.name} className="bg-white/5 rounded-xl p-4 flex items-center gap-3 border border-white/10">
                <Box className={`w-12 h-12 rounded-full ${person.color} flex items-center justify-center`}>
                  <Text variant="body-sm" className="text-white font-bold">{person.name.split(" ").map((n) => n[0]).join("")}</Text>
                </Box>
                <Box>
                  <Text variant="body-sm" className="font-semibold">{person.name}</Text>
                  <Text variant="caption" className="text-white/60">{person.role}</Text>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      );
  }
}

export default function PresentationEditorPage(): React.ReactNode {
  const reduced = useAlecRaeReducedMotion();
  const [activeSlide, setActiveSlide] = useState(1);
  const [showSidebar, setShowSidebar] = useState(true);
  const [starred, setStarred] = useState(false);

  const currentSlide = SLIDES.find((s) => s.id === activeSlide) ?? SLIDES[0]!;

  return (
    <Box className="flex-1 flex flex-col overflow-hidden">
      <motion.div {...withReducedMotion(fadeInUp, reduced)} className="flex flex-col flex-1 min-h-0">
        <Box className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
          <Box className="flex items-center gap-3">
            <Box className="w-8 h-8 rounded bg-amber-500/20 flex items-center justify-center">
              <Text variant="caption" className="text-amber-400 font-bold">PPT</Text>
            </Box>
            <Text variant="body-sm" className="font-semibold">Investor Deck Q3</Text>
            <Button variant="ghost" size="sm" onClick={() => setStarred((p: boolean) => !p)}>
              {starred ? "★" : "☆"}
            </Button>
          </Box>
          <Box className="flex items-center gap-2">
            <Box className="flex items-center gap-1">
              <Box className="w-2 h-2 rounded-full bg-emerald-500" />
              <Text variant="caption" muted>Saved</Text>
            </Box>
            <Button variant="secondary" size="sm">Share</Button>
            <Button variant="primary" size="sm">Present</Button>
          </Box>
        </Box>

        <Box className="flex flex-1 min-h-0">
          <Box className="w-48 border-r border-border bg-surface-secondary/30 overflow-y-auto p-2 space-y-2 flex-shrink-0">
            {SLIDES.map((slide) => (
              <Box
                key={slide.id}
                as="button"
                className={`w-full rounded-lg overflow-hidden border-2 transition-colors ${
                  activeSlide === slide.id ? "border-brand-500" : "border-transparent hover:border-border"
                }`}
                onClick={() => setActiveSlide(slide.id)}
              >
                <Box className={`w-full aspect-video bg-gradient-to-br ${slide.bgGradient} p-2 flex items-center justify-center`}>
                  <Text variant="caption" className="text-white/80 text-xs text-center truncate">{slide.title}</Text>
                </Box>
                <Box className="py-1 bg-surface-secondary">
                  <Text variant="caption" muted className="text-center text-xs">{String(slide.id)}</Text>
                </Box>
              </Box>
            ))}
            <Button variant="ghost" size="sm" className="w-full mt-2">+ Add Slide</Button>
          </Box>

          <Box className="flex-1 flex items-center justify-center bg-surface-secondary/30 p-8 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                transition={SPRING_BOUNCY}
                className="w-full max-w-4xl"
              >
                <Box className={`w-full aspect-video rounded-xl bg-gradient-to-br ${currentSlide.bgGradient} shadow-2xl overflow-hidden border border-white/10`}>
                  <SlideContent slide={currentSlide} />
                </Box>
              </motion.div>
            </AnimatePresence>
          </Box>

          {showSidebar && (
            <Box className="w-64 border-l border-border bg-surface flex flex-col overflow-y-auto p-3 space-y-4 flex-shrink-0">
              <Text variant="label" className="font-semibold text-xs uppercase tracking-wider text-content-tertiary">Slide Layout</Text>
              <Box className="grid grid-cols-2 gap-2">
                {["Title", "Content", "Two Column", "Blank"].map((layout) => (
                  <Box key={layout} className="p-2 rounded border border-border hover:border-brand-500/50 cursor-pointer text-center transition-colors">
                    <Text variant="caption" className="text-xs">{layout}</Text>
                  </Box>
                ))}
              </Box>
              <Box className="border-t border-border pt-3">
                <Text variant="label" className="font-semibold text-xs uppercase tracking-wider text-content-tertiary">AI Assistant</Text>
                <Box className="mt-2 space-y-1">
                  {["Generate Slide", "Suggest Design", "Add Speaker Notes", "Create from Outline"].map((action) => (
                    <Button key={action} variant="ghost" size="sm" className="w-full justify-start">{action}</Button>
                  ))}
                </Box>
              </Box>
              <Box className="border-t border-border pt-3">
                <Text variant="label" className="font-semibold text-xs uppercase tracking-wider text-content-tertiary">Speaker Notes</Text>
                <Box className="mt-2 p-2 rounded bg-surface-secondary min-h-[80px]">
                  <Text variant="caption" muted>
                    Welcome the audience. Emphasize Q3 achievements and the Marco Reid partnership announcement.
                  </Text>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        <Box className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-surface-secondary/50">
          <Text variant="caption" muted>Slide {String(activeSlide)} of {String(SLIDES.length)}</Text>
          <Box className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSidebar((p: boolean) => !p)}>
              {showSidebar ? "Hide Panel" : "Panel"}
            </Button>
            <Text variant="caption" muted>100%</Text>
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}
