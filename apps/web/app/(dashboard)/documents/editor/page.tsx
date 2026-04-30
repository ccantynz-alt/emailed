"use client";

import { useState } from "react";
import { Box, Text, Card, CardContent, Button } from "@alecrae/ui";
import { motion } from "motion/react";
import { fadeInUp, useAlecRaeReducedMotion, withReducedMotion } from "../../../../lib/animations";

const TOOLBAR_GROUPS = [
  { label: "Text", items: ["B", "I", "U", "S"] },
  { label: "Heading", items: ["H1", "H2", "H3", "P"] },
  { label: "List", items: ["•", "1.", "☑"] },
  { label: "Align", items: ["≡", "≡", "≡", "≡"] },
  { label: "Insert", items: ["\u{1F5BC}", "☷", "\u{1F517}", "—"] },
];

const DOC_CONTENT = `Q3 Strategy Brief

Executive Summary

AlecRae is positioned to capture significant market share in the email client space through a combination of AI-native architecture, aggressive pricing, and feature density that exceeds all competitors. This document outlines our Q3 objectives, key metrics, and strategic initiatives.

Key Objectives

• Reach 2,000 beta users by end of Q3
• Achieve 85% weekly retention among active users
• Launch Marco Reid integration for legal/accounting professionals
• Complete SOC 2 Type I certification
• Ship mobile apps on iOS and Android

Revenue Projections

The following table summarizes our revenue targets:

| Metric          | Q2 Actual | Q3 Target | Growth |
|-----------------|-----------|-----------|--------|
| MRR             | $4,200    | $12,500   | 198%   |
| Paid Users      | 320       | 850       | 166%   |
| ARPU            | $13.12    | $14.70    | 12%    |
| Churn Rate      | 4.2%      | 3.0%      | -29%   |

Competitive Landscape

Our pricing advantage continues to be our strongest differentiator. The average competitor stack costs $100+/month compared to our $9/month Personal plan. No competitor offers unified multi-account AI, built-in grammar checking, voice dictation, and email recall in a single product.

Next Steps

1. Finalize partnership agreement with Marco Reid platform
2. Begin enterprise pilot with 3 law firms
3. Launch public beta waitlist campaign
4. Complete API documentation for third-party integrations`;

interface DocComment {
  id: string;
  author: string;
  color: string;
  text: string;
  time: string;
}

const COMMENTS: DocComment[] = [
  { id: "c1", author: "Sarah Chen", color: "bg-cyan-500", text: "Should we update the Q2 actuals? Numbers came in higher.", time: "2h ago" },
  { id: "c2", author: "Jordan Lee", color: "bg-amber-500", text: "The competitive section needs the latest Superhuman pricing update.", time: "4h ago" },
];

const OUTLINE = [
  "Executive Summary",
  "Key Objectives",
  "Revenue Projections",
  "Competitive Landscape",
  "Next Steps",
];

export default function DocumentEditorPage(): React.ReactNode {
  const reduced = useAlecRaeReducedMotion();
  const [title, setTitle] = useState("Q3 Strategy Brief");
  const [starred, setStarred] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"ai" | "comments" | "outline">("ai");
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <Box className="flex-1 flex flex-col overflow-hidden">
      <motion.div {...withReducedMotion(fadeInUp, reduced)} className="flex flex-col flex-1 min-h-0">
        <Box className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
          <Box className="flex items-center gap-3">
            <Box className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
              <Text variant="caption" className="text-blue-400 font-bold">DOC</Text>
            </Box>
            <Box
              as="input"
              className="bg-transparent text-content font-semibold text-sm border-none outline-none focus:ring-0 w-64"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            />
            <Button variant="ghost" size="sm" onClick={() => setStarred((p: boolean) => !p)}>
              {starred ? "★" : "☆"}
            </Button>
          </Box>
          <Box className="flex items-center gap-2">
            <Box className="flex items-center gap-1 mr-2">
              <Box className="w-2 h-2 rounded-full bg-emerald-500" />
              <Text variant="caption" muted>Saved</Text>
            </Box>
            <Box className="flex -space-x-1.5">
              {["bg-cyan-500", "bg-amber-500"].map((c, i) => (
                <Box key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-surface flex items-center justify-center`}>
                  <Text variant="caption" className="text-white text-xs font-semibold">{i === 0 ? "S" : "J"}</Text>
                </Box>
              ))}
            </Box>
            <Text variant="caption" muted>2 viewing</Text>
            <Button variant="secondary" size="sm">Share</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowSidebar((p: boolean) => !p)}>
              {showSidebar ? "Hide Panel" : "Show Panel"}
            </Button>
          </Box>
        </Box>

        <Box className="flex items-center gap-1 px-4 py-1.5 border-b border-border bg-surface-secondary/50 overflow-x-auto">
          {TOOLBAR_GROUPS.map((group, gi) => (
            <Box key={gi} className="flex items-center gap-0.5">
              {group.items.map((item, ii) => (
                <Box
                  key={ii}
                  as="button"
                  className="w-8 h-8 rounded flex items-center justify-center text-xs font-medium text-content-tertiary hover:bg-surface-secondary hover:text-content transition-colors"
                >
                  <Text variant="caption" className="font-semibold">{item}</Text>
                </Box>
              ))}
              {gi < TOOLBAR_GROUPS.length - 1 && <Box className="w-px h-5 bg-border mx-1" />}
            </Box>
          ))}
        </Box>

        <Box className="flex flex-1 min-h-0">
          <Box className="flex-1 overflow-y-auto bg-surface-secondary/30 flex justify-center py-8 px-4">
            <Box className="w-full max-w-[816px] bg-surface border border-border rounded-lg shadow-lg p-12 min-h-[1056px]">
              <Text variant="body-sm" className="whitespace-pre-wrap leading-relaxed font-mono text-sm">
                {DOC_CONTENT}
              </Text>
              <Box className="mt-4 border-t border-border/50 w-full" />
              <Box className="w-1 h-5 bg-brand-500 animate-pulse inline-block" />
            </Box>
          </Box>

          {showSidebar && (
            <Box className="w-72 border-l border-border bg-surface flex flex-col overflow-hidden">
              <Box className="flex items-center gap-1 p-2 border-b border-border">
                {(["ai", "comments", "outline"] as const).map((t) => (
                  <Button key={t} variant={sidebarTab === t ? "primary" : "ghost"} size="sm" onClick={() => setSidebarTab(t)} className="flex-1">
                    {t === "ai" ? "AI" : t.charAt(0).toUpperCase() + t.slice(1)}
                  </Button>
                ))}
              </Box>
              <Box className="flex-1 overflow-y-auto p-3 space-y-3">
                {sidebarTab === "ai" && (
                  <>
                    <Text variant="label" className="font-semibold text-xs uppercase tracking-wider text-content-tertiary">AI Assistant</Text>
                    {["Summarize Document", "Improve Writing", "Translate", "Make Shorter", "Expand Section", "Check Grammar"].map((action) => (
                      <Button key={action} variant="ghost" size="sm" className="w-full justify-start">
                        {action}
                      </Button>
                    ))}
                  </>
                )}
                {sidebarTab === "comments" && (
                  <>
                    <Text variant="label" className="font-semibold text-xs uppercase tracking-wider text-content-tertiary">Comments ({String(COMMENTS.length)})</Text>
                    {COMMENTS.map((c) => (
                      <Card key={c.id}>
                        <CardContent>
                          <Box className="space-y-1.5">
                            <Box className="flex items-center gap-2">
                              <Box className={`w-5 h-5 rounded-full ${c.color} flex items-center justify-center`}>
                                <Text variant="caption" className="text-white text-xs font-semibold">{c.author[0]}</Text>
                              </Box>
                              <Text variant="caption" className="font-medium">{c.author}</Text>
                              <Text variant="caption" muted>{c.time}</Text>
                            </Box>
                            <Text variant="caption" muted>{c.text}</Text>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
                {sidebarTab === "outline" && (
                  <>
                    <Text variant="label" className="font-semibold text-xs uppercase tracking-wider text-content-tertiary">Document Outline</Text>
                    {OUTLINE.map((heading, i) => (
                      <Box key={i} className="px-3 py-1.5 rounded hover:bg-surface-secondary cursor-pointer transition-colors">
                        <Text variant="body-sm" className="font-medium">{heading}</Text>
                      </Box>
                    ))}
                  </>
                )}
              </Box>
            </Box>
          )}
        </Box>

        <Box className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-surface-secondary/50 text-xs">
          <Box className="flex items-center gap-4">
            <Text variant="caption" muted>1,247 words</Text>
            <Text variant="caption" muted>6,834 characters</Text>
            <Text variant="caption" muted>3 pages</Text>
          </Box>
          <Text variant="caption" muted>English</Text>
        </Box>
      </motion.div>
    </Box>
  );
}
