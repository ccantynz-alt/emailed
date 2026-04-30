"use client";

import { useState } from "react";
import { Box, Text, Card, CardContent, Button } from "@alecrae/ui";
import { motion } from "motion/react";
import { staggerSlow, fadeInUp, useAlecRaeReducedMotion, withReducedMotion, SPRING_BOUNCY } from "../../../../lib/animations";

interface Version {
  id: string;
  number: string;
  author: string;
  authorColor: string;
  timestamp: string;
  description: string;
  named: boolean;
  dateGroup: string;
  additions: number;
  deletions: number;
}

interface DiffBlock {
  type: "unchanged" | "added" | "deleted" | "modified";
  text: string;
  newText?: string;
}

const VERSIONS: Version[] = [
  { id: "v10", number: "v10", author: "Craig Taylor", authorColor: "bg-violet-500", timestamp: "3:42 PM", description: "Updated executive summary with Q2 actuals", named: true, dateGroup: "Today", additions: 12, deletions: 3 },
  { id: "v9", number: "v9", author: "Sarah Chen", authorColor: "bg-cyan-500", timestamp: "2:18 PM", description: "Added revenue projection table", named: false, dateGroup: "Today", additions: 24, deletions: 0 },
  { id: "v8", number: "v8", author: "Craig Taylor", authorColor: "bg-violet-500", timestamp: "1:05 PM", description: "Revised competitive landscape section", named: false, dateGroup: "Today", additions: 8, deletions: 15 },
  { id: "v7", number: "v7", author: "Jordan Lee", authorColor: "bg-amber-500", timestamp: "11:30 AM", description: "Fixed pricing comparison data", named: false, dateGroup: "Today", additions: 4, deletions: 4 },
  { id: "v6", number: "v6", author: "Craig Taylor", authorColor: "bg-violet-500", timestamp: "4:22 PM", description: "Added next steps and action items", named: true, dateGroup: "Yesterday", additions: 18, deletions: 2 },
  { id: "v5", number: "v5", author: "Alex Rivera", authorColor: "bg-emerald-500", timestamp: "2:10 PM", description: "Product roadmap timeline update", named: false, dateGroup: "Yesterday", additions: 10, deletions: 6 },
  { id: "v4", number: "v4", author: "Sarah Chen", authorColor: "bg-cyan-500", timestamp: "10:45 AM", description: "Key metrics section overhaul", named: false, dateGroup: "Yesterday", additions: 30, deletions: 12 },
  { id: "v3", number: "v3", author: "Craig Taylor", authorColor: "bg-violet-500", timestamp: "3:30 PM", description: "Initial competitive analysis", named: true, dateGroup: "Apr 28", additions: 45, deletions: 0 },
  { id: "v2", number: "v2", author: "Craig Taylor", authorColor: "bg-violet-500", timestamp: "1:15 PM", description: "Added key objectives section", named: false, dateGroup: "Apr 28", additions: 20, deletions: 0 },
  { id: "v1", number: "v1", author: "Craig Taylor", authorColor: "bg-violet-500", timestamp: "10:00 AM", description: "Initial document creation", named: true, dateGroup: "Apr 28", additions: 35, deletions: 0 },
];

const DIFF_CONTENT: DiffBlock[] = [
  { type: "unchanged", text: "Executive Summary" },
  { type: "unchanged", text: "" },
  { type: "deleted", text: "AlecRae is projected to grow moderately in Q3, with estimated revenue increases across all product lines." },
  { type: "added", text: "AlecRae achieved 198% MRR growth in Q2, reaching $68,600 in monthly recurring revenue. Q3 projections indicate continued acceleration driven by enterprise expansion and the Marco Reid partnership." },
  { type: "unchanged", text: "" },
  { type: "unchanged", text: "This document outlines our Q3 objectives, key metrics, and strategic initiatives." },
  { type: "unchanged", text: "" },
  { type: "unchanged", text: "Key Objectives" },
  { type: "unchanged", text: "" },
  { type: "unchanged", text: "• Reach 2,000 beta users by end of Q3" },
  { type: "unchanged", text: "• Achieve 85% weekly retention among active users" },
  { type: "added", text: "• Launch Marco Reid integration for legal/accounting professionals" },
  { type: "unchanged", text: "• Complete SOC 2 Type I certification" },
  { type: "unchanged", text: "" },
  { type: "unchanged", text: "Revenue Projections" },
  { type: "unchanged", text: "" },
  { type: "modified", text: "Q2 target: $50,000 MRR", newText: "Q2 actual: $68,600 MRR (+37% above target)" },
  { type: "modified", text: "Q3 target: $80,000 MRR", newText: "Q3 target: $88,500 MRR (revised up based on Q2 performance)" },
];

export default function VersionHistoryPage(): React.ReactNode {
  const reduced = useAlecRaeReducedMotion();
  const [selectedVersion, setSelectedVersion] = useState("v10");
  const [showChanges, setShowChanges] = useState(true);

  const dateGroups = [...new Set(VERSIONS.map((v) => v.dateGroup))];
  const selected = VERSIONS.find((v) => v.id === selectedVersion);

  return (
    <Box className="flex-1 overflow-hidden">
      <motion.div {...withReducedMotion(fadeInUp, reduced)} className="flex flex-col h-full">
        <Box className="flex items-center justify-between px-6 py-4 border-b border-border">
          <Box>
            <Text variant="heading-lg" className="font-bold">Version History</Text>
            <Text variant="body-sm" muted className="mt-1">Q3 Strategy Brief &middot; 10 versions &middot; 5 collaborators</Text>
          </Box>
          <Box className="flex items-center gap-2">
            <Button variant={showChanges ? "primary" : "ghost"} size="sm" onClick={() => setShowChanges(true)}>Show Changes</Button>
            <Button variant={!showChanges ? "primary" : "ghost"} size="sm" onClick={() => setShowChanges(false)}>Full Document</Button>
          </Box>
        </Box>

        <Box className="flex flex-1 min-h-0">
          <Box className="w-80 border-r border-border overflow-y-auto p-4 flex-shrink-0">
            <motion.div variants={staggerSlow} initial="initial" animate="animate" className="space-y-4">
              {dateGroups.map((group) => (
                <motion.div key={group} variants={fadeInUp} className="space-y-2">
                  <Text variant="caption" className="font-semibold uppercase tracking-wider text-content-tertiary text-xs">{group}</Text>
                  {VERSIONS.filter((v) => v.dateGroup === group).map((version) => (
                    <Box
                      key={version.id}
                      as="button"
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedVersion === version.id ? "bg-brand-500/10 border border-brand-500/30" : "hover:bg-surface-secondary border border-transparent"
                      }`}
                      onClick={() => setSelectedVersion(version.id)}
                    >
                      <Box className="flex items-start gap-3">
                        <Box className="relative mt-0.5">
                          <Box className={`w-7 h-7 rounded-full ${version.authorColor} flex items-center justify-center`}>
                            <Text variant="caption" className="text-white font-semibold text-xs">{version.author.split(" ").map((n) => n[0]).join("")}</Text>
                          </Box>
                        </Box>
                        <Box className="flex-1 min-w-0">
                          <Box className="flex items-center gap-2">
                            <Text variant="caption" className="font-semibold">{version.number}</Text>
                            {version.id === "v10" && (
                              <Box className="px-1.5 py-0.5 rounded bg-emerald-500/20">
                                <Text variant="caption" className="text-emerald-400 text-xs">Current</Text>
                              </Box>
                            )}
                            {version.named && version.id !== "v10" && (
                              <Text variant="caption" className="text-amber-400">{"\u{1F516}"}</Text>
                            )}
                          </Box>
                          <Text variant="caption" muted className="truncate">{version.description}</Text>
                          <Box className="flex items-center gap-2 mt-1">
                            <Text variant="caption" muted className="text-xs">{version.timestamp}</Text>
                            <Text variant="caption" className="text-emerald-400 text-xs">+{String(version.additions)}</Text>
                            {version.deletions > 0 && <Text variant="caption" className="text-red-400 text-xs">-{String(version.deletions)}</Text>}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </motion.div>
              ))}
            </motion.div>
          </Box>

          <Box className="flex-1 overflow-y-auto p-6">
            {selected && (
              <Box className="max-w-3xl mx-auto space-y-4">
                <Card>
                  <CardContent>
                    <Box className="flex items-center justify-between">
                      <Box>
                        <Text variant="body-md" className="font-semibold">{selected.number} — {selected.description}</Text>
                        <Text variant="caption" muted>{selected.author} &middot; {selected.dateGroup} at {selected.timestamp}</Text>
                      </Box>
                      <Box className="flex items-center gap-2">
                        <Button variant="secondary" size="sm">Restore</Button>
                        <Button variant="ghost" size="sm">Download</Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Box className="space-y-0 font-mono text-sm">
                      {DIFF_CONTENT.map((block, i) => {
                        if (block.type === "unchanged") {
                          return (
                            <Box key={i} className="px-4 py-1">
                              <Text variant="caption" className="font-mono">{block.text || " "}</Text>
                            </Box>
                          );
                        }
                        if (block.type === "deleted" && showChanges) {
                          return (
                            <Box key={i} className="px-4 py-1 bg-red-500/10 border-l-2 border-l-red-500">
                              <Text variant="caption" className="font-mono line-through text-red-400">{block.text}</Text>
                            </Box>
                          );
                        }
                        if (block.type === "added" && showChanges) {
                          return (
                            <Box key={i} className="px-4 py-1 bg-emerald-500/10 border-l-2 border-l-emerald-500">
                              <Text variant="caption" className="font-mono text-emerald-400">{block.text}</Text>
                            </Box>
                          );
                        }
                        if (block.type === "modified" && showChanges) {
                          return (
                            <Box key={i}>
                              <Box className="px-4 py-1 bg-red-500/10 border-l-2 border-l-red-500">
                                <Text variant="caption" className="font-mono line-through text-red-400">{block.text}</Text>
                              </Box>
                              <Box className="px-4 py-1 bg-emerald-500/10 border-l-2 border-l-emerald-500">
                                <Text variant="caption" className="font-mono text-emerald-400">{block.newText}</Text>
                              </Box>
                            </Box>
                          );
                        }
                        if (!showChanges && block.type !== "deleted") {
                          return (
                            <Box key={i} className="px-4 py-1">
                              <Text variant="caption" className="font-mono">{block.type === "modified" ? block.newText : block.text}</Text>
                            </Box>
                          );
                        }
                        return null;
                      })}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}
