"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Text,
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  PageLayout,
  Button,
  Input,
} from "@alecrae/ui";
import { motion, type Variants } from "motion/react";
import {
  staggerSlow,
  fadeInUp,
  useAlecRaeReducedMotion,
  withReducedMotion,
} from "../../../lib/animations";

// ─── Types ──────────────────────────────────────────────────────────────────

type FileCategory =
  | "all"
  | "images"
  | "documents"
  | "pdfs"
  | "spreadsheets"
  | "archives"
  | "other";

type SortMode = "newest" | "oldest" | "largest" | "smallest";

interface Attachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  category: FileCategory;
  senderName: string;
  senderEmail: string;
  receivedAt: string;
  emailSubject: string;
  hasPreview: boolean;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_ATTACHMENTS: Attachment[] = [
  {
    id: "att-001",
    filename: "quarterly-report-q1-2026.pdf",
    size: 2_450_000,
    mimeType: "application/pdf",
    category: "pdfs",
    senderName: "Sarah Chen",
    senderEmail: "sarah.chen@acme.com",
    receivedAt: "2026-04-28T14:32:00Z",
    emailSubject: "Q1 2026 Financial Report",
    hasPreview: false,
  },
  {
    id: "att-002",
    filename: "team-photo-offsite.jpg",
    size: 4_800_000,
    mimeType: "image/jpeg",
    category: "images",
    senderName: "Mike Reynolds",
    senderEmail: "mike@team.io",
    receivedAt: "2026-04-27T09:15:00Z",
    emailSubject: "Offsite Photos",
    hasPreview: true,
  },
  {
    id: "att-003",
    filename: "invoice-march-2026.xlsx",
    size: 185_000,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    category: "spreadsheets",
    senderName: "Billing Team",
    senderEmail: "billing@vendor.co",
    receivedAt: "2026-04-25T11:00:00Z",
    emailSubject: "March Invoice #4821",
    hasPreview: false,
  },
  {
    id: "att-004",
    filename: "project-proposal-v3.docx",
    size: 520_000,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    category: "documents",
    senderName: "Lisa Park",
    senderEmail: "lisa.park@consultancy.com",
    receivedAt: "2026-04-24T16:45:00Z",
    emailSubject: "Updated Proposal - Please Review",
    hasPreview: false,
  },
  {
    id: "att-005",
    filename: "backup-april.zip",
    size: 34_200_000,
    mimeType: "application/zip",
    category: "archives",
    senderName: "DevOps Bot",
    senderEmail: "noreply@infra.internal",
    receivedAt: "2026-04-23T03:00:00Z",
    emailSubject: "Weekly Backup Complete",
    hasPreview: false,
  },
  {
    id: "att-006",
    filename: "brand-guidelines-2026.pdf",
    size: 8_900_000,
    mimeType: "application/pdf",
    category: "pdfs",
    senderName: "Design Team",
    senderEmail: "design@alecrae.com",
    receivedAt: "2026-04-22T10:30:00Z",
    emailSubject: "Brand Guidelines Update",
    hasPreview: false,
  },
  {
    id: "att-007",
    filename: "screenshot-bug-report.png",
    size: 1_230_000,
    mimeType: "image/png",
    category: "images",
    senderName: "Tomasz Kowalski",
    senderEmail: "tomasz@qateam.dev",
    receivedAt: "2026-04-21T15:22:00Z",
    emailSubject: "Bug: Sidebar collapse issue",
    hasPreview: true,
  },
  {
    id: "att-008",
    filename: "employee-directory.csv",
    size: 42_000,
    mimeType: "text/csv",
    category: "spreadsheets",
    senderName: "HR Department",
    senderEmail: "hr@alecrae.com",
    receivedAt: "2026-04-20T08:00:00Z",
    emailSubject: "Updated Employee List",
    hasPreview: false,
  },
  {
    id: "att-009",
    filename: "product-mockup-v2.png",
    size: 3_100_000,
    mimeType: "image/png",
    category: "images",
    senderName: "Amy Zhang",
    senderEmail: "amy.z@design.studio",
    receivedAt: "2026-04-19T13:10:00Z",
    emailSubject: "Mockups for Review",
    hasPreview: true,
  },
  {
    id: "att-010",
    filename: "contract-nda-signed.pdf",
    size: 310_000,
    mimeType: "application/pdf",
    category: "pdfs",
    senderName: "Legal Team",
    senderEmail: "legal@acme.com",
    receivedAt: "2026-04-18T17:50:00Z",
    emailSubject: "Signed NDA - Countersigned",
    hasPreview: false,
  },
  {
    id: "att-011",
    filename: "presentation-roadmap.pptx",
    size: 6_700_000,
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    category: "documents",
    senderName: "Craig Murray",
    senderEmail: "craig@alecrae.com",
    receivedAt: "2026-04-17T09:30:00Z",
    emailSubject: "2026 Product Roadmap Deck",
    hasPreview: false,
  },
  {
    id: "att-012",
    filename: "analytics-export.xlsx",
    size: 890_000,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    category: "spreadsheets",
    senderName: "Data Pipeline",
    senderEmail: "analytics@alecrae.com",
    receivedAt: "2026-04-16T06:00:00Z",
    emailSubject: "Weekly Analytics Export",
    hasPreview: false,
  },
  {
    id: "att-013",
    filename: "logo-variations.zip",
    size: 12_400_000,
    mimeType: "application/zip",
    category: "archives",
    senderName: "Freelancer",
    senderEmail: "design@freelancer.me",
    receivedAt: "2026-04-15T14:20:00Z",
    emailSubject: "Logo Variations - Final",
    hasPreview: false,
  },
  {
    id: "att-014",
    filename: "meeting-notes.md",
    size: 8_500,
    mimeType: "text/markdown",
    category: "other",
    senderName: "James Wilson",
    senderEmail: "james.w@startup.io",
    receivedAt: "2026-04-14T11:05:00Z",
    emailSubject: "Notes from Our Call",
    hasPreview: false,
  },
  {
    id: "att-015",
    filename: "hero-banner-final.jpg",
    size: 2_100_000,
    mimeType: "image/jpeg",
    category: "images",
    senderName: "Amy Zhang",
    senderEmail: "amy.z@design.studio",
    receivedAt: "2026-04-13T16:40:00Z",
    emailSubject: "Final Hero Banner Asset",
    hasPreview: true,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: "long" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getCategoryColor(category: FileCategory): string {
  const map: Record<FileCategory, string> = {
    all: "bg-gray-100 text-gray-600",
    images: "bg-purple-100 text-purple-700",
    documents: "bg-blue-100 text-blue-700",
    pdfs: "bg-red-100 text-red-700",
    spreadsheets: "bg-green-100 text-green-700",
    archives: "bg-gray-200 text-gray-700",
    other: "bg-yellow-100 text-yellow-700",
  };
  return map[category];
}

function getCategoryIcon(category: FileCategory): string {
  const map: Record<FileCategory, string> = {
    all: "O",
    images: "I",
    documents: "D",
    pdfs: "P",
    spreadsheets: "S",
    archives: "A",
    other: "?",
  };
  return map[category];
}

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : "";
}

function truncateFilename(filename: string, maxLen: number): string {
  if (filename.length <= maxLen) return filename;
  const ext = getFileExtension(filename);
  const nameWithoutExt = filename.slice(0, filename.length - ext.length);
  const truncatedName = nameWithoutExt.slice(0, maxLen - ext.length - 3);
  return `${truncatedName}...${ext}`;
}

// ─── Filter Pills ───────────────────────────────────────────────────────────

const FILTER_OPTIONS: { value: FileCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "images", label: "Images" },
  { value: "documents", label: "Documents" },
  { value: "pdfs", label: "PDFs" },
  { value: "spreadsheets", label: "Spreadsheets" },
  { value: "archives", label: "Archives" },
  { value: "other", label: "Other" },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "largest", label: "Largest" },
  { value: "smallest", label: "Smallest" },
];

// ─── Sub-Components ─────────────────────────────────────────────────────────

function FileTypeIcon({ category }: { category: FileCategory }): React.ReactNode {
  const colorClass = getCategoryColor(category);
  const letter = getCategoryIcon(category);

  return (
    <Box className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${colorClass}`}>
      <Text className="text-sm font-bold">{letter}</Text>
    </Box>
  );
}

function AttachmentCard({
  attachment,
  variants,
}: {
  attachment: Attachment;
  variants: Variants;
}): React.ReactNode {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={variants}
      onMouseEnter={(): void => setHovered(true)}
      onMouseLeave={(): void => setHovered(false)}
    >
      <Card
        className={`transition-shadow duration-200 cursor-pointer ${
          hovered ? "shadow-lg ring-1 ring-border" : "shadow-sm"
        }`}
      >
        <CardHeader className="pb-2">
          <Box className="flex items-start gap-3">
            <FileTypeIcon category={attachment.category} />
            <Box className="flex-1 min-w-0">
              <Text
                className="text-sm font-medium text-content truncate block"
                title={attachment.filename}
              >
                {truncateFilename(attachment.filename, 28)}
              </Text>
              <Text className="text-xs text-content-secondary mt-0.5">
                {formatFileSize(attachment.size)}
              </Text>
            </Box>
          </Box>
        </CardHeader>
        <CardContent className="py-2">
          <Box className="space-y-1">
            <Box className="flex items-center gap-1.5">
              <Text className="text-xs text-content-tertiary">From:</Text>
              <Text className="text-xs text-content-secondary font-medium truncate">
                {attachment.senderName}
              </Text>
            </Box>
            <Box className="flex items-center gap-1.5">
              <Text className="text-xs text-content-tertiary">Date:</Text>
              <Text className="text-xs text-content-secondary">
                {formatDate(attachment.receivedAt)}
              </Text>
            </Box>
          </Box>
          {attachment.hasPreview ? (
            <Box className="mt-2">
              <Box className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(attachment.category)}`}>
                <Text className="text-xs">Preview</Text>
              </Box>
            </Box>
          ) : null}
        </CardContent>
        <CardFooter className="pt-2">
          <Box
            className={`flex gap-2 transition-opacity duration-150 ${
              hovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <Button variant="ghost" size="sm">
              <Text className="text-xs">Download</Text>
            </Button>
            <Button variant="ghost" size="sm">
              <Text className="text-xs">View Email</Text>
            </Button>
          </Box>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AttachmentsPage(): React.ReactNode {
  const reduced = useAlecRaeReducedMotion();
  const itemVariants = withReducedMotion(fadeInUp, reduced);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FileCategory>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  // ─── Filtered + Sorted Data ───────────────────────────────────────────

  const filtered = useMemo((): Attachment[] => {
    let result = MOCK_ATTACHMENTS;

    // Category filter
    if (activeFilter !== "all") {
      result = result.filter((a) => a.category === activeFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.filename.toLowerCase().includes(q) ||
          a.senderName.toLowerCase().includes(q) ||
          a.emailSubject.toLowerCase().includes(q),
      );
    }

    // Sort
    const sorted = [...result];
    switch (sortMode) {
      case "newest":
        sorted.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
        break;
      case "largest":
        sorted.sort((a, b) => b.size - a.size);
        break;
      case "smallest":
        sorted.sort((a, b) => a.size - b.size);
        break;
    }

    return sorted;
  }, [search, activeFilter, sortMode]);

  // ─── Stats ────────────────────────────────────────────────────────────

  const totalSize = MOCK_ATTACHMENTS.reduce((sum, a) => sum + a.size, 0);
  const totalCount = MOCK_ATTACHMENTS.length;

  const typeCounts: Record<string, number> = {};
  for (const a of MOCK_ATTACHMENTS) {
    typeCounts[a.category] = (typeCounts[a.category] ?? 0) + 1;
  }
  const mostCommonType = Object.entries(typeCounts).sort(
    (a, b) => b[1] - a[1],
  )[0];

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <PageLayout
      title="Attachments"
      description="Every file from every email, in one place."
    >
      {/* Search + Filters Bar */}
      <motion.div variants={itemVariants} initial="initial" animate="animate">
        <Box className="flex flex-col sm:flex-row gap-3 mb-6">
          <Box className="flex-1">
            <Input
              placeholder="Search by filename, sender, or subject..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setSearch(e.target.value)}
            />
          </Box>
          <Box className="flex items-center">
            <select
              value={sortMode}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => setSortMode(e.target.value as SortMode)}
              className="px-3 py-2 rounded-lg border border-border bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Box>
        </Box>

        {/* Filter Pills */}
        <Box className="flex flex-wrap gap-2 mb-6">
          {FILTER_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={activeFilter === opt.value ? "default" : "ghost"}
              size="sm"
              onClick={(): void => setActiveFilter(opt.value)}
            >
              <Text className="text-xs font-medium">{opt.label}</Text>
            </Button>
          ))}
        </Box>
      </motion.div>

      {/* Stats Banner */}
      <motion.div variants={itemVariants} initial="initial" animate="animate">
        <Card className="mb-6">
          <CardContent>
            <Box className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
              <Box className="flex items-center gap-6">
                <Box>
                  <Text className="text-xs text-content-tertiary uppercase tracking-wider font-medium">
                    Total Files
                  </Text>
                  <Text className="text-2xl font-bold text-content">
                    {totalCount}
                  </Text>
                </Box>
                <Box className="w-px h-10 bg-border" />
                <Box>
                  <Text className="text-xs text-content-tertiary uppercase tracking-wider font-medium">
                    Storage Used
                  </Text>
                  <Text className="text-2xl font-bold text-content">
                    {formatFileSize(totalSize)}
                  </Text>
                </Box>
                <Box className="w-px h-10 bg-border hidden sm:block" />
                <Box className="hidden sm:block">
                  <Text className="text-xs text-content-tertiary uppercase tracking-wider font-medium">
                    Most Common
                  </Text>
                  <Text className="text-2xl font-bold text-content capitalize">
                    {mostCommonType ? mostCommonType[0] : "N/A"}
                  </Text>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Attachment Grid */}
      {filtered.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          variants={staggerSlow}
          initial="initial"
          animate="animate"
        >
          {filtered.map((attachment: Attachment) => (
            <AttachmentCard
              key={attachment.id}
              attachment={attachment}
              variants={itemVariants}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} initial="initial" animate="animate">
          <Box className="flex flex-col items-center justify-center py-24">
            <Box className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mb-4">
              <Text className="text-2xl text-content-tertiary">?</Text>
            </Box>
            <Text className="text-lg font-medium text-content-secondary mb-1">
              No attachments found
            </Text>
            <Text className="text-sm text-content-tertiary">
              Try adjusting your search or filters.
            </Text>
          </Box>
        </motion.div>
      )}
    </PageLayout>
  );
}
