'use client';

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, MetricPill, StatCard } from "@cmm/ui";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTimeCompare } from "../../components/time-compare-context";
import { RealTimePanel } from "../../components/realtime-panel";
import { useApiData } from "../../hooks/use-api-data";

interface TimelineEvent {
  id: string;
  title: string;
  time: string;
  status: "green" | "amber" | "red";
  summary: string;
  sensorCount: number;
}

interface TimelineResponse {
  events: TimelineEvent[];
  chart: Array<{ time: string; temperature: number; previous: number; baseline: number }>;
}

const STATUS_LABEL: Record<TimelineEvent["status"], string> = {
  green: "Nominal",
  amber: "Watch",
  red: "Action",
};

export default function TimelinePage() {
  const { factor, factors } = useTimeCompare();
  const { data, isLoading, isError } = useApiData<TimelineResponse>("/api/timeline");
  const events = data?.events ?? [];
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const chartData = useMemo(
    () =>
      (data?.chart ?? []).map((point) => ({
        time: point.time,
        current: point.temperature,
        previous: point.previous * factors.previous,
        previousPrevious: point.baseline * factors.previousPrevious,
      })),
    [data?.chart, factors.previous, factors.previousPrevious],
  );

  const headline = useMemo(() => {
    if (chartData.length === 0) {
      return { avgTemp: "0.0", maturityGain: "0", stripEta: "--" };
    }
    const avg = chartData.reduce((sum, item) => sum + item.current, 0) / chartData.length;
    const forecast = avg * factor;
    return {
      avgTemp: forecast.toFixed(1),
      maturityGain: (forecast * 3.2).toFixed(0),
      stripEta: forecast > 30 ? "6h 20m" : "8h 05m",
    };
  }, [chartData, factor]);

  const currentEvent = useMemo(() => {
    if (selectedEvent) return selectedEvent;
    return events[0] ?? null;
  }, [selectedEvent, events]);

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Thermal Trend - Active Pours</CardTitle>
              <p className="text-xs text-slate-400">
                Multi-series overlay comparing current vs previous windows across in-situ sensors.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MetricPill value={`${headline.avgTemp} °C`} label="Avg Hydration" variant="positive" />
              <MetricPill value={`${headline.maturityGain} °C·h`} label="Gain / window" variant="neutral" />
            </div>
            {isLoading && <p className="text-xs text-slate-500">Loading thermal trend…</p>}
            {isError && <p className="text-xs text-rose-400">Unable to load timeline data.</p>}
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="currentFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="prevFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2937" strokeDasharray="4 8" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ background: "#0f172a", borderRadius: 16, border: "1px solid #1e293b" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Legend />
                <Area type="monotone" dataKey="current" stroke="#22d3ee" fill="url(#currentFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="previous" stroke="#facc15" fill="url(#prevFill)" strokeWidth={2} />
                <Area
                  type="monotone"
                  dataKey="previousPrevious"
                  stroke="#f472b6"
                  fillOpacity={0}
                  strokeDasharray="5 4"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-slate-900/50">
            <CardHeader>
              <CardTitle>Upcoming Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-300">
              <p>• Trigger maturity verification on pours undergoing accelerated ramps.</p>
              <p>• Coordinate calibration run for batch plant sensors flagged by drift.</p>
              <p>• Confirm quiet hours override for overnight mass placement.</p>
            </CardContent>
          </Card>
          <div className="grid gap-3">
            <StatCard title="Active Pours" value={`${Math.max(1, events.length)}`} />
            <StatCard title="Sensors Online" value={`${95 + Math.round(factor * 4)}%`} />
            <StatCard title="Alerts Past 24h" value={`${Math.round(factor * 6)} (dynamic)`} />
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Event Stream</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`flex w-full items-start justify-between rounded-2xl border border-transparent px-4 py-3 text-left transition hover:border-slate-700 ${
                  currentEvent?.id === event.id ? "bg-slate-900/70 border-slate-700" : "bg-slate-900/40"
                }`}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    {new Date(event.time).toLocaleTimeString()}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-100">{event.title}</p>
                  <p className="text-xs text-slate-400">{event.summary}</p>
                </div>
                <span
                  className={`mt-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    event.status === "green"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : event.status === "amber"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {STATUS_LABEL[event.status]}
                </span>
              </button>
            ))}
            {events.length === 0 && <p className="text-xs text-slate-500">Awaiting live events...</p>}
          </CardContent>
        </Card>
      </div>
      <aside className="space-y-4">
        <RealTimePanel />
        <Card>
          <CardHeader>
            <CardTitle>Inspector</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Selected</p>
              <h3 className="mt-1 text-base font-semibold text-slate-100">{currentEvent?.title ?? "—"}</h3>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Time</p>
              <p className="text-sm text-slate-100">
                {currentEvent ? new Date(currentEvent.time).toLocaleString() : "Select an event"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Summary</p>
              <p>{currentEvent?.summary ?? "Select an event from the stream to inspect details."}</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Sensors Impacted</p>
              <p>{currentEvent?.sensorCount ?? 0} channels</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Action register</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="rounded-xl border border-slate-800/70 bg-slate-900/50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Next PT review</p>
              <p className="text-slate-100">Supervisor check-in scheduled based on live trend variance.</p>
            </div>
            <div className="rounded-xl border border-slate-800/70 bg-slate-900/50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Calibration audit</p>
              <p>Upload certificate revisions for lab set within 18:00 using calibration module.</p>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
