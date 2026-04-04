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
import { webhooksApi, type Webhook } from "../../../lib/api";

const AVAILABLE_EVENTS = [
  "email.sent",
  "email.delivered",
  "email.bounced",
  "email.complained",
  "email.opened",
  "email.clicked",
  "email.deferred",
] as const;

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadWebhooks = useCallback(async () => {
    try {
      setError(null);
      const res = await webhooksApi.list();
      setWebhooks(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  const handleDelete = async (id: string) => {
    try {
      await webhooksApi.remove(id);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete webhook");
    }
  };

  const handleTest = async (id: string) => {
    try {
      setError(null);
      await webhooksApi.test(id);
      setError(null);
      // Show a brief success note via the error field (reusing for simplicity)
      alert("Test event sent successfully. Check your endpoint for the delivery.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
    }
  };

  const actions = (
    <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
      Add Webhook
    </Button>
  );

  return (
    <PageLayout
      title="Webhooks"
      description="Receive real-time notifications when email events occur. Configure endpoints and manage deliveries."
      actions={actions}
    >
      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-800 text-sm">
          {error}
        </div>
      )}

      {showAddForm && (
        <AddWebhookForm
          onClose={() => setShowAddForm(false)}
          onAdded={() => {
            setShowAddForm(false);
            loadWebhooks();
          }}
        />
      )}

      {loading ? (
        <Text variant="body-md" muted>
          Loading webhooks...
        </Text>
      ) : webhooks.length === 0 ? (
        <Card>
          <CardContent>
            <Box className="text-center py-8">
              <Text variant="heading-sm" className="mb-2">
                No webhooks configured
              </Text>
              <Text variant="body-sm" muted className="mb-4">
                Add a webhook endpoint to start receiving real-time event
                notifications for email deliveries, bounces, and more.
              </Text>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddForm(true)}
              >
                Add Your First Webhook
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box className="space-y-4">
          {webhooks.map((wh) => (
            <WebhookRow
              key={wh.id}
              webhook={wh}
              onDelete={() => handleDelete(wh.id)}
              onTest={() => handleTest(wh.id)}
            />
          ))}
        </Box>
      )}
    </PageLayout>
  );
}

function WebhookRow({
  webhook,
  onDelete,
  onTest,
}: {
  webhook: Webhook;
  onDelete: () => void;
  onTest: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Card>
      <CardContent>
        <Box className="flex items-start justify-between gap-4">
          <Box className="flex-1 min-w-0">
            <Box className="flex items-center gap-2 mb-1">
              <Box
                className={`w-2 h-2 rounded-full ${
                  webhook.active ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <Text variant="body-md" className="font-medium truncate">
                {webhook.url}
              </Text>
            </Box>
            {webhook.description && (
              <Text variant="body-sm" muted className="mb-2">
                {webhook.description}
              </Text>
            )}
            <Box className="flex flex-wrap gap-1.5 mt-2">
              {webhook.events.map((evt) => (
                <Box
                  key={evt}
                  className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-medium"
                >
                  {evt}
                </Box>
              ))}
            </Box>
            <Text variant="caption" muted className="mt-2">
              Created{" "}
              {new Date(webhook.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </Box>
          <Box className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={onTest}>
              Test
            </Button>
            {confirmDelete ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  Confirm
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

WebhookRow.displayName = "WebhookRow";

function AddWebhookForm({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "email.delivered",
    "email.bounced",
  ]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event],
    );
  };

  const handleAdd = async () => {
    if (!url.trim() || selectedEvents.length === 0) return;

    setAdding(true);
    setError(null);

    try {
      await webhooksApi.create({
        url: url.trim(),
        events: selectedEvents,
        description: description.trim() || undefined,
      });
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create webhook");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <Text variant="heading-sm">Add Webhook Endpoint</Text>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 p-2 rounded bg-red-100 text-red-800 text-sm">
            {error}
          </div>
        )}
        <Box className="space-y-4">
          <Input
            label="Endpoint URL"
            variant="text"
            placeholder="https://yourapp.com/webhooks/emailed"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Input
            label="Description (optional)"
            variant="text"
            placeholder="Production webhook for order notifications"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Box>
            <Text variant="label" className="mb-2">
              Events
            </Text>
            <Box className="flex flex-wrap gap-2">
              {AVAILABLE_EVENTS.map((event) => (
                <Box
                  key={event}
                  as="button"
                  type="button"
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedEvents.includes(event)
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-surface border-border text-content-secondary hover:border-brand-300"
                  }`}
                  onClick={() => toggleEvent(event)}
                >
                  {event}
                </Box>
              ))}
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
            disabled={adding || !url.trim() || selectedEvents.length === 0}
          >
            {adding ? "Creating..." : "Create Webhook"}
          </Button>
        </Box>
      </CardFooter>
    </Card>
  );
}

AddWebhookForm.displayName = "AddWebhookForm";
