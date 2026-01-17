'use client';

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, MetricPill, StatCard } from "@cmm/ui";
import { useMemo } from "react";
import { useTimeCompare } from "../components/time-compare-context";
import { useApiData } from "../hooks/use-api-data";

interface DashboardResponse {
  stats: {
    devices: number;
    maturityChecks: number;
    healthScore: number;
    alertsResolved: number;
    avgTemperature: number;
    deltaPositive: number;
  };
  timeline: Array<{ time: string; temperature: number; status: string }>;
}

export default function Home() {
  const { factor } = useTimeCompare();
  const { data, isLoading, isError } = useApiData<DashboardResponse>("/api/dashboard");

  const stats = data?.stats;
  const adjustedStats = useMemo(() => {
    if (!stats) {
      return [
        { title: "Active Devices", value: "---" },
        { title: "Daily Maturity Checks", value: "---" },
        { title: "Avg. Health Score", value: "---" },
        { title: "Alerts Resolved", value: "---" },
      ];
    }
    return [
      { title: "Active Devices", value: stats.devices.toString() },
      { title: "Daily Maturity Checks", value: stats.maturityChecks.toLocaleString() },
      { title: "Avg. Health Score", value: `${stats.healthScore.toFixed(1)}%` },
      { title: "Alerts Resolved", value: stats.alertsResolved.toString() },
    ];
  }, [stats]);

  const events = data?.timeline ?? [];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-cyan-600/20 via-blue-700/10 to-slate-900/40">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">CMM</p>
          <h1 className="mt-3 text-3xl font-semibold">Maturity Meter Platform</h1>
          <p className="mt-2 text-slate-300">
            Real-time maturity insight across sensors, pours, and analytics streams.
          </p>
          <div className="mt-4 flex gap-3 text-sm text-slate-200">
            <Link className="rounded-full border border-white/20 px-3 py-1" href="/timeline">
              Timeline
            </Link>
            <Link className="rounded-full border border-white/20 px-3 py-1" href="/analytics">
              Analytics
            </Link>
            <a className="rounded-full border border-white/20 px-3 py-1" href="http://localhost:8000/docs">
              API Docs
            </a>
          </div>
        </CardHeader>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-slate-100">Today&apos;s Snapshot</h2>
          <MetricPill value={`${Math.round(factor * 100)}%`} label="Relative gain" variant="neutral" />
        </div>
        {isLoading && <p className="text-xs text-slate-500">Loading dashboard metrics…</p>}
        {isError && <p className="text-xs text-rose-400">Unable to load dashboard data.</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adjustedStats.map((stat) => (
            <StatCard key={stat.title} title={stat.title} value={stat.value} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Live Timeline</CardTitle>
              <p className="text-xs text-slate-400">Key events computed from the latest telemetry feed.</p>
            </div>
            <Link href="/timeline" className="text-sm text-cyan-300 hover:text-cyan-200">
              View timeline →
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {events.map((item) => (
                <li key={item.time} className="flex gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-500 text-sm font-semibold text-cyan-200">
                    {new Date(item.time).toLocaleTimeString()}
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-white">Temperature update</h3>
                    <p className="text-sm text-slate-400">
                      {item.temperature.toFixed(2)} °C · status {item.status}
                    </p>
                  </div>
                </li>
              ))}
              {events.length === 0 && <p className="text-xs text-slate-500">Awaiting telemetry…</p>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Average Temperature</p>
                  <p className="text-xs text-slate-400">Across recent telemetry samples</p>
                </div>
                <span className="text-sm font-semibold text-cyan-200">{stats?.avgTemperature.toFixed(2) ?? "--"} °C</span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Positive ramp events</p>
                  <p className="text-xs text-slate-400">Past hour</p>
                </div>
                <span className="text-sm font-semibold text-emerald-300">{stats?.deltaPositive ?? "--"}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase text-slate-400">Command Palette</p>
            <p className="mt-2 text-sm text-slate-200">
              Press <span className="rounded bg-slate-800 px-1 py-0.5 text-xs text-cyan-200">⌘</span> + <span className="rounded bg-slate-800 px-1 py-0.5 text-xs text-cyan-200">K</span> (or Ctrl + K)
              for quick navigation actions.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase text-slate-400">API Explorer</p>
            <p className="mt-2 text-sm text-slate-200">
              The FastAPI backend ships with interactive docs at {""}
              <a href="http://localhost:8000/docs" className="text-cyan-300 hover:text-cyan-200">
                localhost:8000/docs
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
