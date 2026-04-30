"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Box, Text, Card, CardContent, Button, Input } from "@alecrae/ui";
import { motion, AnimatePresence } from "motion/react";
import { staggerSlow, fadeInUp, useAlecRaeReducedMotion, withReducedMotion, SPRING_BOUNCY } from "../../../../lib/animations";

type ResultType = "document" | "spreadsheet" | "presentation" | "pdf";

interface SearchResult {
  id: string;
  name: string;
  type: ResultType;
  snippet: string;
  folder: string;
  owner: string;
  modified: string;
  relevance: number;
}

const ALL_RESULTS: SearchResult[] = [
  { id: "r1", name: "Q3 Strategy Brief", type: "document", snippet: "...AlecRae is positioned to capture significant market share in the email client space through a combination of AI-native architecture...", folder: "Projects", owner: "Craig Taylor", modified: "2 hours ago", relevance: 98 },
  { id: "r2", name: "Budget 2026", type: "spreadsheet", snippet: "...SaaS Revenue: $18,400 | Enterprise Deals: $12,000 | Total Revenue: $50,400 | Net Profit: $14,600...", folder: "Finance", owner: "Craig Taylor", modified: "4 hours ago", relevance: 92 },
  { id: "r3", name: "Investor Deck Q3", type: "presentation", snippet: "...AlecRae — Investor Update Q3 2026 | Key Metrics: MRR $88.5K (+198%), Users 12,400 (+340%)...", folder: "Projects", owner: "Craig Taylor", modified: "1 hour ago", relevance: 89 },
  { id: "r4", name: "Client Proposal - Acme Corp", type: "document", snippet: "...We propose a comprehensive email infrastructure solution for Acme Corporation, leveraging AlecRae's AI-native platform...", folder: "Projects", owner: "Sarah Chen", modified: "Yesterday", relevance: 85 },
  { id: "r5", name: "Revenue Projections", type: "spreadsheet", snippet: "...Q3 2026 target: $88,500 MRR. Growth drivers: enterprise expansion (+45%), add-on revenue (+32%)...", folder: "Finance", owner: "Sarah Chen", modified: "Yesterday", relevance: 82 },
  { id: "r6", name: "Employment Contract Template", type: "document", snippet: "...This Employment Agreement is entered into as of [DATE] between [COMPANY] and [EMPLOYEE]...", folder: "Legal", owner: "Legal Team", modified: "1 week ago", relevance: 65 },
  { id: "r7", name: "Privacy Policy Draft", type: "document", snippet: "...AlecRae Inc. respects your privacy and is committed to protecting your personal data. This privacy policy...", folder: "Legal", owner: "Craig Taylor", modified: "3 days ago", relevance: 60 },
  { id: "r8", name: "Product Roadmap", type: "presentation", snippet: "...Q3: Mobile Launch | Q4: Enterprise Features | Q1 2027: Marco Reid Integration | Q2 2027: Scale...", folder: "Projects", owner: "Alex Rivera", modified: "Yesterday", relevance: 78 },
  { id: "r9", name: "Marketing Campaign Tracker", type: "spreadsheet", snippet: "...Campaign: Product Hunt Launch | Budget: $5,000 | Leads: 2,400 | Conversion: 12.5% | ROI: 340%...", folder: "Marketing", owner: "Jordan Lee", modified: "4 days ago", relevance: 55 },
  { id: "r10", name: "Team Onboarding", type: "presentation", snippet: "...Welcome to AlecRae! Our mission: Build the fastest, smartest email client. Our values: Speed, Privacy...", folder: "HR", owner: "HR Team", modified: "2 weeks ago", relevance: 50 },
  { id: "r11", name: "Signed NDA", type: "pdf", snippet: "...MUTUAL NON-DISCLOSURE AGREEMENT between AlecRae Inc. and [PARTY B]...", folder: "Legal", owner: "Legal Team", modified: "1 week ago", relevance: 45 },
  { id: "r12", name: "API Integration Guide", type: "document", snippet: "...AlecRae API v1 provides RESTful endpoints for email management, contact sync, and AI-powered features...", folder: "Projects", owner: "Alex Rivera", modified: "5 days ago", relevance: 72 },
];

const RECENT_SEARCHES = ["budget projections", "client proposal acme", "privacy policy", "investor deck", "employment contract"];
const SUGGESTED = ["Documents shared with me this week", "Spreadsheets with budget data", "Presentations created this month"];

function typeColor(type: ResultType): { bg: string; text: string; label: string } {
  switch (type) {
    case "document": return { bg: "bg-blue-500/20", text: "text-blue-400", label: "DOC" };
    case "spreadsheet": return { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "XLS" };
    case "presentation": return { bg: "bg-amber-500/20", text: "text-amber-400", label: "PPT" };
    case "pdf": return { bg: "bg-red-500/20", text: "text-red-400", label: "PDF" };
  }
}

export default function DocumentSearchPage(): React.ReactNode {
  const reduced = useAlecRaeReducedMotion();
  const [query, setQuery] = useState("");
  const [aiSearch, setAiSearch] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | ResultType>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    let filtered = ALL_RESULTS;
    if (typeFilter !== "all") filtered = filtered.filter((r) => r.type === typeFilter);
    const q = query.toLowerCase();
    return filtered
      .filter((r) => r.name.toLowerCase().includes(q) || r.snippet.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q))
      .sort((a, b) => b.relevance - a.relevance);
  }, [query, typeFilter]);

  const bestMatches = results.slice(0, 3);
  const otherResults = results.slice(3);

  return (
    <Box className="flex-1 overflow-y-auto p-6">
      <motion.div {...withReducedMotion(fadeInUp, reduced)}>
        <Box className="max-w-4xl mx-auto space-y-6">
          <Box>
            <Text variant="heading-lg" className="font-bold">Document Search</Text>
            <Text variant="body-sm" muted className="mt-1">Full-text search across all your documents</Text>
          </Box>

          <Box className="space-y-3">
            <Input
              label=""
              variant="text"
              placeholder={aiSearch ? "Ask a question about your documents..." : "Search documents..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Box className="flex items-center gap-3">
              <Box className="flex items-center gap-1 p-1 rounded-lg bg-surface-secondary">
                {(["all", "document", "spreadsheet", "presentation", "pdf"] as const).map((t) => (
                  <Button key={t} variant={typeFilter === t ? "primary" : "ghost"} size="sm" onClick={() => setTypeFilter(t)}>
                    {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
                  </Button>
                ))}
              </Box>
              <Button
                variant={aiSearch ? "primary" : "ghost"}
                size="sm"
                onClick={() => setAiSearch((p: boolean) => !p)}
              >
                {"\u{1F9E0}"} AI Search
              </Button>
            </Box>
          </Box>

          <AnimatePresence mode="wait">
            {!query.trim() ? (
              <motion.div
                key="empty"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={SPRING_BOUNCY}
                className="space-y-6"
              >
                <Box className="space-y-2">
                  <Text variant="label" className="font-semibold text-xs uppercase tracking-wider text-content-tertiary">Recent Searches</Text>
                  <Box className="flex flex-wrap gap-2">
                    {RECENT_SEARCHES.map((s) => (
                      <Button key={s} variant="ghost" size="sm" onClick={() => setQuery(s)}>
                        {s}
                      </Button>
                    ))}
                  </Box>
                </Box>
                <Box className="space-y-2">
                  <Text variant="label" className="font-semibold text-xs uppercase tracking-wider text-content-tertiary">Suggested Searches</Text>
                  {SUGGESTED.map((s) => (
                    <Box key={s} as="button" className="block w-full text-left px-3 py-2 rounded-lg hover:bg-surface-secondary transition-colors" onClick={() => setQuery(s)}>
                      <Text variant="body-sm" className="text-brand-400">{s}</Text>
                    </Box>
                  ))}
                </Box>
              </motion.div>
            ) : results.length === 0 ? (
              <motion.div
                key="no-results"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={SPRING_BOUNCY}
              >
                <Card>
                  <CardContent>
                    <Box className="py-12 text-center">
                      <Text variant="heading-md">{"\u{1F50D}"}</Text>
                      <Text variant="body-md" muted className="mt-2">No documents match &quot;{query}&quot;</Text>
                      <Text variant="caption" muted className="mt-1">Try a different search term or filter</Text>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={SPRING_BOUNCY}
                className="space-y-4"
              >
                <Text variant="caption" muted>{String(results.length)} results in 0.3s</Text>

                {bestMatches.length > 0 && (
                  <Box className="space-y-2">
                    <Text variant="label" className="font-semibold text-xs uppercase tracking-wider text-content-tertiary">Best Matches</Text>
                    <motion.div variants={staggerSlow} initial="initial" animate="animate" className="space-y-2">
                      {bestMatches.map((result) => {
                        const tc = typeColor(result.type);
                        return (
                          <motion.div key={result.id} variants={fadeInUp}>
                            <Card className="hover:border-brand-500/30 transition-colors cursor-pointer">
                              <CardContent>
                                <Box className="flex items-start gap-3">
                                  <Box className={`w-10 h-10 rounded-lg ${tc.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                    <Text variant="caption" className={`font-bold text-xs ${tc.text}`}>{tc.label}</Text>
                                  </Box>
                                  <Box className="flex-1 min-w-0">
                                    <Box className="flex items-center gap-2">
                                      <Text variant="body-sm" className="font-semibold">{result.name}</Text>
                                      <Text variant="caption" className="text-brand-400">{String(result.relevance)}% match</Text>
                                    </Box>
                                    <Text variant="caption" muted className="mt-1 line-clamp-2">{result.snippet}</Text>
                                    <Box className="flex items-center gap-3 mt-2">
                                      <Text variant="caption" muted>{result.folder}</Text>
                                      <Text variant="caption" muted>{result.owner}</Text>
                                      <Text variant="caption" muted>{result.modified}</Text>
                                    </Box>
                                  </Box>
                                  <Box className="flex items-center gap-1 flex-shrink-0">
                                    <Button variant="ghost" size="sm">Open</Button>
                                    <Button variant="ghost" size="sm">Share</Button>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </Box>
                )}

                {otherResults.length > 0 && (
                  <Box className="space-y-2">
                    <Text variant="label" className="font-semibold text-xs uppercase tracking-wider text-content-tertiary">Other Results</Text>
                    {otherResults.map((result) => {
                      const tc = typeColor(result.type);
                      return (
                        <Card key={result.id} className="hover:border-brand-500/30 transition-colors cursor-pointer">
                          <CardContent>
                            <Box className="flex items-center gap-3">
                              <Box className={`w-8 h-8 rounded ${tc.bg} flex items-center justify-center flex-shrink-0`}>
                                <Text variant="caption" className={`font-bold text-xs ${tc.text}`}>{tc.label}</Text>
                              </Box>
                              <Box className="flex-1 min-w-0">
                                <Text variant="body-sm" className="font-medium truncate">{result.name}</Text>
                                <Text variant="caption" muted className="truncate">{result.snippet}</Text>
                              </Box>
                              <Text variant="caption" muted className="hidden md:block">{result.modified}</Text>
                              <Button variant="ghost" size="sm">Open</Button>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </motion.div>
    </Box>
  );
}
