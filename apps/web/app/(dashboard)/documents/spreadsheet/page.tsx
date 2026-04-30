"use client";

import { useState } from "react";
import { Box, Text, Button } from "@alecrae/ui";
import { motion } from "motion/react";
import { fadeInUp, useAlecRaeReducedMotion, withReducedMotion } from "../../../../lib/animations";

const COLUMNS = ["A", "B", "C", "D", "E", "F"];
const ROWS = 20;

type CellData = Record<string, Record<number, string>>;

const INITIAL_DATA: CellData = {
  A: { 1: "Category", 2: "SaaS Revenue", 3: "Enterprise Deals", 4: "Add-on Revenue", 5: "Custom Domains", 6: "API Access", 7: "White Label", 8: "Priority AI", 9: "Total Revenue", 11: "Expenses", 12: "Engineering", 13: "Marketing", 14: "Infrastructure", 15: "Support", 16: "Total Expenses", 18: "Net Profit" },
  B: { 1: "Q1", 2: "$18,400", 3: "$12,000", 4: "$3,200", 5: "$2,800", 6: "$1,900", 7: "$8,000", 8: "$4,100", 9: "$50,400", 12: "$22,000", 13: "$8,500", 14: "$3,200", 15: "$2,100", 16: "$35,800", 18: "$14,600" },
  C: { 1: "Q2", 2: "$24,600", 3: "$18,500", 4: "$4,100", 5: "$3,400", 6: "$2,800", 7: "$10,000", 8: "$5,200", 9: "$68,600", 12: "$25,000", 13: "$12,000", 14: "$3,800", 15: "$2,400", 16: "$43,200", 18: "$25,400" },
  D: { 1: "Q3", 2: "$32,100", 3: "$24,000", 4: "$5,800", 5: "$4,200", 6: "$3,900", 7: "$12,000", 8: "$6,500", 9: "$88,500", 12: "$28,000", 13: "$15,000", 14: "$4,500", 15: "$3,000", 16: "$50,500", 18: "$38,000" },
  E: { 1: "Q4", 2: "$41,800", 3: "$32,000", 4: "$7,200", 5: "$5,100", 6: "$5,200", 7: "$15,000", 8: "$8,100", 9: "$114,400", 12: "$32,000", 13: "$18,000", 14: "$5,200", 15: "$3,500", 16: "$58,700", 18: "$55,700" },
  F: { 1: "Total", 2: "$116,900", 3: "$86,500", 4: "$20,300", 5: "$15,500", 6: "$13,800", 7: "$45,000", 8: "$23,900", 9: "$321,900", 12: "$107,000", 13: "$53,500", 14: "$16,700", 15: "$11,000", 16: "$188,200", 18: "$133,700" },
};

const TOOLBAR_ITEMS = [
  { items: ["B", "I", "U"] },
  { items: ["$", "%", "#", ","] },
  { items: ["≡", "≡", "≡"] },
  { items: ["⊞", "∑", "fx"] },
];

const SHEET_TABS = ["Summary", "Revenue", "Expenses", "Projections"];

export default function SpreadsheetEditorPage(): React.ReactNode {
  const reduced = useAlecRaeReducedMotion();
  const [selectedCell, setSelectedCell] = useState<{ col: string; row: number } | null>({ col: "C", row: 4 });
  const [starred, setStarred] = useState(false);
  const [activeSheet, setActiveSheet] = useState("Summary");
  const [showSidebar, setShowSidebar] = useState(true);

  const selectedValue = selectedCell ? (INITIAL_DATA[selectedCell.col]?.[selectedCell.row] ?? "") : "";
  const cellRef = selectedCell ? `${selectedCell.col}${String(selectedCell.row)}` : "";

  const isHeaderRow = (row: number): boolean => row === 1 || row === 11;
  const isTotalRow = (row: number): boolean => row === 9 || row === 16 || row === 18;
  const isProfitRow = (row: number): boolean => row === 18;

  return (
    <Box className="flex-1 flex flex-col overflow-hidden">
      <motion.div {...withReducedMotion(fadeInUp, reduced)} className="flex flex-col flex-1 min-h-0">
        <Box className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
          <Box className="flex items-center gap-3">
            <Box className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center">
              <Text variant="caption" className="text-emerald-400 font-bold">XLS</Text>
            </Box>
            <Text variant="body-sm" className="font-semibold">Budget 2026</Text>
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
            <Button variant="ghost" size="sm" onClick={() => setShowSidebar((p: boolean) => !p)}>
              {showSidebar ? "Hide Panel" : "Show Panel"}
            </Button>
          </Box>
        </Box>

        <Box className="flex items-center gap-2 px-4 py-1.5 border-b border-border bg-surface-secondary/50">
          <Box className="w-16 px-2 py-1 rounded bg-surface border border-border text-center">
            <Text variant="caption" className="font-mono font-semibold">{cellRef}</Text>
          </Box>
          <Box className="flex-1 px-2 py-1 rounded bg-surface border border-border">
            <Text variant="caption" className="font-mono">{selectedValue || "Select a cell"}</Text>
          </Box>
        </Box>

        <Box className="flex items-center gap-1 px-4 py-1 border-b border-border bg-surface-secondary/30 overflow-x-auto">
          {TOOLBAR_ITEMS.map((group, gi) => (
            <Box key={gi} className="flex items-center gap-0.5">
              {group.items.map((item, ii) => (
                <Box key={ii} as="button" className="w-7 h-7 rounded flex items-center justify-center text-xs font-medium text-content-tertiary hover:bg-surface-secondary hover:text-content transition-colors">
                  <Text variant="caption" className="font-semibold">{item}</Text>
                </Box>
              ))}
              {gi < TOOLBAR_ITEMS.length - 1 && <Box className="w-px h-4 bg-border mx-1" />}
            </Box>
          ))}
        </Box>

        <Box className="flex flex-1 min-h-0">
          <Box className="flex-1 overflow-auto">
            <Box className="min-w-max">
              <Box className="flex sticky top-0 z-10 bg-surface-secondary border-b border-border">
                <Box className="w-12 h-8 flex items-center justify-center border-r border-border flex-shrink-0" />
                {COLUMNS.map((col) => (
                  <Box key={col} className="w-32 h-8 flex items-center justify-center border-r border-border flex-shrink-0">
                    <Text variant="caption" className="font-semibold text-content-tertiary">{col}</Text>
                  </Box>
                ))}
              </Box>
              {Array.from({ length: ROWS }, (_, i) => i + 1).map((row) => (
                <Box key={row} className="flex border-b border-border/50">
                  <Box className="w-12 h-8 flex items-center justify-center border-r border-border bg-surface-secondary/50 flex-shrink-0">
                    <Text variant="caption" className="text-content-tertiary">{String(row)}</Text>
                  </Box>
                  {COLUMNS.map((col) => {
                    const value = INITIAL_DATA[col]?.[row] ?? "";
                    const isSelected = selectedCell?.col === col && selectedCell?.row === row;
                    const isInRange = selectedCell?.row === row && col >= "B" && col <= "E" && row >= 2 && row <= 8;
                    return (
                      <Box
                        key={col}
                        as="button"
                        className={`w-32 h-8 flex items-center px-2 border-r border-border/50 text-left transition-colors flex-shrink-0 ${
                          isSelected
                            ? "ring-2 ring-brand-500 bg-brand-500/10 z-10"
                            : isInRange
                              ? "bg-brand-500/5"
                              : "hover:bg-surface-secondary/50"
                        } ${isHeaderRow(row) ? "bg-surface-secondary/80" : ""} ${isTotalRow(row) ? "bg-surface-secondary/40" : ""}`}
                        onClick={() => setSelectedCell({ col, row })}
                      >
                        <Text
                          variant="caption"
                          className={`font-mono text-xs truncate ${
                            isHeaderRow(row) ? "font-bold" : ""
                          } ${isTotalRow(row) ? "font-bold" : ""} ${
                            isProfitRow(row) && col !== "A" ? "text-emerald-400" : ""
                          }`}
                        >
                          {value}
                        </Text>
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>

          {showSidebar && (
            <Box className="w-64 border-l border-border bg-surface flex flex-col overflow-y-auto p-3 space-y-4">
              <Text variant="label" className="font-semibold text-xs uppercase tracking-wider text-content-tertiary">AI Assistant</Text>
              {["Generate Chart", "Find Patterns", "Predict Next Quarter", "Explain Formula", "Auto-fill Column", "Create Pivot Table"].map((action) => (
                <Button key={action} variant="ghost" size="sm" className="w-full justify-start">{action}</Button>
              ))}
              <Box className="border-t border-border pt-3">
                <Text variant="label" className="font-semibold text-xs uppercase tracking-wider text-content-tertiary">Cell Properties</Text>
                <Box className="mt-2 space-y-2">
                  <Text variant="caption" muted>Format: Currency</Text>
                  <Text variant="caption" muted>Validation: None</Text>
                  <Text variant="caption" muted>Notes: None</Text>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        <Box className="flex items-center justify-between border-t border-border bg-surface-secondary/50">
          <Box className="flex items-center">
            {SHEET_TABS.map((tab) => (
              <Box
                key={tab}
                as="button"
                className={`px-4 py-1.5 text-xs border-r border-border transition-colors ${
                  activeSheet === tab ? "bg-surface text-content font-medium" : "text-content-tertiary hover:text-content hover:bg-surface-secondary"
                }`}
                onClick={() => setActiveSheet(tab)}
              >
                <Text variant="caption" className={activeSheet === tab ? "font-medium" : ""}>{tab}</Text>
              </Box>
            ))}
          </Box>
          <Box className="flex items-center gap-4 px-4 py-1.5">
            <Text variant="caption" muted>SUM: $88,500</Text>
            <Text variant="caption" muted>COUNT: 7</Text>
            <Text variant="caption" muted>AVG: $12,642</Text>
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}
