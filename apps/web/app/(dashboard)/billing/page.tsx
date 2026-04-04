"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Text,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  PageLayout,
  Skeleton,
} from "@emailed/ui";
import { billingApi, type BillingPlan, type BillingUsage } from "../../../lib/api";

// ─── Plan catalog (matches backend PLANS) ─────────────────────────────────

interface PlanInfo {
  id: string;
  name: string;
  price: string;
  priceDetail: string;
  emailsPerMonth: number;
  emailsLabel: string;
  domains: number;
  webhooks: number;
  features: string[];
}

const PLAN_CATALOG: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    priceDetail: "forever",
    emailsPerMonth: 1_000,
    emailsLabel: "1,000 emails/month",
    domains: 1,
    webhooks: 2,
    features: [
      "1,000 emails per month",
      "1 verified domain",
      "2 webhooks",
      "Community support",
      "Basic analytics",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$29",
    priceDetail: "per month",
    emailsPerMonth: 10_000,
    emailsLabel: "10,000 emails/month",
    domains: 5,
    webhooks: 10,
    features: [
      "10,000 emails per month",
      "5 verified domains",
      "10 webhooks",
      "Email support",
      "Full analytics & deliverability insights",
      "Template system",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: "$99",
    priceDetail: "per month",
    emailsPerMonth: 100_000,
    emailsLabel: "100,000 emails/month",
    domains: 25,
    webhooks: 50,
    features: [
      "100,000 emails per month",
      "25 verified domains",
      "50 webhooks",
      "Priority support",
      "Advanced analytics & AI insights",
      "IP warm-up orchestrator",
      "Custom DKIM key rotation",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$499",
    priceDetail: "per month",
    emailsPerMonth: 1_000_000,
    emailsLabel: "1,000,000 emails/month",
    domains: 100,
    webhooks: 200,
    features: [
      "1,000,000 emails per month",
      "100 verified domains",
      "200 webhooks",
      "Dedicated support engineer",
      "Full AI suite (spam, reputation, content)",
      "Dedicated IP pool",
      "SLA guarantee (99.99% uptime)",
      "Custom integrations",
    ],
  },
];

// ─── Page component ───────────────────────────────────────────────────────

export default function BillingPage() {
  const [plan, setPlan] = useState<BillingPlan | null>(null);
  const [usage, setUsage] = useState<BillingUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      billingApi.getPlan().catch(() => null),
      billingApi.getUsage().catch(() => null),
    ]).then(([planRes, usageRes]) => {
      if (planRes) setPlan(planRes.data);
      if (usageRes) setUsage(usageRes.data);
      setLoading(false);
    });
  }, []);

  const currentPlanId = plan?.planId ?? usage?.planTier ?? "free";

  const handleUpgrade = useCallback(
    async (planId: string) => {
      setError(null);
      setUpgrading(planId);
      try {
        const origin = window.location.origin;
        const res = await billingApi.createCheckout(
          planId,
          `${origin}/billing?success=true`,
          `${origin}/billing?cancelled=true`,
        );
        if (res.data.url) {
          window.location.href = res.data.url;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to start checkout",
        );
        setUpgrading(null);
      }
    },
    [],
  );

  const handleManageBilling = useCallback(async () => {
    setError(null);
    setPortalLoading(true);
    try {
      const res = await billingApi.createPortal(
        `${window.location.origin}/billing`,
      );
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to open billing portal",
      );
      setPortalLoading(false);
    }
  }, []);

  return (
    <PageLayout
      title="Billing"
      description="Manage your subscription, view usage, and upgrade your plan."
    >
      <Box className="max-w-5xl space-y-8">
        {error && (
          <Card className="border-status-error/30">
            <CardContent>
              <Text variant="body-sm" className="text-status-error">
                {error}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Current plan & usage summary */}
        <UsageSummary
          plan={plan}
          usage={usage}
          loading={loading}
          currentPlanId={currentPlanId}
          onManageBilling={handleManageBilling}
          portalLoading={portalLoading}
        />

        {/* Plan comparison cards */}
        <Box>
          <Text variant="heading-sm" className="mb-4">
            Plans
          </Text>
          <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {PLAN_CATALOG.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                isCurrent={currentPlanId === p.id}
                isDowngrade={getPlanRank(p.id) < getPlanRank(currentPlanId)}
                upgrading={upgrading === p.id}
                onUpgrade={() => handleUpgrade(p.id)}
                loading={loading}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </PageLayout>
  );
}

// ─── Usage summary card ───────────────────────────────────────────────────

function UsageSummary({
  plan,
  usage,
  loading,
  currentPlanId,
  onManageBilling,
  portalLoading,
}: {
  plan: BillingPlan | null;
  usage: BillingUsage | null;
  loading: boolean;
  currentPlanId: string;
  onManageBilling: () => void;
  portalLoading: boolean;
}) {
  const emailsSent = plan?.usage.emailsSent ?? usage?.emailsSent ?? 0;
  const emailsLimit = plan?.limits.emailsPerMonth ?? usage?.emailsLimit ?? 1000;
  const percentUsed = plan?.usage.percentUsed ?? usage?.percentUsed ?? 0;
  const planName = currentPlanId.charAt(0).toUpperCase() + currentPlanId.slice(1);

  const barColor =
    percentUsed >= 90
      ? "bg-status-error"
      : percentUsed >= 70
        ? "bg-status-warning"
        : "bg-brand-500";

  return (
    <Card>
      <CardHeader>
        <Box className="flex items-center justify-between">
          <Text variant="heading-sm">Current Plan</Text>
          {currentPlanId !== "free" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onManageBilling}
              disabled={portalLoading}
            >
              {portalLoading ? "Loading..." : "Manage Billing"}
            </Button>
          )}
        </Box>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Box className="space-y-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-64" />
          </Box>
        ) : (
          <Box className="space-y-4">
            <Box className="flex items-baseline gap-3">
              <Text variant="heading-lg" className="capitalize">
                {planName}
              </Text>
              <Box className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                <Text variant="caption" className="font-semibold">
                  Current Plan
                </Text>
              </Box>
            </Box>

            {/* Usage meter */}
            <Box>
              <Box className="flex items-center justify-between mb-1">
                <Text variant="body-sm" muted>
                  Emails sent this period
                </Text>
                <Text variant="body-sm" className="font-medium">
                  {emailsSent.toLocaleString()} / {emailsLimit.toLocaleString()}
                </Text>
              </Box>
              <Box className="w-full h-2.5 bg-surface-secondary rounded-full overflow-hidden">
                <Box
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </Box>
              <Text variant="caption" muted className="mt-1">
                {percentUsed.toFixed(1)}% of monthly limit used
              </Text>
            </Box>

            {/* Quick stats */}
            <Box className="grid grid-cols-3 gap-4 pt-2">
              <Box>
                <Text variant="caption" muted>
                  Domains
                </Text>
                <Text variant="body-md" className="font-medium">
                  {plan?.limits.domains ?? "-"}
                </Text>
              </Box>
              <Box>
                <Text variant="caption" muted>
                  Webhooks
                </Text>
                <Text variant="body-md" className="font-medium">
                  {plan?.limits.webhooks ?? "-"}
                </Text>
              </Box>
              <Box>
                <Text variant="caption" muted>
                  Period started
                </Text>
                <Text variant="body-md" className="font-medium">
                  {plan?.periodStartedAt
                    ? new Date(plan.periodStartedAt).toLocaleDateString()
                    : "-"}
                </Text>
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

UsageSummary.displayName = "UsageSummary";

// ─── Plan card ────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  isCurrent,
  isDowngrade,
  upgrading,
  onUpgrade,
  loading,
}: {
  plan: PlanInfo;
  isCurrent: boolean;
  isDowngrade: boolean;
  upgrading: boolean;
  onUpgrade: () => void;
  loading: boolean;
}) {
  const isPopular = plan.id === "professional";

  return (
    <Card
      className={`relative flex flex-col ${
        isCurrent
          ? "border-brand-500 ring-2 ring-brand-500/20"
          : isPopular
            ? "border-brand-300"
            : ""
      }`}
    >
      {isPopular && !isCurrent && (
        <Box className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-500 text-white">
          <Text variant="caption" className="font-semibold text-white">
            Most Popular
          </Text>
        </Box>
      )}
      {isCurrent && (
        <Box className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-500 text-white">
          <Text variant="caption" className="font-semibold text-white">
            Current Plan
          </Text>
        </Box>
      )}
      <CardHeader>
        <Text variant="heading-sm">{plan.name}</Text>
        <Box className="flex items-baseline gap-1 mt-1">
          <Text variant="heading-lg">{plan.price}</Text>
          <Text variant="body-sm" muted>
            /{plan.priceDetail}
          </Text>
        </Box>
        <Text variant="body-sm" muted className="mt-1">
          {plan.emailsLabel}
        </Text>
      </CardHeader>
      <CardContent className="flex-1">
        <Box className="space-y-2">
          {plan.features.map((feature) => (
            <Box key={feature} className="flex items-start gap-2">
              <Text
                variant="body-sm"
                className="text-status-success flex-shrink-0 mt-0.5"
              >
                &#10003;
              </Text>
              <Text variant="body-sm">{feature}</Text>
            </Box>
          ))}
        </Box>
      </CardContent>
      <CardFooter>
        {isCurrent ? (
          <Button variant="secondary" size="sm" className="w-full" disabled>
            Current Plan
          </Button>
        ) : plan.id === "free" ? (
          <Button variant="ghost" size="sm" className="w-full" disabled>
            {isDowngrade ? "Contact support to downgrade" : "Default plan"}
          </Button>
        ) : isDowngrade ? (
          <Button variant="ghost" size="sm" className="w-full" disabled>
            Contact support to downgrade
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={onUpgrade}
            disabled={upgrading || loading}
          >
            {upgrading ? "Redirecting..." : `Upgrade to ${plan.name}`}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

PlanCard.displayName = "PlanCard";

// ─── Helpers ──────────────────────────────────────────────────────────────

function getPlanRank(planId: string): number {
  const ranks: Record<string, number> = {
    free: 0,
    starter: 1,
    professional: 2,
    enterprise: 3,
  };
  return ranks[planId] ?? 0;
}
