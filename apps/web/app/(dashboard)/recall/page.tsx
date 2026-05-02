"use client";

/**
 * Email Recall — manage link-based emails with revocation + self-destruct.
 *
 * Outlook's "recall" only works inside the same Exchange tenant and only if
 * the recipient hasn't opened the message. AlecRae's recall is link-based:
 * the recipient receives a secure URL instead of inline content; the sender
 * can revoke access at any time, set a self-destruct timer, and see view
 * counts. Works across providers (Gmail, Outlook, iCloud, IMAP) because we
 * control the link, not the recipient's inbox.
 */

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Text,
  Button,
  Card,
  CardContent,
  CardHeader,
  PageLayout,
} from "@alecrae/ui";
import { recallApi, type RecallRecord, type RecallStatus } from "../../../lib/api";

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function formatRecipients(
  recipients: { name?: string; address: string }[] | string[],
): string {
  if (recipients.length === 0) return "—";
  return recipients
    .map((r) => (typeof r === "string" ? r : r.address))
    .slice(0, 3)
    .join(", ") + (recipients.length > 3 ? ` (+${recipients.length - 3} more)` : "");
}

function statusBadgeClass(status: RecallStatus): string {
  switch (status) {
    case "active":
      return "bg-status-success/10 text-status-success border-status-success/20";
    case "revoked":
      return "bg-status-error/10 text-status-error border-status-error/20";
    case "expired":
      return "bg-content-tertiary/10 text-content-tertiary border-border";
  }
}

const SELF_DESTRUCT_PRESETS = [
  { label: "1 hour", minutes: 60 },
  { label: "1 day", minutes: 60 * 24 },
  { label: "7 days", minutes: 60 * 24 * 7 },
  { label: "30 days", minutes: 60 * 24 * 30 },
];

export default function RecallPage(): React.ReactNode {
  const [records, setRecords] = useState<RecallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await recallApi.list({ limit: 100 });
      setRecords(res.data.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recall list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const flash = (msg: string): void => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleRevoke = async (emailId: string): Promise<void> => {
    setBusyId(emailId);
    try {
      await recallApi.revoke(emailId);
      setRecords((prev) =>
        prev.map((r) =>
          r.emailId === emailId
            ? {
                ...r,
                status: "revoked",
                revokedAt: new Date().toISOString(),
              }
            : r,
        ),
      );
      flash("Access revoked. The link no longer renders content.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revoke failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleSelfDestruct = async (
    emailId: string,
    minutes: number,
  ): Promise<void> => {
    setBusyId(emailId);
    try {
      const res = await recallApi.selfDestruct(emailId, minutes);
      setRecords((prev) =>
        prev.map((r) =>
          r.emailId === emailId
            ? { ...r, selfDestructAt: res.data.selfDestructAt }
            : r,
        ),
      );
      flash(`Self-destruct set for ${res.data.minutesRemaining}m.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Self-destruct failed");
    } finally {
      setBusyId(null);
    }
  };

  const copyUrl = async (url: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      flash("Link copied to clipboard.");
    } catch {
      flash("Could not copy. Highlight the link and copy manually.");
    }
  };

  const activeCount = records.filter((r) => r.status === "active").length;
  const totalViews = records.reduce((sum, r) => sum + r.viewCount, 0);

  return (
    <PageLayout
      title="Email Recall"
      description="Link-based delivery with revocation. Unlike Outlook's recall, this works across providers and after the recipient opens the email."
    >
      <Box className="space-y-6 max-w-5xl">
        {error && (
          <Box className="rounded-md border border-status-error/30 bg-status-error/5 p-3">
            <Text variant="body-sm" className="text-status-error">
              {error}
            </Text>
          </Box>
        )}
        {statusMsg && (
          <Box className="rounded-md border border-accent/30 bg-accent/5 p-3">
            <Text variant="body-sm" className="text-accent">
              {statusMsg}
            </Text>
          </Box>
        )}

        <Box className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent>
              <Text variant="caption" muted className="block">Active links</Text>
              <Text variant="heading-md" className="font-semibold">
                {activeCount}
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Text variant="caption" muted className="block">Total views</Text>
              <Text variant="heading-md" className="font-semibold">
                {totalViews}
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Text variant="caption" muted className="block">Total records</Text>
              <Text variant="heading-md" className="font-semibold">
                {records.length}
              </Text>
            </CardContent>
          </Card>
        </Box>

        <Card>
          <CardHeader>
            <Text variant="heading-sm">Recallable emails</Text>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Text variant="body-sm" muted>Loading...</Text>
            ) : records.length === 0 ? (
              <Box className="space-y-2">
                <Text variant="body-sm" muted>
                  No recall records yet. To enable recall on a sent email, use
                  the &ldquo;Send via secure link&rdquo; option in compose, or
                  call <Text as="code" variant="caption" className="text-accent">POST /v1/recall/enable</Text> from the API.
                </Text>
              </Box>
            ) : (
              <Box className="space-y-3">
                {records.map((r) => (
                  <Box
                    key={r.id}
                    className="border border-border rounded-md p-4 space-y-2"
                  >
                    <Box className="flex items-start justify-between flex-wrap gap-2">
                      <Box className="flex-1 min-w-0">
                        <Text variant="body-md" className="font-semibold truncate">
                          {r.subject}
                        </Text>
                        <Text variant="caption" muted className="truncate">
                          To: {formatRecipients(r.recipients)}
                        </Text>
                      </Box>
                      <Text
                        as="span"
                        variant="caption"
                        className={`px-2 py-0.5 rounded-full border ${statusBadgeClass(r.status)}`}
                      >
                        {r.status}
                      </Text>
                    </Box>

                    <Box className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-1">
                      <Box>
                        <Text variant="caption" muted className="block">Views</Text>
                        <Text variant="body-sm" className="font-medium">{r.viewCount}</Text>
                      </Box>
                      <Box>
                        <Text variant="caption" muted className="block">Last viewed</Text>
                        <Text variant="body-sm" className="font-medium">
                          {formatTimestamp(r.lastViewedAt)}
                        </Text>
                      </Box>
                      <Box>
                        <Text variant="caption" muted className="block">Sent</Text>
                        <Text variant="body-sm" className="font-medium">
                          {formatTimestamp(r.createdAt)}
                        </Text>
                      </Box>
                      <Box>
                        <Text variant="caption" muted className="block">
                          {r.status === "revoked"
                            ? "Revoked at"
                            : r.selfDestructAt
                              ? "Self-destructs"
                              : "Self-destruct"}
                        </Text>
                        <Text variant="body-sm" className="font-medium">
                          {r.status === "revoked"
                            ? formatTimestamp(r.revokedAt)
                            : r.selfDestructAt
                              ? formatTimestamp(r.selfDestructAt)
                              : "—"}
                        </Text>
                      </Box>
                    </Box>

                    <Box className="flex items-center gap-2 pt-1 flex-wrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void copyUrl(r.viewUrl)}
                      >
                        Copy view link
                      </Button>
                      {r.status === "active" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleRevoke(r.emailId)}
                            disabled={busyId === r.emailId}
                          >
                            Revoke now
                          </Button>
                          {SELF_DESTRUCT_PRESETS.map((preset) => (
                            <Button
                              key={preset.label}
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                void handleSelfDestruct(r.emailId, preset.minutes)
                              }
                              disabled={busyId === r.emailId}
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </PageLayout>
  );
}
