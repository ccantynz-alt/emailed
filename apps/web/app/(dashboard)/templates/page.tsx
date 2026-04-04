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
  Skeleton,
  SkeletonCard,
  useToast,
} from "@emailed/ui";
import { templatesApi, type EmailTemplate } from "../../../lib/api";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const toast = useToast();

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await templatesApi.list();
      setTemplates(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleDelete = async (id: string) => {
    try {
      await templatesApi.remove(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Template deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete template");
    }
  };

  const actions = (
    <Button variant="primary" size="sm" onClick={() => setShowCreateForm(true)}>
      Create Template
    </Button>
  );

  return (
    <PageLayout
      title="Templates"
      description="Create reusable email templates with variable substitution for consistent, efficient messaging."
      actions={actions}
    >
      {error && (
        <Box className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
          <Text variant="body-sm">{error}</Text>
          <Button variant="ghost" size="sm" onClick={loadTemplates}>
            Retry
          </Button>
        </Box>
      )}

      {showCreateForm && (
        <CreateTemplateForm
          onClose={() => setShowCreateForm(false)}
          onCreated={() => {
            setShowCreateForm(false);
            loadTemplates();
            toast.success("Template created successfully");
          }}
        />
      )}

      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {loading ? (
        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </Box>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent>
            <Box className="text-center py-12">
              <Box className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
                <Text variant="heading-lg" className="text-brand-400">
                  T
                </Text>
              </Box>
              <Text variant="heading-sm" className="mb-2">
                No templates yet
              </Text>
              <Text variant="body-sm" muted className="mb-6 max-w-sm mx-auto">
                Templates let you create reusable email layouts with dynamic variables.
                Perfect for transactional emails, notifications, and newsletters.
              </Text>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateForm(true)}
              >
                Create Your First Template
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              onPreview={() => setPreviewTemplate(tpl)}
              onDelete={() => handleDelete(tpl.id)}
              onUse={tpl}
            />
          ))}
        </Box>
      )}
    </PageLayout>
  );
}

function TemplateCard({
  template,
  onPreview,
  onDelete,
  onUse,
}: {
  template: EmailTemplate;
  onPreview: () => void;
  onDelete: () => void;
  onUse: EmailTemplate;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const variableCount = template.variables?.length ?? 0;
  const previewText =
    template.textBody?.slice(0, 120) ??
    template.htmlBody?.replace(/<[^>]+>/g, "").slice(0, 120) ??
    "No content";

  return (
    <Card hoverable>
      <CardContent>
        <Box className="flex items-start justify-between gap-2 mb-3">
          <Box className="flex-1 min-w-0">
            <Text variant="body-md" className="font-semibold truncate">
              {template.name}
            </Text>
            <Text variant="body-sm" muted className="truncate">
              {template.subject}
            </Text>
          </Box>
        </Box>

        <Text variant="body-sm" muted className="line-clamp-3 mb-3">
          {previewText}
        </Text>

        <Box className="flex items-center gap-2 mb-3">
          {variableCount > 0 && (
            <Box className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-medium">
              {variableCount} variable{variableCount !== 1 ? "s" : ""}
            </Box>
          )}
          <Text variant="caption" muted>
            Updated{" "}
            {new Date(template.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </Box>

        <Box className="flex items-center gap-2 pt-3 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onPreview}>
            Preview
          </Button>
          <Box
            as="a"
            href={`/compose?templateId=${template.id}&subject=${encodeURIComponent(template.subject)}`}
            className="inline-flex"
          >
            <Button variant="secondary" size="sm">
              Use Template
            </Button>
          </Box>
          <Box className="ml-auto">
            {confirmDelete ? (
              <Box className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  Delete
                </Button>
              </Box>
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

TemplateCard.displayName = "TemplateCard";

function TemplatePreview({
  template,
  onClose,
}: {
  template: EmailTemplate;
  onClose: () => void;
}) {
  return (
    <Box className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader>
          <Box className="flex items-center justify-between">
            <Box>
              <Text variant="heading-sm">{template.name}</Text>
              <Text variant="body-sm" muted>
                Subject: {template.subject}
              </Text>
            </Box>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </Box>
        </CardHeader>
        <CardContent className="overflow-y-auto flex-1">
          {template.variables && template.variables.length > 0 && (
            <Box className="mb-4 p-3 rounded-lg bg-surface-secondary">
              <Text variant="label" className="mb-2">
                Variables
              </Text>
              <Box className="flex flex-wrap gap-1.5">
                {template.variables.map((v) => (
                  <Box
                    key={v}
                    className="px-2 py-0.5 rounded bg-brand-100 text-brand-700 text-xs font-mono"
                  >
                    {`{{${v}}}`}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          <Box className="prose prose-sm max-w-none">
            {template.htmlBody ? (
              <Box className="p-4 rounded border border-border bg-white">
                <Text variant="body-sm" className="whitespace-pre-wrap">
                  {template.htmlBody.replace(/<[^>]+>/g, "")}
                </Text>
              </Box>
            ) : template.textBody ? (
              <Box className="p-4 rounded border border-border bg-white">
                <Text variant="body-sm" className="whitespace-pre-wrap font-mono">
                  {template.textBody}
                </Text>
              </Box>
            ) : (
              <Text variant="body-sm" muted>
                No content
              </Text>
            )}
          </Box>
        </CardContent>
        <CardFooter>
          <Box className="flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Box
              as="a"
              href={`/compose?templateId=${template.id}&subject=${encodeURIComponent(template.subject)}`}
              className="inline-flex"
            >
              <Button variant="primary" size="sm">
                Use This Template
              </Button>
            </Box>
          </Box>
        </CardFooter>
      </Card>
    </Box>
  );
}

TemplatePreview.displayName = "TemplatePreview";

function CreateTemplateForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectedVariables = Array.from(
    new Set(body.match(/\{\{(\w+)\}\}/g)?.map((m) => m.slice(2, -2)) ?? []),
  );

  const handleCreate = async () => {
    if (!name.trim() || !subject.trim()) return;
    setCreating(true);
    setError(null);

    try {
      await templatesApi.create({
        name: name.trim(),
        subject: subject.trim(),
        htmlBody: body.trim() || undefined,
        textBody: body.replace(/<[^>]+>/g, "").trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <Text variant="heading-sm">Create Template</Text>
      </CardHeader>
      <CardContent>
        {error && (
          <Box className="mb-3 p-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </Box>
        )}
        <Box className="space-y-4">
          <Input
            label="Template Name"
            variant="text"
            placeholder="Welcome Email"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Subject Line"
            variant="text"
            placeholder="Welcome to {{company_name}}, {{first_name}}!"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Box>
            <Text variant="label" className="mb-2">
              Body
            </Text>
            <Box
              as="textarea"
              className="w-full min-h-[200px] px-3 py-2 rounded-lg border border-border bg-surface text-content text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              placeholder={"Hello {{first_name}},\n\nWelcome to our platform! We're excited to have you on board.\n\nBest regards,\n{{sender_name}}"}
              value={body}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setBody(e.target.value)
              }
            />
            <Text variant="caption" muted className="mt-1">
              Use {"{{variable_name}}"} for dynamic content. Variables will be auto-detected.
            </Text>
          </Box>
          {detectedVariables.length > 0 && (
            <Box>
              <Text variant="label" className="mb-1">
                Detected Variables
              </Text>
              <Box className="flex flex-wrap gap-1.5">
                {detectedVariables.map((v) => (
                  <Box
                    key={v}
                    className="px-2 py-0.5 rounded bg-brand-100 text-brand-700 text-xs font-mono"
                  >
                    {`{{${v}}}`}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
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
            onClick={handleCreate}
            disabled={creating || !name.trim() || !subject.trim()}
          >
            {creating ? "Creating..." : "Create Template"}
          </Button>
        </Box>
      </CardFooter>
    </Card>
  );
}

CreateTemplateForm.displayName = "CreateTemplateForm";
