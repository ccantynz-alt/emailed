"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Text,
  Button,
  Card,
  PageLayout,
  StatCard,
  AnalyticsChart,
  Skeleton,
  SkeletonTable,
  type ChartDataPoint,
} from "@emailed/ui";
import {
  analyticsApi,
  type OverviewStats,
  type TimeseriesPoint,
  type DomainStats,
} from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────

type DateRange = "7d" | "30d" | "90d";

interface DateRangeConfig {
  label: string;
  days: number;
}

const DATE_RANGES: Record<DateRange, DateRangeConfig> = {
  "7d": { label: "Last 7 days", days: 7 },
  "30d": { label: "Last 30 days", days: 30 },
  "90d": { label: "Last 90 days", days: 90 },
};

function getDateRange(range: DateRange): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - DATE_RANGES[range].days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Empty state for overview ─────────────────────────────────────────────

const EMPTY_STATS: OverviewStats = {
  sent: 0,
  delivered: 0,
  bounced: 0,
  complained: 0,
  opened: 0,
  clicked: 0,
  deliveryRate: 0,
  bounceRate: 0,
  openRate: 0,
  clickRate: 0,
};

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState<DateRange>("30d");
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [domainStats, setDomainStats] = useState<DomainStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (selectedRange: DateRange) => {
    setLoading(true);
    setError(null);

    const params = getDateRange(selectedRange);

    try {
      const [overviewRes, timeseriesRes, domainsRes] = await Promise.allSettled([
        analyticsApi.overview(params),
        analyticsApi.timeseries({ ...params, granularity: "day" }),
        analyticsApi.domains(params),
      ]);

      if (overviewRes.status === "fulfilled") {
        setStats(overviewRes.value.data);
      } else {
        setStats(EMPTY_STATS);
      }

      if (timeseriesRes.status === "fulfilled") {
        setTimeseries(timeseriesRes.value.data);
      } else {
        setTimeseries([]);
      }

      if (domainsRes.status === "fulfilled") {
        setDomainStats(domainsRes.value.data);
      } else {
        setDomainStats([]);
      }
    } catch {
      setError("Failed to load analytics data. Please try again.");
      setStats(EMPTY_STATS);
      setTimeseries([]);
      setDomainStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  const handleRangeChange = (newRange: DateRange) => {
    setRange(newRange);
  };

  // Convert timeseries data for the chart components
  const sendVolumeData: ChartDataPoint[] = timeseries.map((p) => ({
    label: formatDate(p.timestamp),
    value: p.sent,
  }));

  const deliveredData: ChartDataPoint[] = timeseries.map((p) => ({
    label: formatDate(p.timestamp),
    value: p.delivered,
  }));

  const bouncedData: ChartDataPoint[] = timeseries.map((p) => ({
    label: formatDate(p.timestamp),
    value: p.bounced,
  }));

  const engagementData: ChartDataPoint[] = timeseries.map((p) => ({
    label: formatDate(p.timestamp),
    value: p.opened + p.clicked,
  }));

  // Limit visible labels on charts for readability
  const trimChartData = (data: ChartDataPoint[], max: number): ChartDataPoint[] => {
    if (data.length <= max) return data;
    // Show every Nth label
    const step = Math.ceil(data.length / max);
    return data.map((d, i) => ({
      ...d,
      label: i % step === 0 ? d.label : "",
    }));
  };

  const chartMax = range === "7d" ? 7 : range === "30d" ? 15 : 12;

  const currentStats = stats ?? EMPTY_STATS;

  return (
    <PageLayout
      title="Analytics"
      description="Monitor your email deliverability, engagement metrics, and sender reputation."
      actions={
        <Box className="flex items-center gap-2">
          {(Object.keys(DATE_RANGES) as DateRange[]).map((key) => (
            <Button
              key={key}
              variant={range === key ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleRangeChange(key)}
            >
              {DATE_RANGES[key].label}
            </Button>
          ))}
        </Box>
      }
    >
      {/* Error banner */}
      {error && (
        <Box className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
          <Text variant="body-sm" className="text-red-700">
            {error}
          </Text>
        </Box>
      )}

      {/* Overview stat cards */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {loading ? (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} hoverable>
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              label="Total Sent"
              value={formatNumber(currentStats.sent)}
              trend="neutral"
              description={DATE_RANGES[range].label}
            />
            <StatCard
              label="Delivered"
              value={formatNumber(currentStats.delivered)}
              trend={currentStats.deliveryRate > 0.95 ? "up" : "neutral"}
              description={`${formatPercent(currentStats.deliveryRate)} rate`}
            />
            <StatCard
              label="Bounced"
              value={formatNumber(currentStats.bounced)}
              trend={currentStats.bounceRate > 0.05 ? "down" : "up"}
              description={`${formatPercent(currentStats.bounceRate)} rate`}
            />
            <StatCard
              label="Open Rate"
              value={formatPercent(currentStats.openRate)}
              trend={currentStats.openRate > 0.2 ? "up" : "neutral"}
              description={`${formatNumber(currentStats.opened)} opens`}
            />
            <StatCard
              label="Click Rate"
              value={formatPercent(currentStats.clickRate)}
              trend={currentStats.clickRate > 0.02 ? "up" : "neutral"}
              description={`${formatNumber(currentStats.clicked)} clicks`}
            />
          </>
        )}
      </Box>

      {/* Time series charts */}
      {loading ? (
        <Box className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-3 w-48 mb-4" />
              <Skeleton className="h-48 w-full" />
            </Card>
          ))}
        </Box>
      ) : timeseries.length === 0 ? (
        <Card className="mb-8">
          <Box className="flex flex-col items-center justify-center py-16">
            <Text variant="heading-sm" className="mb-2">
              No data yet
            </Text>
            <Text variant="body-sm" muted>
              Start sending emails to see your analytics here.
            </Text>
          </Box>
        </Card>
      ) : (
        <Box className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AnalyticsChart
            title="Send Volume"
            description={`Emails sent per day (${DATE_RANGES[range].label})`}
            data={trimChartData(sendVolumeData, chartMax)}
            chartType="bar"
            height={220}
            formatValue={(v) => formatNumber(v)}
          />
          <AnalyticsChart
            title="Delivery"
            description={`Successfully delivered emails (${DATE_RANGES[range].label})`}
            data={trimChartData(deliveredData, chartMax)}
            chartType="area"
            height={220}
            formatValue={(v) => formatNumber(v)}
          />
          <AnalyticsChart
            title="Bounces"
            description={`Bounced emails per day (${DATE_RANGES[range].label})`}
            data={trimChartData(bouncedData, chartMax)}
            chartType="line"
            height={220}
            formatValue={(v) => formatNumber(v)}
          />
          <AnalyticsChart
            title="Engagement"
            description={`Opens + clicks per day (${DATE_RANGES[range].label})`}
            data={trimChartData(engagementData, chartMax)}
            chartType="bar"
            color="bg-green-500"
            height={220}
            formatValue={(v) => formatNumber(v)}
          />
        </Box>
      )}

      {/* Per-domain breakdown table */}
      <Card>
        <Box className="mb-4">
          <Text variant="heading-sm">Domain Breakdown</Text>
          <Text variant="body-sm" muted>
            Sending statistics per verified domain
          </Text>
        </Box>

        {loading ? (
          <SkeletonTable rows={4} />
        ) : domainStats.length === 0 ? (
          <Box className="flex flex-col items-center justify-center py-12">
            <Text variant="body-sm" muted>
              No domain data available for this period.
            </Text>
          </Box>
        ) : (
          <Box className="overflow-x-auto -mx-5">
            <Box className="min-w-[640px]">
              {/* Table header */}
              <Box className="flex items-center px-5 py-3 border-b border-border bg-surface-secondary">
                <Box className="flex-[2]">
                  <Text variant="caption" className="font-semibold uppercase tracking-wide text-content-tertiary">
                    Domain
                  </Text>
                </Box>
                <Box className="flex-1 text-right">
                  <Text variant="caption" className="font-semibold uppercase tracking-wide text-content-tertiary">
                    Sent
                  </Text>
                </Box>
                <Box className="flex-1 text-right">
                  <Text variant="caption" className="font-semibold uppercase tracking-wide text-content-tertiary">
                    Delivered
                  </Text>
                </Box>
                <Box className="flex-1 text-right">
                  <Text variant="caption" className="font-semibold uppercase tracking-wide text-content-tertiary">
                    Bounced
                  </Text>
                </Box>
                <Box className="flex-1 text-right">
                  <Text variant="caption" className="font-semibold uppercase tracking-wide text-content-tertiary">
                    Delivery Rate
                  </Text>
                </Box>
                <Box className="flex-1 text-right">
                  <Text variant="caption" className="font-semibold uppercase tracking-wide text-content-tertiary">
                    Bounce Rate
                  </Text>
                </Box>
              </Box>

              {/* Table rows */}
              {domainStats.map((domain) => (
                <Box
                  key={domain.domainId}
                  className="flex items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-surface-secondary transition-colors"
                >
                  <Box className="flex-[2]">
                    <Text variant="body-sm" className="font-medium">
                      {domain.domain}
                    </Text>
                  </Box>
                  <Box className="flex-1 text-right">
                    <Text variant="body-sm">{formatNumber(domain.sent)}</Text>
                  </Box>
                  <Box className="flex-1 text-right">
                    <Text variant="body-sm">{formatNumber(domain.delivered)}</Text>
                  </Box>
                  <Box className="flex-1 text-right">
                    <Text variant="body-sm">{formatNumber(domain.bounced)}</Text>
                  </Box>
                  <Box className="flex-1 text-right">
                    <DeliveryRateBadge rate={domain.deliveryRate} />
                  </Box>
                  <Box className="flex-1 text-right">
                    <BounceRateBadge rate={domain.bounceRate} />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Card>
    </PageLayout>
  );
}

// ─── Helper components ────────────────────────────────────────────────────

function DeliveryRateBadge({ rate }: { rate: number }) {
  const pct = (rate * 100).toFixed(1);
  const colorClass =
    rate >= 0.95
      ? "text-green-700 bg-green-50"
      : rate >= 0.85
        ? "text-yellow-700 bg-yellow-50"
        : "text-red-700 bg-red-50";

  return (
    <Box className={`inline-flex px-2 py-0.5 rounded-full ${colorClass}`}>
      <Text variant="caption" className="font-medium">
        {pct}%
      </Text>
    </Box>
  );
}

function BounceRateBadge({ rate }: { rate: number }) {
  const pct = (rate * 100).toFixed(1);
  const colorClass =
    rate <= 0.02
      ? "text-green-700 bg-green-50"
      : rate <= 0.05
        ? "text-yellow-700 bg-yellow-50"
        : "text-red-700 bg-red-50";

  return (
    <Box className={`inline-flex px-2 py-0.5 rounded-full ${colorClass}`}>
      <Text variant="caption" className="font-medium">
        {pct}%
      </Text>
    </Box>
  );
}
