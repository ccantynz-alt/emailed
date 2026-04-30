"use client";

import {
  Box,
  Text,
  Card,
  CardContent,
  CardHeader,
  PageLayout,
} from "@alecrae/ui";
import { motion, type Variants } from "motion/react";
import {
  staggerSlow,
  fadeInUp,
  useAlecRaeReducedMotion,
  withReducedMotion,
} from "../../../lib/animations";

// ─── Types ──────────────────────────────────────────────────────────────────

interface HealthMetric {
  id: string;
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
  trendIsGood: boolean;
  trendLabel: string;
  icon: string;
}

interface WeeklyBar {
  day: string;
  sent: number;
  received: number;
}

interface HeatmapCell {
  hour: number;
  day: number;
  intensity: number; // 0-4
}

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  earnedAt: string | null; // null = locked
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const HEALTH_SCORE = 82;
const HEALTH_LABEL = "Excellent";

const METRICS: HealthMetric[] = [
  {
    id: "response-time",
    label: "Avg Response Time",
    value: "2h 14m",
    trend: "down",
    trendIsGood: true,
    trendLabel: "-18% from last week",
    icon: "R",
  },
  {
    id: "inbox-zero",
    label: "Inbox Zero Streak",
    value: "3 days",
    trend: "up",
    trendIsGood: true,
    trendLabel: "Personal best: 7 days",
    icon: "F",
  },
  {
    id: "send-ratio",
    label: "Sent / Received Ratio",
    value: "1 : 4.2",
    trend: "neutral",
    trendIsGood: true,
    trendLabel: "Healthy balance",
    icon: "E",
  },
  {
    id: "unread-backlog",
    label: "Unread Backlog",
    value: "12 emails",
    trend: "down",
    trendIsGood: true,
    trendLabel: "-5 from yesterday",
    icon: "U",
  },
];

const WEEKLY_DATA: WeeklyBar[] = [
  { day: "Mon", sent: 12, received: 34 },
  { day: "Tue", sent: 18, received: 42 },
  { day: "Wed", sent: 8, received: 28 },
  { day: "Thu", sent: 22, received: 51 },
  { day: "Fri", sent: 15, received: 38 },
  { day: "Sat", sent: 3, received: 9 },
  { day: "Sun", sent: 1, received: 5 },
];

/** Generate heatmap data: 7 days x 24 hours with realistic email intensity. */
function generateHeatmapData(): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  // Realistic intensity pattern: busy during work hours, quiet at night/weekends
  const hourWeights = [
    0, 0, 0, 0, 0, 0, 1, 1, 2, 3, 4, 3, 2, 3, 4, 3, 3, 2, 1, 1, 1, 0, 0, 0,
  ];
  const dayWeights = [1.0, 1.1, 0.9, 1.2, 1.0, 0.3, 0.2]; // Mon-Sun

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const hw = hourWeights[hour] ?? 0;
      const dw = dayWeights[day] ?? 0.5;
      const base = hw * dw;
      // Add some randomness
      const jitter = Math.random() * 0.8 - 0.4;
      const raw = Math.max(0, Math.min(4, Math.round(base + jitter)));
      cells.push({ hour, day, intensity: raw });
    }
  }
  return cells;
}

const HEATMAP_DATA = generateHeatmapData();

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "inbox-zero-3",
    icon: "O",
    title: "Inbox Zero x3",
    description: "Hit inbox zero three times",
    earnedAt: "2026-04-28",
  },
  {
    id: "speed-demon",
    icon: "Z",
    title: "Speed Demon",
    description: "Replied to an email in under 5 minutes",
    earnedAt: "2026-04-26",
  },
  {
    id: "newsletter-ninja",
    icon: "N",
    title: "Newsletter Ninja",
    description: "Unsubscribed from 10+ newsletters",
    earnedAt: "2026-04-22",
  },
  {
    id: "early-bird",
    icon: "B",
    title: "Early Bird",
    description: "Cleared inbox before 8 AM",
    earnedAt: "2026-04-20",
  },
  {
    id: "marathon",
    icon: "M",
    title: "Marathon Runner",
    description: "Maintained inbox zero for 7 consecutive days",
    earnedAt: null,
  },
  {
    id: "ai-master",
    icon: "A",
    title: "AI Master",
    description: "Used AI compose 50 times",
    earnedAt: null,
  },
  {
    id: "polyglot",
    icon: "P",
    title: "Polyglot",
    description: "Sent emails in 5 different languages",
    earnedAt: null,
  },
  {
    id: "zero-bounce",
    icon: "T",
    title: "Perfect Sender",
    description: "100% deliverability for 30 days",
    earnedAt: null,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return "#16a34a"; // green-600
  if (score >= 60) return "#ca8a04"; // yellow-600
  return "#dc2626"; // red-600
}

function getScoreBgRing(): string {
  return "#e5e7eb"; // gray-200
}

function getTrendColor(metric: HealthMetric): string {
  if (metric.trendIsGood) return "text-green-600";
  return "text-red-600";
}

function getTrendArrow(metric: HealthMetric): string {
  if (metric.trend === "up") return metric.trendIsGood ? "^" : "v";
  if (metric.trend === "down") return metric.trendIsGood ? "v" : "^";
  return "-";
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_LABELS = [
  "12a", "", "", "3a", "", "", "6a", "", "", "9a", "", "",
  "12p", "", "", "3p", "", "", "6p", "", "", "9p", "", "",
];

function getHeatmapColor(intensity: number): string {
  const colors = [
    "bg-gray-100", // 0 - no activity
    "bg-violet-100", // 1 - light
    "bg-violet-200", // 2 - moderate
    "bg-violet-400", // 3 - busy
    "bg-violet-600", // 4 - very busy
  ];
  return colors[intensity] ?? colors[0]!;
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function HealthScoreCircle({
  score,
  label,
}: {
  score: number;
  label: string;
}): React.ReactNode {
  const radius = 80;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  return (
    <Box className="flex flex-col items-center">
      <Box className="relative w-44 h-44">
        <svg
          className="w-full h-full -rotate-90"
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        >
          {/* Background ring */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke={getScoreBgRing()}
            strokeWidth={stroke}
          />
          {/* Progress ring */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke={getScoreRingColor(score)}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <Box className="absolute inset-0 flex flex-col items-center justify-center">
          <Text className={`text-5xl font-bold ${getScoreColor(score)}`}>
            {score}
          </Text>
        </Box>
      </Box>
      <Text className={`text-lg font-semibold mt-2 ${getScoreColor(score)}`}>
        {label}
      </Text>
      <Text className="text-sm text-content-tertiary mt-0.5">
        Email Health Score
      </Text>
    </Box>
  );
}

function MetricCard({
  metric,
  variants,
}: {
  metric: HealthMetric;
  variants: Variants;
}): React.ReactNode {
  return (
    <motion.div variants={variants}>
      <Card className="h-full">
        <CardContent>
          <Box className="flex items-start justify-between py-1">
            <Box>
              <Text className="text-xs text-content-tertiary uppercase tracking-wider font-medium">
                {metric.label}
              </Text>
              <Text className="text-2xl font-bold text-content mt-1">
                {metric.value}
              </Text>
              <Box className="flex items-center gap-1.5 mt-1.5">
                <Text className={`text-xs font-semibold ${getTrendColor(metric)}`}>
                  {getTrendArrow(metric)}
                </Text>
                <Text className="text-xs text-content-tertiary">
                  {metric.trendLabel}
                </Text>
              </Box>
            </Box>
            <Box className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Text className="text-sm font-bold text-violet-700">
                {metric.icon}
              </Text>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function WeeklyActivityChart({
  data,
}: {
  data: WeeklyBar[];
}): React.ReactNode {
  const maxValue = Math.max(...data.map((d) => d.sent + d.received));
  const barMaxHeight = 140; // px

  return (
    <Card>
      <CardHeader>
        <Box>
          <Text className="text-sm font-semibold text-content">
            Weekly Activity
          </Text>
          <Text className="text-xs text-content-tertiary mt-0.5">
            Emails sent and received this week
          </Text>
        </Box>
      </CardHeader>
      <CardContent>
        <Box className="flex items-center gap-4 mb-4">
          <Box className="flex items-center gap-1.5">
            <Box className="w-3 h-3 rounded-sm bg-violet-500" />
            <Text className="text-xs text-content-secondary">Sent</Text>
          </Box>
          <Box className="flex items-center gap-1.5">
            <Box className="w-3 h-3 rounded-sm bg-cyan-400" />
            <Text className="text-xs text-content-secondary">Received</Text>
          </Box>
        </Box>
        <Box className="flex items-end justify-between gap-2" style={{ height: `${barMaxHeight + 24}px` }}>
          {data.map((bar) => {
            const totalHeight =
              maxValue > 0
                ? ((bar.sent + bar.received) / maxValue) * barMaxHeight
                : 0;
            const sentHeight =
              maxValue > 0 ? (bar.sent / maxValue) * barMaxHeight : 0;
            const receivedHeight = totalHeight - sentHeight;

            return (
              <Box key={bar.day} className="flex flex-col items-center flex-1">
                <Box
                  className="w-full flex flex-col-reverse rounded-t-md overflow-hidden"
                  style={{ height: `${totalHeight}px` }}
                >
                  <Box
                    className="w-full bg-violet-500 transition-all duration-500"
                    style={{ height: `${sentHeight}px` }}
                  />
                  <Box
                    className="w-full bg-cyan-400 transition-all duration-500"
                    style={{ height: `${receivedHeight}px` }}
                  />
                </Box>
                <Text className="text-xs text-content-tertiary mt-2">
                  {bar.day}
                </Text>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

function BusiestHoursHeatmap({
  data,
}: {
  data: HeatmapCell[];
}): React.ReactNode {
  return (
    <Card>
      <CardHeader>
        <Box>
          <Text className="text-sm font-semibold text-content">
            Busiest Hours
          </Text>
          <Text className="text-xs text-content-tertiary mt-0.5">
            When your email activity peaks throughout the week
          </Text>
        </Box>
      </CardHeader>
      <CardContent>
        <Box className="overflow-x-auto">
          <Box className="min-w-[600px]">
            {/* Hour labels */}
            <Box className="flex ml-10 mb-1">
              {HOUR_LABELS.map((label, i) => (
                <Box key={i} className="flex-1 text-center">
                  <Text className="text-[10px] text-content-tertiary">
                    {label}
                  </Text>
                </Box>
              ))}
            </Box>

            {/* Grid rows */}
            {DAY_LABELS.map((day, dayIdx) => (
              <Box key={day} className="flex items-center gap-1 mb-0.5">
                <Box className="w-9 text-right pr-1">
                  <Text className="text-[10px] text-content-tertiary font-medium">
                    {day}
                  </Text>
                </Box>
                <Box className="flex flex-1 gap-0.5">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const cell = data.find(
                      (c) => c.hour === hour && c.day === dayIdx,
                    );
                    const intensity = cell?.intensity ?? 0;
                    return (
                      <Box
                        key={hour}
                        className={`flex-1 aspect-square rounded-sm ${getHeatmapColor(intensity)} transition-colors duration-200`}
                        title={`${day} ${hour}:00 - Intensity: ${intensity}/4`}
                      />
                    );
                  })}
                </Box>
              </Box>
            ))}

            {/* Legend */}
            <Box className="flex items-center justify-end gap-1 mt-3 mr-1">
              <Text className="text-[10px] text-content-tertiary mr-1">Less</Text>
              {[0, 1, 2, 3, 4].map((level) => (
                <Box
                  key={level}
                  className={`w-3 h-3 rounded-sm ${getHeatmapColor(level)}`}
                />
              ))}
              <Text className="text-[10px] text-content-tertiary ml-1">More</Text>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function AchievementBadge({
  achievement,
  variants,
}: {
  achievement: Achievement;
  variants: Variants;
}): React.ReactNode {
  const isLocked = achievement.earnedAt === null;

  return (
    <motion.div variants={variants}>
      <Card
        className={`h-full transition-opacity ${isLocked ? "opacity-50" : "opacity-100"}`}
      >
        <CardContent>
          <Box className="flex items-start gap-3 py-1">
            <Box
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                isLocked
                  ? "bg-gray-100 text-gray-400"
                  : "bg-violet-100 text-violet-700"
              }`}
            >
              <Text className="text-base">{achievement.icon}</Text>
            </Box>
            <Box className="min-w-0">
              <Text
                className={`text-sm font-semibold ${
                  isLocked ? "text-content-tertiary" : "text-content"
                }`}
              >
                {achievement.title}
              </Text>
              <Text className="text-xs text-content-tertiary mt-0.5">
                {achievement.description}
              </Text>
              {achievement.earnedAt ? (
                <Text className="text-[10px] text-content-tertiary mt-1">
                  Earned{" "}
                  {new Date(achievement.earnedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              ) : (
                <Text className="text-[10px] text-content-tertiary mt-1 italic">
                  Not yet earned
                </Text>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function HealthPage(): React.ReactNode {
  const reduced = useAlecRaeReducedMotion();
  const itemVariants = withReducedMotion(fadeInUp, reduced);

  return (
    <PageLayout
      title="Email Health"
      description="Your email habits, visualized. Track your productivity."
    >
      {/* Health Score Circle */}
      <motion.div
        className="flex justify-center mb-10"
        variants={itemVariants}
        initial="initial"
        animate="animate"
      >
        <HealthScoreCircle score={HEALTH_SCORE} label={HEALTH_LABEL} />
      </motion.div>

      {/* Metrics Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={staggerSlow}
        initial="initial"
        animate="animate"
      >
        {METRICS.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            variants={itemVariants}
          />
        ))}
      </motion.div>

      {/* Charts Row */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        variants={staggerSlow}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={itemVariants}>
          <WeeklyActivityChart data={WEEKLY_DATA} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <BusiestHoursHeatmap data={HEATMAP_DATA} />
        </motion.div>
      </motion.div>

      {/* Achievements */}
      <motion.div variants={itemVariants} initial="initial" animate="animate">
        <Box className="mb-4">
          <Text className="text-lg font-semibold text-content">
            Achievements
          </Text>
          <Text className="text-sm text-content-tertiary mt-0.5">
            Track your email productivity milestones
          </Text>
        </Box>
      </motion.div>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={staggerSlow}
        initial="initial"
        animate="animate"
      >
        {ACHIEVEMENTS.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            variants={itemVariants}
          />
        ))}
      </motion.div>
    </PageLayout>
  );
}
