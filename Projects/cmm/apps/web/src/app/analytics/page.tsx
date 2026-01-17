'use client';

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, MetricPill } from "@cmm/ui";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTimeCompare } from "../../components/time-compare-context";
import { useApiData } from "../../hooks/use-api-data";

type TabKey = "trends" | "cohorts" | "control" | "insights";

interface AnalyticsResponse {
  trends: Array<{ label: string; current: number; previous: number; previousPrevious: number; cooldown: number }>;
  cohorts: Array<{ mix: string; current: number; previous: number; baseline: number }>;
  control: Array<{ batch: number; xbar: number; r: number }>;
  insights: Array<{ title: string; detail: string }>;
}

export default function AnalyticsPage() {
  const { factor } = useTimeCompare();
  const [tab, setTab] = useState<TabKey>("trends");
  const { data, isLoading, isError } = useApiData<AnalyticsResponse>("/api/analytics");

  const trendData = data?.trends ?? [];
  const cohortData = useMemo(
    () => (data?.cohorts ?? []).map((item) => ({ ...item, current: item.current * factor })),
    [data?.cohorts, factor],
  );
  const controlData = useMemo(
    () => (data?.control ?? []).map((item) => ({ ...item, xbar: item.xbar * factor })),
    [data?.control, factor],
  );
  const insights = data?.insights ?? [];

  const headerMetrics = useMemo(() => {
    if (trendData.length === 0) {
      return { avgMaturity: "--", delta: "--", cooldown: "--" };
    }
    const avgMaturity = trendData.reduce((sum, item) => sum + item.current, 0) / trendData.length;
    const delta = ((avgMaturity / Math.max(trendData[0].current, 1) - 1) * 100).toFixed(1);
    const cooldown = Math.round(
      trendData.reduce((sum, item) => sum + item.cooldown, 0) / Math.max(trendData.length, 1),
    );
    return {
      avgMaturity: avgMaturity.toFixed(0),
      delta,
      cooldown: `${cooldown} h`,
    };
  }, [trendData]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-fuchsia-500/10 via-cyan-500/10 to-slate-900/50">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Analytics</CardTitle>
            <p className="text-xs text-slate-400">
              Trend lines, cohort comparisons, SPC tracking, and model-based insights calculated from live telemetry.
            </p>
          </div>
          <div className="flex gap-2">
            <MetricPill value={`${headerMetrics.avgMaturity} °C·h`} label="Avg maturity (7d)" variant="positive" />
            <MetricPill value={`${headerMetrics.delta}%`} label="Δ vs baseline" variant="neutral" />
            <MetricPill value={`${headerMetrics.cooldown}`} label="Avg cooldown" variant="warning" />
          </div>
          {isLoading && <p className="text-xs text-slate-500">Loading analytics…</p>}
          {isError && <p className="text-xs text-rose-400">Unable to load analytics data.</p>}
        </CardHeader>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(["trends", "cohorts", "control", "insights"] as TabKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === key ? "bg-cyan-500/20 text-cyan-200" : "bg-slate-900/50 text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {tab === "trends" && (
        <Card>
          <CardHeader>
            <CardTitle>Trends – Multi-series maturity</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid stroke="#1f2937" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ background: "#0f172a", borderRadius: 16, border: "1px solid #1e293b" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Legend />
                <Line type="monotone" dataKey="current" stroke="#22d3ee" strokeWidth={2} />
                <Line type="monotone" dataKey="previous" stroke="#facc15" strokeWidth={2} />
                <Line type="monotone" dataKey="previousPrevious" stroke="#f472b6" strokeDasharray="4 6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {tab === "cohorts" && (
        <Card>
          <CardHeader>
            <CardTitle>Cohorts – Mix performance comparison</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cohortData}>
                <CartesianGrid stroke="#1f2937" />
                <XAxis dataKey="mix" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ background: "#0f172a", borderRadius: 16, border: "1px solid #1e293b" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Legend />
                <Bar dataKey="current" fill="#22d3ee" radius={[10, 10, 10, 10]} />
                <Bar dataKey="previous" fill="#facc15" radius={[10, 10, 10, 10]} />
                <Bar dataKey="baseline" fill="#f472b6" radius={[10, 10, 10, 10]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {tab === "control" && (
        <Card>
          <CardHeader>
            <CardTitle>Control – X̄ / R chart</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={controlData}>
                <CartesianGrid stroke="#1f2937" />
                <XAxis dataKey="batch" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ background: "#0f172a", borderRadius: 16, border: "1px solid #1e293b" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Legend />
                <Area type="monotone" dataKey="xbar" stroke="#22d3ee" fill="#22d3ee33" strokeWidth={2} />
                <Area type="monotone" dataKey="r" stroke="#facc15" fill="#facc1533" strokeDasharray="6 4" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {tab === "insights" && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight) => (
            <Card key={insight.title}>
              <CardHeader>
                <CardTitle>{insight.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">{insight.detail}</CardContent>
            </Card>
          ))}
          {insights.length === 0 && <p className="text-xs text-slate-500">No insights available.</p>}
        </div>
      )}
    </div>
  );
}

