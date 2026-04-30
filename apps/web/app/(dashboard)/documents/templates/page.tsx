"use client";

import { useState, useMemo } from "react";
import { Box, Text, Card, CardContent, Button, Input } from "@alecrae/ui";
import { motion } from "motion/react";
import { staggerSlow, fadeInUp, useAlecRaeReducedMotion, withReducedMotion } from "../../../../lib/animations";

type TemplateCategory = "all" | "legal" | "finance" | "business" | "marketing" | "hr" | "personal";
type TemplateType = "document" | "spreadsheet" | "presentation";

interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  type: TemplateType;
  description: string;
  uses: string;
  gradient: string;
  featured?: boolean;
}

const TEMPLATES: Template[] = [
  { id: "t1", name: "Employment Contract", category: "legal", type: "document", description: "Standard employment agreement with customizable clauses", uses: "3.2K", gradient: "from-amber-500/30 to-amber-600/10", featured: true },
  { id: "t2", name: "NDA Agreement", category: "legal", type: "document", description: "Mutual or one-way non-disclosure agreement", uses: "2.8K", gradient: "from-amber-500/20 to-amber-600/5" },
  { id: "t3", name: "Terms of Service", category: "legal", type: "document", description: "Website and app terms of service template", uses: "1.9K", gradient: "from-amber-500/20 to-amber-600/5" },
  { id: "t4", name: "Privacy Policy", category: "legal", type: "document", description: "GDPR and CCPA compliant privacy policy", uses: "2.1K", gradient: "from-amber-500/20 to-amber-600/5" },
  { id: "t5", name: "Retainer Agreement", category: "legal", type: "document", description: "Professional services retainer contract", uses: "890", gradient: "from-amber-500/20 to-amber-600/5" },
  { id: "t6", name: "Power of Attorney", category: "legal", type: "document", description: "Limited or general power of attorney form", uses: "650", gradient: "from-amber-500/20 to-amber-600/5" },
  { id: "t7", name: "Invoice", category: "finance", type: "spreadsheet", description: "Professional invoice with auto-calculations", uses: "5.1K", gradient: "from-emerald-500/30 to-emerald-600/10", featured: true },
  { id: "t8", name: "Budget Spreadsheet", category: "finance", type: "spreadsheet", description: "Annual budget with quarterly breakdown", uses: "4.2K", gradient: "from-emerald-500/20 to-emerald-600/5" },
  { id: "t9", name: "Expense Report", category: "finance", type: "spreadsheet", description: "Employee expense tracking with categories", uses: "3.4K", gradient: "from-emerald-500/20 to-emerald-600/5" },
  { id: "t10", name: "Financial Statement", category: "finance", type: "spreadsheet", description: "P&L, balance sheet, and cash flow", uses: "1.8K", gradient: "from-emerald-500/20 to-emerald-600/5" },
  { id: "t11", name: "Tax Worksheet", category: "finance", type: "spreadsheet", description: "Tax preparation and deduction tracker", uses: "1.2K", gradient: "from-emerald-500/20 to-emerald-600/5" },
  { id: "t12", name: "Revenue Model", category: "finance", type: "spreadsheet", description: "SaaS revenue projection model", uses: "2.6K", gradient: "from-emerald-500/20 to-emerald-600/5" },
  { id: "t13", name: "Business Proposal", category: "business", type: "document", description: "Client-facing business proposal template", uses: "3.8K", gradient: "from-blue-500/20 to-blue-600/5" },
  { id: "t14", name: "Meeting Agenda", category: "business", type: "document", description: "Structured meeting agenda with action items", uses: "4.5K", gradient: "from-blue-500/20 to-blue-600/5" },
  { id: "t15", name: "Project Plan", category: "business", type: "spreadsheet", description: "Project timeline with milestones and tasks", uses: "2.9K", gradient: "from-blue-500/20 to-blue-600/5" },
  { id: "t16", name: "SWOT Analysis", category: "business", type: "document", description: "Strategic planning SWOT framework", uses: "1.7K", gradient: "from-blue-500/20 to-blue-600/5" },
  { id: "t17", name: "Investor Deck", category: "business", type: "presentation", description: "Startup fundraising pitch deck", uses: "6.3K", gradient: "from-violet-500/30 to-violet-600/10", featured: true },
  { id: "t18", name: "Product Launch", category: "marketing", type: "presentation", description: "Product launch announcement slides", uses: "2.1K", gradient: "from-cyan-500/20 to-cyan-600/5" },
  { id: "t19", name: "Quarterly Review", category: "business", type: "presentation", description: "Quarterly business review presentation", uses: "3.5K", gradient: "from-blue-500/20 to-blue-600/5" },
  { id: "t20", name: "Team Onboarding", category: "hr", type: "presentation", description: "New hire onboarding presentation", uses: "1.4K", gradient: "from-pink-500/20 to-pink-600/5" },
  { id: "t21", name: "Marketing Campaign", category: "marketing", type: "spreadsheet", description: "Campaign tracker with ROI calculations", uses: "1.6K", gradient: "from-cyan-500/20 to-cyan-600/5" },
  { id: "t22", name: "Employee Handbook", category: "hr", type: "document", description: "Company policies and procedures guide", uses: "980", gradient: "from-pink-500/20 to-pink-600/5" },
  { id: "t23", name: "Performance Review", category: "hr", type: "document", description: "360-degree performance evaluation form", uses: "1.1K", gradient: "from-pink-500/20 to-pink-600/5" },
  { id: "t24", name: "Personal Budget", category: "personal", type: "spreadsheet", description: "Monthly income and expense tracker", uses: "7.8K", gradient: "from-gray-500/20 to-gray-600/5" },
];

function typeColor(type: TemplateType): { bg: string; text: string; label: string } {
  switch (type) {
    case "document": return { bg: "bg-blue-500/20", text: "text-blue-400", label: "DOC" };
    case "spreadsheet": return { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "XLS" };
    case "presentation": return { bg: "bg-amber-500/20", text: "text-amber-400", label: "PPT" };
  }
}

const CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "legal", label: "Legal" },
  { id: "finance", label: "Finance" },
  { id: "business", label: "Business" },
  { id: "marketing", label: "Marketing" },
  { id: "hr", label: "HR" },
  { id: "personal", label: "Personal" },
];

export default function TemplatesPage(): React.ReactNode {
  const reduced = useAlecRaeReducedMotion();
  const [category, setCategory] = useState<TemplateCategory>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = TEMPLATES;
    if (category !== "all") result = result.filter((t) => t.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    return result;
  }, [category, search]);

  const featured = TEMPLATES.filter((t) => t.featured);

  return (
    <Box className="flex-1 overflow-y-auto p-6">
      <motion.div {...withReducedMotion(fadeInUp, reduced)}>
        <Box className="max-w-6xl mx-auto space-y-6">
          <Box className="flex items-center justify-between">
            <Box>
              <Text variant="heading-lg" className="font-bold">Document Templates</Text>
              <Text variant="body-sm" muted className="mt-1">Professional templates for legal, finance, and business</Text>
            </Box>
            <Box className="w-64">
              <Input label="" variant="text" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </Box>
          </Box>

          <Box className="flex items-center gap-1 p-1 rounded-lg bg-surface-secondary overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <Button key={cat.id} variant={category === cat.id ? "primary" : "ghost"} size="sm" onClick={() => setCategory(cat.id)}>
                {cat.label}
              </Button>
            ))}
          </Box>

          {category === "all" && !search && (
            <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featured.map((template) => {
                const tc = typeColor(template.type);
                return (
                  <Card key={template.id} className="overflow-hidden hover:border-brand-500/30 transition-colors cursor-pointer">
                    <Box className={`h-32 bg-gradient-to-br ${template.gradient} flex items-center justify-center`}>
                      <Text variant="heading-md" className={`font-bold ${tc.text}`}>{tc.label}</Text>
                    </Box>
                    <CardContent>
                      <Box className="space-y-2">
                        <Text variant="body-md" className="font-semibold">{template.name}</Text>
                        <Text variant="caption" muted>{template.description}</Text>
                        <Box className="flex items-center justify-between pt-1">
                          <Text variant="caption" muted>Used {template.uses} times</Text>
                          <Button variant="primary" size="sm">Use Template</Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          <Box className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
            <Text variant="body-sm" className="font-medium">
              Made for professionals. Templates designed for attorneys, accountants, and business professionals. Used by firms across 40+ countries.
            </Text>
          </Box>

          <motion.div variants={staggerSlow} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((template) => {
              const tc = typeColor(template.type);
              return (
                <motion.div key={template.id} variants={fadeInUp}>
                  <Card className="group hover:border-brand-500/30 transition-all cursor-pointer h-full">
                    <CardContent>
                      <Box className="space-y-3">
                        <Box className={`w-full h-16 rounded-lg bg-gradient-to-br ${template.gradient} flex items-center justify-center`}>
                          <Text variant="body-sm" className={`font-bold ${tc.text}`}>{tc.label}</Text>
                        </Box>
                        <Box>
                          <Box className="flex items-center gap-2">
                            <Text variant="body-sm" className="font-semibold">{template.name}</Text>
                            <Box className={`px-1.5 py-0.5 rounded text-xs ${tc.bg}`}>
                              <Text variant="caption" className={`text-xs ${tc.text}`}>{tc.label}</Text>
                            </Box>
                          </Box>
                          <Text variant="caption" muted className="mt-1">{template.description}</Text>
                        </Box>
                        <Box className="flex items-center justify-between">
                          <Text variant="caption" muted>{template.uses} uses</Text>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            Use
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
}
