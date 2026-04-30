"use client";

import { useState } from "react";
import { Box, Text, Card, CardContent, Button } from "@alecrae/ui";
import { motion } from "motion/react";
import { staggerSlow, fadeInUp, useAlecRaeReducedMotion, withReducedMotion } from "../../../../lib/animations";

interface ImportSource {
  id: string;
  name: string;
  description: string;
  color: string;
  letter: string;
  connected: boolean;
}

interface RecentImport {
  name: string;
  source: string;
  date: string;
  status: "completed" | "converting" | "failed";
  size: string;
}

const SOURCES: ImportSource[] = [
  { id: "google", name: "Google Drive", description: "Import from Google Docs, Sheets, and Slides", color: "bg-blue-500", letter: "G", connected: false },
  { id: "onedrive", name: "Microsoft OneDrive", description: "Import from Word, Excel, and PowerPoint", color: "bg-blue-600", letter: "M", connected: false },
  { id: "dropbox", name: "Dropbox", description: "Import files from your Dropbox storage", color: "bg-indigo-500", letter: "D", connected: false },
  { id: "upload", name: "Local Upload", description: "Upload files directly from your computer", color: "bg-surface-secondary", letter: "↑", connected: true },
];

const RECENT_IMPORTS: RecentImport[] = [
  { name: "Q3 Marketing Plan.docx", source: "Google Drive", date: "2 hours ago", status: "completed", size: "1.2 MB" },
  { name: "Revenue Model 2026.xlsx", source: "OneDrive", date: "Yesterday", status: "completed", size: "890 KB" },
  { name: "Brand Guidelines.pptx", source: "Dropbox", date: "Yesterday", status: "completed", size: "15.4 MB" },
  { name: "Client Contracts.zip", source: "Local Upload", date: "2 days ago", status: "converting", size: "8.2 MB" },
  { name: "Old Meeting Notes.docx", source: "Google Drive", date: "3 days ago", status: "completed", size: "245 KB" },
  { name: "corrupted_file.xlsx", source: "Local Upload", date: "4 days ago", status: "failed", size: "2.1 MB" },
];

const EXPORT_FORMATS = [
  { label: "DOCX", desc: "Microsoft Word", color: "bg-blue-500/20 text-blue-400" },
  { label: "XLSX", desc: "Microsoft Excel", color: "bg-emerald-500/20 text-emerald-400" },
  { label: "PPTX", desc: "PowerPoint", color: "bg-amber-500/20 text-amber-400" },
  { label: "PDF", desc: "Portable Document", color: "bg-red-500/20 text-red-400" },
  { label: "HTML", desc: "Web Page", color: "bg-violet-500/20 text-violet-400" },
  { label: "MD", desc: "Markdown", color: "bg-cyan-500/20 text-cyan-400" },
];

const ACCEPTED = ".docx, .xlsx, .pptx, .pdf, .csv, .txt, .rtf, .odt, .ods, .odp";

function statusBadge(status: RecentImport["status"]): { label: string; color: string } {
  switch (status) {
    case "completed": return { label: "Completed", color: "bg-emerald-500/20 text-emerald-400" };
    case "converting": return { label: "Converting...", color: "bg-amber-500/20 text-amber-400" };
    case "failed": return { label: "Failed", color: "bg-red-500/20 text-red-400" };
  }
}

export default function ImportExportPage(): React.ReactNode {
  const reduced = useAlecRaeReducedMotion();
  const [dragOver, setDragOver] = useState(false);

  return (
    <Box className="flex-1 overflow-y-auto p-6">
      <motion.div {...withReducedMotion(fadeInUp, reduced)}>
        <Box className="max-w-4xl mx-auto space-y-6">
          <Box>
            <Text variant="heading-lg" className="font-bold">Import &amp; Export</Text>
            <Text variant="body-md" muted className="mt-1">
              Bring your documents from anywhere. Take them everywhere.
            </Text>
          </Box>

          <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Files Imported", value: "142" },
              { label: "Success Rate", value: "98%" },
              { label: "Data Loss", value: "0%" },
              { label: "Formats Supported", value: "10" },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent>
                  <Box className="text-center">
                    <Text variant="heading-md" className="font-bold">{stat.value}</Text>
                    <Text variant="caption" muted>{stat.label}</Text>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Text variant="label" className="font-semibold text-xs uppercase tracking-wider text-content-tertiary">Import Sources</Text>
          <motion.div variants={staggerSlow} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SOURCES.map((source) => (
              <motion.div key={source.id} variants={fadeInUp}>
                <Card className="hover:border-brand-500/30 transition-colors">
                  <CardContent>
                    <Box className="flex items-center gap-4">
                      <Box className={`w-12 h-12 rounded-xl ${source.color} flex items-center justify-center`}>
                        <Text variant="body-md" className="text-white font-bold">{source.letter}</Text>
                      </Box>
                      <Box className="flex-1">
                        <Text variant="body-sm" className="font-semibold">{source.name}</Text>
                        <Text variant="caption" muted>{source.description}</Text>
                      </Box>
                      <Button variant={source.connected ? "secondary" : "primary"} size="sm">
                        {source.connected ? "Upload" : "Connect"}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <Box
            className={`p-12 rounded-2xl border-2 border-dashed transition-colors text-center space-y-3 ${
              dragOver ? "border-brand-500 bg-brand-500/5" : "border-border"
            }`}
            onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e: React.DragEvent) => { e.preventDefault(); setDragOver(false); }}
          >
            <Text variant="heading-md" className="text-2xl">{"\u{1F4C2}"}</Text>
            <Text variant="body-md" className="font-medium">
              Drop files here or click to browse
            </Text>
            <Text variant="caption" muted>
              Accepted: {ACCEPTED}
            </Text>
          </Box>

          <Box className="space-y-3">
            <Text variant="label" className="font-semibold text-xs uppercase tracking-wider text-content-tertiary">Recent Imports</Text>
            {RECENT_IMPORTS.map((item, i) => {
              const badge = statusBadge(item.status);
              return (
                <Card key={i}>
                  <CardContent>
                    <Box className="flex items-center gap-4">
                      <Box className="flex-1 min-w-0">
                        <Text variant="body-sm" className="font-medium truncate">{item.name}</Text>
                        <Text variant="caption" muted>{item.source} &middot; {item.date} &middot; {item.size}</Text>
                      </Box>
                      <Box className={`px-2 py-0.5 rounded-full text-xs ${badge.color}`}>
                        <Text variant="caption" className="font-medium">{badge.label}</Text>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          <Box className="space-y-3">
            <Text variant="label" className="font-semibold text-xs uppercase tracking-wider text-content-tertiary">Export Formats</Text>
            <Box className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {EXPORT_FORMATS.map((fmt) => (
                <Card key={fmt.label} className="hover:border-brand-500/30 transition-colors cursor-pointer">
                  <CardContent>
                    <Box className="flex items-center justify-between">
                      <Box className="flex items-center gap-3">
                        <Box className={`px-2 py-1 rounded ${fmt.color}`}>
                          <Text variant="caption" className="font-bold text-xs">{fmt.label}</Text>
                        </Box>
                        <Text variant="body-sm" className="font-medium">{fmt.desc}</Text>
                      </Box>
                      <Button variant="ghost" size="sm">Export</Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}
