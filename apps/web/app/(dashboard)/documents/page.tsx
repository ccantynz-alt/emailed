"use client";

import { useState, useMemo } from "react";
import { Box, Text, Card, CardContent, Button, Input } from "@alecrae/ui";
import { motion } from "motion/react";
import {
  staggerSlow,
  fadeInUp,
  useAlecRaeReducedMotion,
  withReducedMotion,
} from "../../../lib/animations";

type FileType = "document" | "spreadsheet" | "presentation" | "pdf";
type ViewMode = "grid" | "list";
type SortBy = "name" | "modified" | "size" | "type";
type Tab = "all" | "recent" | "shared" | "starred" | "trash";

interface DocFile {
  id: string;
  name: string;
  type: FileType;
  size: string;
  owner: string;
  modified: string;
  shared: boolean;
  starred: boolean;
  folder?: string;
}

const FOLDERS = [
  { name: "Projects", count: 8, color: "bg-violet-500/20 text-violet-400" },
  { name: "Legal", count: 12, color: "bg-amber-500/20 text-amber-400" },
  { name: "Finance", count: 6, color: "bg-emerald-500/20 text-emerald-400" },
  { name: "Marketing", count: 4, color: "bg-cyan-500/20 text-cyan-400" },
];

const FILES: DocFile[] = [
  { id: "d1", name: "Q3 Strategy Brief", type: "document", size: "245 KB", owner: "Craig Taylor", modified: "2 hours ago", shared: true, starred: true },
  { id: "d2", name: "Client Proposal - Acme Corp", type: "document", size: "1.2 MB", owner: "Sarah Chen", modified: "Yesterday", shared: true, starred: false },
  { id: "d3", name: "Meeting Notes Apr 28", type: "document", size: "89 KB", owner: "Craig Taylor", modified: "2 days ago", shared: false, starred: false },
  { id: "d4", name: "Employment Contract Template", type: "document", size: "156 KB", owner: "Legal Team", modified: "1 week ago", shared: true, starred: true, folder: "Legal" },
  { id: "d5", name: "Privacy Policy Draft", type: "document", size: "312 KB", owner: "Craig Taylor", modified: "3 days ago", shared: false, starred: false, folder: "Legal" },
  { id: "s1", name: "Budget 2026", type: "spreadsheet", size: "2.1 MB", owner: "Craig Taylor", modified: "4 hours ago", shared: true, starred: true, folder: "Finance" },
  { id: "s2", name: "Revenue Projections", type: "spreadsheet", size: "890 KB", owner: "Sarah Chen", modified: "Yesterday", shared: true, starred: false, folder: "Finance" },
  { id: "s3", name: "Contact List", type: "spreadsheet", size: "445 KB", owner: "Craig Taylor", modified: "3 days ago", shared: false, starred: false },
  { id: "s4", name: "Invoice Tracker", type: "spreadsheet", size: "678 KB", owner: "Finance Team", modified: "1 week ago", shared: true, starred: false, folder: "Finance" },
  { id: "p1", name: "Investor Deck Q3", type: "presentation", size: "8.4 MB", owner: "Craig Taylor", modified: "1 hour ago", shared: true, starred: true },
  { id: "p2", name: "Product Roadmap", type: "presentation", size: "5.2 MB", owner: "Alex Rivera", modified: "Yesterday", shared: true, starred: false, folder: "Projects" },
  { id: "p3", name: "Team Onboarding", type: "presentation", size: "3.8 MB", owner: "HR Team", modified: "2 weeks ago", shared: true, starred: false },
  { id: "p4", name: "Client Pitch - Marco Reid", type: "presentation", size: "12.1 MB", owner: "Craig Taylor", modified: "3 days ago", shared: false, starred: true, folder: "Projects" },
  { id: "f1", name: "Signed NDA", type: "pdf", size: "1.8 MB", owner: "Legal Team", modified: "1 week ago", shared: true, starred: false, folder: "Legal" },
  { id: "f2", name: "Tax Return 2025", type: "pdf", size: "4.5 MB", owner: "Craig Taylor", modified: "2 months ago", shared: false, starred: false, folder: "Finance" },
  { id: "d6", name: "API Integration Guide", type: "document", size: "567 KB", owner: "Alex Rivera", modified: "5 days ago", shared: true, starred: false, folder: "Projects" },
  { id: "s5", name: "Marketing Campaign Tracker", type: "spreadsheet", size: "234 KB", owner: "Jordan Lee", modified: "4 days ago", shared: true, starred: false, folder: "Marketing" },
  { id: "p5", name: "Quarterly Review Slides", type: "presentation", size: "6.7 MB", owner: "Craig Taylor", modified: "1 week ago", shared: true, starred: false },
];

function typeColor(type: FileType): { bg: string; text: string; label: string } {
  switch (type) {
    case "document": return { bg: "bg-blue-500/20", text: "text-blue-400", label: "DOC" };
    case "spreadsheet": return { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "XLS" };
    case "presentation": return { bg: "bg-amber-500/20", text: "text-amber-400", label: "PPT" };
    case "pdf": return { bg: "bg-red-500/20", text: "text-red-400", label: "PDF" };
  }
}

export default function DocumentsPage(): React.ReactNode {
  const reduced = useAlecRaeReducedMotion();
  const [view, setView] = useState<ViewMode>("grid");
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("modified");
  const [files, setFiles] = useState<DocFile[]>(FILES);
  const [showNewMenu, setShowNewMenu] = useState(false);

  const filtered = useMemo(() => {
    let result = files;
    if (tab === "starred") result = result.filter((f) => f.starred);
    if (tab === "shared") result = result.filter((f) => f.shared);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q) || f.owner.toLowerCase().includes(q));
    }
    return result;
  }, [files, tab, search]);

  const toggleStar = (id: string): void => {
    setFiles((prev: DocFile[]) => prev.map((f) => (f.id === id ? { ...f, starred: !f.starred } : f)));
  };

  const totalSize = "3.2 GB";
  const sharedCount = files.filter((f) => f.shared).length;

  return (
    <Box className="flex-1 overflow-y-auto p-6">
      <motion.div {...withReducedMotion(fadeInUp, reduced)}>
        <Box className="max-w-6xl mx-auto space-y-6">
          <Box className="flex items-center justify-between">
            <Box>
              <Text variant="heading-lg" className="font-bold">Documents</Text>
              <Text variant="body-sm" muted className="mt-1">
                {String(files.length)} documents &middot; {String(sharedCount)} shared &middot; {totalSize} used
              </Text>
            </Box>
            <Box className="relative">
              <Button variant="primary" onClick={() => setShowNewMenu((p: boolean) => !p)}>
                New Document
              </Button>
              {showNewMenu && (
                <Box className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-xl shadow-xl z-10 py-1">
                  {[
                    { label: "Document", href: "/documents/editor" },
                    { label: "Spreadsheet", href: "/documents/spreadsheet" },
                    { label: "Presentation", href: "/documents/presentation" },
                  ].map((item) => (
                    <Box
                      key={item.label}
                      as="a"
                      href={item.href}
                      className="block px-4 py-2 text-sm text-content hover:bg-surface-secondary transition-colors"
                    >
                      <Text variant="body-sm">{item.label}</Text>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>

          <Box className="flex items-center gap-3">
            <Box className="flex-1">
              <Input label="" variant="text" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </Box>
            <Box className="flex items-center gap-1 p-1 rounded-lg bg-surface-secondary">
              {(["all", "recent", "shared", "starred"] as const).map((t) => (
                <Button key={t} variant={tab === t ? "primary" : "ghost"} size="sm" onClick={() => setTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </Box>
            <Box className="flex items-center gap-1 p-1 rounded-lg bg-surface-secondary">
              <Button variant={view === "grid" ? "primary" : "ghost"} size="sm" onClick={() => setView("grid")}>Grid</Button>
              <Button variant={view === "list" ? "primary" : "ghost"} size="sm" onClick={() => setView("list")}>List</Button>
            </Box>
          </Box>

          <Box className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FOLDERS.map((folder) => (
              <Card key={folder.name} className="cursor-pointer hover:border-brand-500/30 transition-colors">
                <CardContent>
                  <Box className="flex items-center gap-3">
                    <Box className={`w-10 h-10 rounded-lg ${folder.color} flex items-center justify-center`}>
                      <Text variant="body-md">{"\u{1F4C1}"}</Text>
                    </Box>
                    <Box>
                      <Text variant="body-sm" className="font-medium">{folder.name}</Text>
                      <Text variant="caption" muted>{String(folder.count)} files</Text>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {view === "grid" ? (
            <motion.div variants={staggerSlow} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((file) => {
                const tc = typeColor(file.type);
                return (
                  <motion.div key={file.id} variants={fadeInUp}>
                    <Card className="group cursor-pointer hover:border-brand-500/30 transition-all">
                      <CardContent>
                        <Box className="space-y-3">
                          <Box className={`w-full h-24 rounded-lg ${tc.bg} flex items-center justify-center`}>
                            <Text variant="heading-md" className={`font-bold ${tc.text}`}>{tc.label}</Text>
                          </Box>
                          <Box>
                            <Text variant="body-sm" className="font-medium truncate">{file.name}</Text>
                            <Text variant="caption" muted>{file.owner} &middot; {file.modified}</Text>
                          </Box>
                          <Box className="flex items-center justify-between">
                            <Box className="flex items-center gap-2">
                              <Text variant="caption" muted>{file.size}</Text>
                              {file.shared && (
                                <Box className="px-1.5 py-0.5 rounded bg-blue-500/10">
                                  <Text variant="caption" className="text-blue-400 text-xs">Shared</Text>
                                </Box>
                              )}
                            </Box>
                            <Button variant="ghost" size="sm" onClick={() => toggleStar(file.id)}>
                              {file.starred ? "★" : "☆"}
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <Card>
              <CardContent>
                <Box className="space-y-1">
                  <Box className="flex items-center gap-4 px-3 py-2 text-xs font-semibold text-content-tertiary uppercase tracking-wider">
                    <Text variant="caption" className="flex-1 font-semibold">Name</Text>
                    <Text variant="caption" className="w-24 font-semibold hidden md:block">Owner</Text>
                    <Text variant="caption" className="w-24 font-semibold hidden md:block">Modified</Text>
                    <Text variant="caption" className="w-16 font-semibold hidden md:block">Size</Text>
                    <Box className="w-8" />
                  </Box>
                  {filtered.map((file) => {
                    const tc = typeColor(file.type);
                    return (
                      <Box key={file.id} className="flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-surface-secondary transition-colors cursor-pointer">
                        <Box className="flex items-center gap-3 flex-1 min-w-0">
                          <Box className={`w-8 h-8 rounded ${tc.bg} flex items-center justify-center flex-shrink-0`}>
                            <Text variant="caption" className={`font-bold text-xs ${tc.text}`}>{tc.label}</Text>
                          </Box>
                          <Text variant="body-sm" className="font-medium truncate">{file.name}</Text>
                          {file.shared && (
                            <Box className="px-1.5 py-0.5 rounded bg-blue-500/10 flex-shrink-0">
                              <Text variant="caption" className="text-blue-400 text-xs">Shared</Text>
                            </Box>
                          )}
                        </Box>
                        <Text variant="caption" muted className="w-24 truncate hidden md:block">{file.owner}</Text>
                        <Text variant="caption" muted className="w-24 hidden md:block">{file.modified}</Text>
                        <Text variant="caption" muted className="w-16 hidden md:block">{file.size}</Text>
                        <Button variant="ghost" size="sm" onClick={() => toggleStar(file.id)}>
                          {file.starred ? "★" : "☆"}
                        </Button>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </motion.div>
    </Box>
  );
}
