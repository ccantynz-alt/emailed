"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Text,
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  PageLayout,
} from "@emailed/ui";
import { suppressionsApi, type Suppression } from "../../../lib/api";

const REASON_OPTIONS = [
  { value: "", label: "All reasons" },
  { value: "bounce", label: "Bounce" },
  { value: "complaint", label: "Complaint" },
  { value: "unsubscribe", label: "Unsubscribe" },
  { value: "manual", label: "Manual" },
] as const;

const REASON_COLORS: Record<string, string> = {
  bounce: "bg-red-100 text-red-700",
  complaint: "bg-orange-100 text-orange-700",
  unsubscribe: "bg-yellow-100 text-yellow-700",
  manual: "bg-gray-100 text-gray-700",
};

export default function SuppressionsPage() {
  const [suppressions, setSuppressions] = useState<Suppression[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showBulkCheck, setShowBulkCheck] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const loadSuppressions = useCallback(async (append = false) => {
    try {
      setError(null);
      if (!append) setLoading(true);
      const res = await suppressionsApi.list({
        search: search || undefined,
        reason: reasonFilter || undefined,
        cursor: append ? cursor ?? undefined : undefined,
      });
      if (append) {
        setSuppressions((prev) => [...prev, ...res.data]);
      } else {
        setSuppressions(res.data);
      }
      setCursor(res.cursor);
      setHasMore(res.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suppressions");
    } finally {
      setLoading(false);
    }
  }, [search, reasonFilter, cursor]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadSuppressions(false);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, reasonFilter]);

  const handleRemove = async (id: string) => {
    try {
      await suppressionsApi.remove(id);
      setSuppressions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove suppression");
    }
  };

  const actions = (
    <Box className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => setShowBulkCheck(true)}>
        Bulk Check
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setShowImport(true)}>
        Import CSV
      </Button>
      <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
        Add Suppression
      </Button>
    </Box>
  );

  return (
    <PageLayout
      title="Suppressions"
      description="Manage suppressed email addresses. Suppressed addresses will not receive any emails from your account."
      actions={actions}
    >
      {error && (
        <Box className="mb-4 p-3 rounded bg-red-100 text-red-800 text-sm">
          {error}
        </Box>
      )}

      {showAddForm && (
        <AddSuppressionForm
          onClose={() => setShowAddForm(false)}
          onAdded={() => {
            setShowAddForm(false);
            loadSuppressions(false);
          }}
        />
      )}

      {showImport && (
        <ImportCsvForm
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false);
            loadSuppressions(false);
          }}
        />
      )}

      {showBulkCheck && (
        <BulkCheckForm onClose={() => setShowBulkCheck(false)} />
      )}

      {/* Filters */}
      <Box className="flex flex-col sm:flex-row gap-3 mb-6">
        <Box className="flex-1">
          <Input
            label=""
            variant="text"
            placeholder="Search by email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        <Box>
          <Box
            as="select"
            className="h-10 px-3 rounded-lg border border-border bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={reasonFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReasonFilter(e.target.value)}
          >
            {REASON_OPTIONS.map((opt) => (
              <Box as="option" key={opt.value} value={opt.value}>
                {opt.label}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* List */}
      {loading ? (
        <Text variant="body-md" muted>
          Loading suppressions...
        </Text>
      ) : suppressions.length === 0 ? (
        <Card>
          <CardContent>
            <Box className="text-center py-8">
              <Text variant="heading-sm" className="mb-2">
                No suppressed addresses
              </Text>
              <Text variant="body-sm" muted className="mb-4">
                {search || reasonFilter
                  ? "No suppressions match your current filters. Try adjusting your search criteria."
                  : "Addresses that hard-bounce, receive complaints, or are manually suppressed will appear here."}
              </Text>
              {!search && !reasonFilter && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                >
                  Add a Suppression
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box className="space-y-2">
          {/* Table header */}
          <Box className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2">
            <Text variant="caption" muted className="col-span-5 font-semibold uppercase tracking-wider">
              Email
            </Text>
            <Text variant="caption" muted className="col-span-2 font-semibold uppercase tracking-wider">
              Reason
            </Text>
            <Text variant="caption" muted className="col-span-2 font-semibold uppercase tracking-wider">
              Domain
            </Text>
            <Text variant="caption" muted className="col-span-2 font-semibold uppercase tracking-wider">
              Date
            </Text>
            <Text variant="caption" muted className="col-span-1 font-semibold uppercase tracking-wider">
              Action
            </Text>
          </Box>

          {suppressions.map((sup) => (
            <SuppressionRow
              key={sup.id}
              suppression={sup}
              onRemove={() => handleRemove(sup.id)}
            />
          ))}

          {hasMore && (
            <Box className="text-center pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadSuppressions(true)}
              >
                Load more
              </Button>
            </Box>
          )}
        </Box>
      )}
    </PageLayout>
  );
}

function SuppressionRow({
  suppression,
  onRemove,
}: {
  suppression: Suppression;
  onRemove: () => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <Card>
      <CardContent>
        <Box className="sm:grid grid-cols-12 gap-4 items-center">
          <Box className="col-span-5">
            <Text variant="body-sm" className="font-medium truncate">
              {suppression.email}
            </Text>
          </Box>
          <Box className="col-span-2">
            <Box
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                REASON_COLORS[suppression.reason] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {suppression.reason}
            </Box>
          </Box>
          <Box className="col-span-2">
            <Text variant="body-sm" muted className="truncate">
              {suppression.domain}
            </Text>
          </Box>
          <Box className="col-span-2">
            <Text variant="caption" muted>
              {new Date(suppression.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </Box>
          <Box className="col-span-1 flex justify-end">
            {confirmRemove ? (
              <Box className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmRemove(false)}
                >
                  No
                </Button>
                <Button variant="destructive" size="sm" onClick={onRemove}>
                  Yes
                </Button>
              </Box>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmRemove(true)}
              >
                Remove
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

SuppressionRow.displayName = "SuppressionRow";

function AddSuppressionForm({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [reason, setReason] = useState("manual");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!email.trim()) return;

    setAdding(true);
    setError(null);

    try {
      const emailDomain = domain.trim() || email.split("@")[1] || "";
      await suppressionsApi.add({
        email: email.trim(),
        domain: emailDomain,
        reason,
      });
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add suppression");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <Text variant="heading-sm">Add Suppression</Text>
      </CardHeader>
      <CardContent>
        {error && (
          <Box className="mb-3 p-2 rounded bg-red-100 text-red-800 text-sm">
            {error}
          </Box>
        )}
        <Box className="space-y-4">
          <Input
            label="Email address"
            variant="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Domain (optional, auto-detected from email)"
            variant="text"
            placeholder="example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <Box>
            <Text variant="label" className="mb-2">
              Reason
            </Text>
            <Box
              as="select"
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReason(e.target.value)}
            >
              <Box as="option" value="manual">Manual</Box>
              <Box as="option" value="bounce">Bounce</Box>
              <Box as="option" value="complaint">Complaint</Box>
              <Box as="option" value="unsubscribe">Unsubscribe</Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
      <CardFooter>
        <Box className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            disabled={adding || !email.trim()}
          >
            {adding ? "Adding..." : "Add Suppression"}
          </Button>
        </Box>
      </CardFooter>
    </Card>
  );
}

AddSuppressionForm.displayName = "AddSuppressionForm";

function ImportCsvForm({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [csvContent, setCsvContent] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setCsvContent(evt.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) return;

    setImporting(true);
    setError(null);

    try {
      const res = await suppressionsApi.importCsv(csvContent);
      setResult(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <Text variant="heading-sm">Import from CSV</Text>
      </CardHeader>
      <CardContent>
        {error && (
          <Box className="mb-3 p-2 rounded bg-red-100 text-red-800 text-sm">
            {error}
          </Box>
        )}
        {result && (
          <Box className="mb-3 p-3 rounded bg-green-50 border border-green-200 text-green-800 text-sm">
            <Text variant="body-sm" className="font-medium">
              Import complete: {result.imported} imported, {result.skipped} skipped
            </Text>
            {result.errors.length > 0 && (
              <Box className="mt-2">
                {result.errors.slice(0, 5).map((err, i) => (
                  <Text key={i} variant="caption" className="text-red-600 block">
                    {err}
                  </Text>
                ))}
                {result.errors.length > 5 && (
                  <Text variant="caption" muted>
                    ...and {result.errors.length - 5} more errors
                  </Text>
                )}
              </Box>
            )}
          </Box>
        )}
        <Box className="space-y-4">
          <Box>
            <Text variant="label" className="mb-2">
              Upload CSV file
            </Text>
            <Box
              as="input"
              type="file"
              accept=".csv,text/csv"
              className="block w-full text-sm text-content-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              onChange={handleFileUpload}
            />
            <Text variant="caption" muted className="mt-1">
              CSV format: email,reason (one per line). Reason is optional (defaults to &quot;manual&quot;).
            </Text>
          </Box>
          <Box>
            <Text variant="label" className="mb-2">
              Or paste CSV content
            </Text>
            <Box
              as="textarea"
              className="w-full h-32 px-3 py-2 rounded-lg border border-border bg-surface text-content text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
              placeholder={"user1@example.com,bounce\nuser2@example.com,complaint\nuser3@example.com"}
              value={csvContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCsvContent(e.target.value)}
            />
          </Box>
        </Box>
      </CardContent>
      <CardFooter>
        <Box className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {result ? "Done" : "Cancel"}
          </Button>
          {!result && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleImport}
              disabled={importing || !csvContent.trim()}
            >
              {importing ? "Importing..." : "Import"}
            </Button>
          )}
        </Box>
      </CardFooter>
    </Card>
  );
}

ImportCsvForm.displayName = "ImportCsvForm";

function BulkCheckForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<Array<{ email: string; suppressed: boolean; reason?: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!email.trim()) return;

    const emails = email
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) return;

    setChecking(true);
    setError(null);
    setResults([]);

    try {
      const checks = await Promise.all(
        emails.map(async (addr) => {
          try {
            const res = await suppressionsApi.check(addr);
            return {
              email: addr,
              suppressed: res.data.suppressed,
              reason: res.data.entry?.reason,
            };
          } catch {
            return { email: addr, suppressed: false, reason: "check failed" };
          }
        }),
      );
      setResults(checks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk check failed");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <Text variant="heading-sm">Bulk Check</Text>
      </CardHeader>
      <CardContent>
        {error && (
          <Box className="mb-3 p-2 rounded bg-red-100 text-red-800 text-sm">
            {error}
          </Box>
        )}
        <Box className="space-y-4">
          <Box>
            <Text variant="label" className="mb-2">
              Email addresses (one per line, or comma-separated)
            </Text>
            <Box
              as="textarea"
              className="w-full h-32 px-3 py-2 rounded-lg border border-border bg-surface text-content text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
              placeholder={"user1@example.com\nuser2@example.com\nuser3@example.com"}
              value={email}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmail(e.target.value)}
            />
          </Box>
          {results.length > 0 && (
            <Box className="space-y-1">
              <Text variant="label" className="mb-2">
                Results
              </Text>
              {results.map((r, i) => (
                <Box
                  key={i}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                    r.suppressed
                      ? "bg-red-50 border border-red-200"
                      : "bg-green-50 border border-green-200"
                  }`}
                >
                  <Text variant="body-sm" className="font-mono">
                    {r.email}
                  </Text>
                  <Box className="flex items-center gap-2">
                    {r.suppressed ? (
                      <>
                        <Box className="w-2 h-2 rounded-full bg-red-500" />
                        <Text variant="caption" className="text-red-700 font-medium">
                          Suppressed ({r.reason})
                        </Text>
                      </>
                    ) : (
                      <>
                        <Box className="w-2 h-2 rounded-full bg-green-500" />
                        <Text variant="caption" className="text-green-700 font-medium">
                          Not suppressed
                        </Text>
                      </>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </CardContent>
      <CardFooter>
        <Box className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {results.length > 0 ? "Done" : "Cancel"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCheck}
            disabled={checking || !email.trim()}
          >
            {checking ? "Checking..." : "Check Addresses"}
          </Button>
        </Box>
      </CardFooter>
    </Card>
  );
}

BulkCheckForm.displayName = "BulkCheckForm";
