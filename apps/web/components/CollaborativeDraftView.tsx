"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Text,
  Button,
  CollaborativeEditor,
  CollaborationPanel,
  type CollabSessionInfo,
  type CollabInvite,
  type CollabHistoryEntry,
  type Collaborator,
} from "@emailed/ui";
import {
  useCollaborativeDraft,
  type UseCollaborativeDraftOptions,
} from "../lib/use-collaborative-draft";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CollaborativeDraftViewProps {
  /** Config for the collaboration session (from API). */
  draftId: string;
  sessionId: string;
  token: string;
  /** Session metadata. */
  session: CollabSessionInfo;
  /** Current user info. */
  user: {
    userId: string;
    name: string;
    avatarUrl?: string;
    cursorColor?: string;
  };
  /** Whether the current user is the session owner. */
  isOwner?: boolean;
  /** Initial participants from the API. */
  initialParticipants?: Collaborator[];
  /** Initial pending invites from the API. */
  initialInvites?: CollabInvite[];
  /** API base URL for collaboration endpoints. */
  apiBaseUrl?: string;
  /** Auth token for API calls. */
  apiToken?: string;
  /** Callback when the draft is sent. */
  onSend?: () => void;
  /** Callback when the draft content changes. */
  onContentChange?: (content: { text: string; html: string }) => void;
  /** WebSocket endpoint override. */
  collabEndpoint?: string;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CollaborativeDraftView({
  draftId,
  sessionId,
  token,
  session,
  user,
  isOwner = false,
  initialParticipants = [],
  initialInvites = [],
  apiBaseUrl = "/api",
  apiToken,
  onSend,
  onContentChange,
  collabEndpoint,
  className = "",
}: CollaborativeDraftViewProps): React.JSX.Element {
  const [showPanel, setShowPanel] = useState(false);
  const [pendingInvites, setPendingInvites] =
    useState<CollabInvite[]>(initialInvites);
  const [history, setHistory] = useState<CollabHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wire up the collaboration client.
  const collab = useCollaborativeDraft({
    draftId,
    sessionId,
    token,
    endpoint: collabEndpoint,
    user,
    autoConnect: true,
  });

  // Merge API participants with live collaborators from awareness.
  const allCollaborators: Collaborator[] = mergeCollaborators(
    initialParticipants,
    collab.collaborators,
    user,
  );

  // ─── API calls ──────────────────────────────────────────────────────────

  const authHeaders: Record<string, string> = apiToken
    ? {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      }
    : { "Content-Type": "application/json" };

  const handleInvite = useCallback(
    async (email: string, role: "editor" | "viewer") => {
      const res = await fetch(
        `${apiBaseUrl}/v1/collaborate/draft/${sessionId}/invite`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ email, role }),
        },
      );

      if (!res.ok) {
        const body = (await res.json()) as {
          error?: { message?: string };
        };
        throw new Error(
          body.error?.message ?? `Failed to invite (${res.status})`,
        );
      }

      const body = (await res.json()) as {
        data: {
          inviteId: string;
          inviteeEmail: string;
          role: "editor" | "viewer";
          expiresAt: string;
        };
      };

      setPendingInvites((prev) => [
        ...prev,
        {
          id: body.data.inviteId,
          inviteeEmail: body.data.inviteeEmail,
          role: body.data.role,
          status: "pending",
          expiresAt: body.data.expiresAt,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    [apiBaseUrl, sessionId, authHeaders],
  );

  const handleRemoveCollaborator = useCallback(
    async (userId: string) => {
      const res = await fetch(
        `${apiBaseUrl}/v1/collaborate/draft/${sessionId}/collaborator/${userId}`,
        { method: "DELETE", headers: authHeaders },
      );

      if (!res.ok) {
        const body = (await res.json()) as {
          error?: { message?: string };
        };
        throw new Error(
          body.error?.message ?? `Failed to remove (${res.status})`,
        );
      }
    },
    [apiBaseUrl, sessionId, authHeaders],
  );

  const handleLoadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const offset = history.length;
      const res = await fetch(
        `${apiBaseUrl}/v1/collaborate/draft/${sessionId}/history?limit=20&offset=${offset}`,
        { headers: authHeaders },
      );

      if (!res.ok) {
        throw new Error(`Failed to load history (${res.status})`);
      }

      const body = (await res.json()) as {
        data: { entries: CollabHistoryEntry[] };
      };
      setHistory((prev) => [...prev, ...body.data.entries]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setHistoryLoading(false);
    }
  }, [apiBaseUrl, sessionId, history.length, authHeaders]);

  return (
    <Box className={`flex gap-4 ${className}`}>
      {/* Main editor area */}
      <Box className="flex-1 min-w-0">
        {error && (
          <Box className="mb-3 px-4 py-2 bg-status-error/10 border border-status-error/20 rounded-lg flex items-center justify-between">
            <Text variant="body-sm" className="text-status-error">
              {error}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              Dismiss
            </Button>
          </Box>
        )}

        <CollaborativeEditor
          collabConfig={collab.config}
          connectionStatus={collab.status}
          collaborators={allCollaborators}
          currentUser={user}
          placeholder="Start drafting your email together..."
          onChange={onContentChange}
          onOpenPanel={() => setShowPanel(true)}
          showToolbar
          showCollaborators
          minHeight={300}
        />
      </Box>

      {/* Side panel */}
      {showPanel && (
        <Box className="w-80 flex-shrink-0">
          <CollaborationPanel
            session={session}
            collaborators={allCollaborators}
            pendingInvites={pendingInvites}
            history={history}
            isOwner={isOwner}
            onInvite={handleInvite}
            onRemoveCollaborator={handleRemoveCollaborator}
            onLoadHistory={handleLoadHistory}
            onError={(msg) => setError(msg)}
            onClose={() => setShowPanel(false)}
            loading={historyLoading}
          />
        </Box>
      )}
    </Box>
  );
}

CollaborativeDraftView.displayName = "CollaborativeDraftView";

// ─── Helper: merge API participants with live awareness data ─────────────────

function mergeCollaborators(
  apiParticipants: Collaborator[],
  liveCollaborators: Collaborator[],
  currentUser: { userId: string; name: string; avatarUrl?: string; cursorColor?: string },
): Collaborator[] {
  const merged = new Map<string, Collaborator>();

  // Start with API participants (have role info).
  for (const p of apiParticipants) {
    merged.set(p.userId, { ...p, isOnline: false });
  }

  // Add current user.
  if (!merged.has(currentUser.userId)) {
    merged.set(currentUser.userId, {
      userId: currentUser.userId,
      name: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
      cursorColor: currentUser.cursorColor ?? "#3b82f6",
      isOnline: true,
      role: "owner",
    });
  } else {
    const existing = merged.get(currentUser.userId);
    if (existing) {
      merged.set(currentUser.userId, { ...existing, isOnline: true });
    }
  }

  // Overlay live awareness data.
  for (const lc of liveCollaborators) {
    const existing = merged.get(lc.userId);
    if (existing) {
      merged.set(lc.userId, {
        ...existing,
        isOnline: true,
        cursorColor: lc.cursorColor || existing.cursorColor,
      });
    } else {
      merged.set(lc.userId, lc);
    }
  }

  return Array.from(merged.values());
}
