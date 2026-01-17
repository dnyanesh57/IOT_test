'use client';

import { Card, CardContent, CardHeader, CardTitle, MetricPill } from "@cmm/ui";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApiData } from "../../hooks/use-api-data";
import { useMemo } from "react";

interface MassConcreteResponse {
  profile: Array<{ hour: number; core: number; surface: number }>;
  gradients: Array<{ hour: number; delta: number }>;
  overview: { peak: number; gradient: number; cooldown: number };
}

export default function MassConcretePage() {
  const { data, isLoading, isError } = useApiData<MassConcreteResponse>("/api/mass-concrete");
  const profile = data?.profile ?? [];
  const gradients = data?.gradients ?? [];
  const overview = data?.overview;

  const overviewDisplay = useMemo(() => {
    if (!overview) {
      return { peak: "--", gradient: "--", cooldown: "--" };
    }
    return {
      peak: overview.peak.toFixed(1),
      gradient: overview.gradient.toFixed(1),
      cooldown: `${overview.cooldown} h`,
    };
  }, [overview]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-cyan-600/10 via-blue-600/10 to-slate-900/60">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Mass Concrete Overview</CardTitle>
            <p className="text-xs text-slate-400">
              Thermal control plan with live ΔT tracking and hydration projections derived from field telemetry.
            </p>
          </div>
          <div className="flex gap-2">
            <MetricPill value={`${overviewDisplay.peak} °C`} label="Peak core" variant="warning" />
            <MetricPill value={`${overviewDisplay.gradient} °C`} label="ΔT max" variant="positive" />
            <MetricPill value={overviewDisplay.cooldown} label="Cooldown target" variant="neutral" />
          </div>
          {isLoading && <p className="text-xs text-slate-500">Loading mass concrete data…</p>}
          {isError && <p className="text-xs text-rose-400">Unable to load mass concrete data.</p>}
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Thermal Plan</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profile}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="4 8" />
                <XAxis dataKey="hour" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ background: "#0f172a", borderRadius: 16, border: "1px solid #1e293b" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Legend />
                <Line type="monotone" dataKey="core" stroke="#22d3ee" strokeWidth={2} />
                <Line type="monotone" dataKey="surface" stroke="#facc15" strokeWidth={2} />
                <ReferenceArea x1={10} x2={20} fill="#38bdf8" fillOpacity={0.08} strokeOpacity={0} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <p className="text-xs uppercase tracking-widest text-slate-500">Cooling strategy</p>
              <p>Active chilled water loop — recalculates against live ΔT.</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <p className="text-xs uppercase tracking-widest text-slate-500">Insulation state</p>
              <p>Top blankets staged; removal triggered when ΔT &lt; {overview?.gradient ? (overview.gradient - 2).toFixed(1) : 17} °C.</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <p className="text-xs uppercase tracking-widest text-slate-500">Alert window</p>
              <p>Notify if ΔT &gt; 20 °C for two consecutive readings.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ΔT & Gradient Explorer</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={gradients}>
                <CartesianGrid stroke="#1f2937" />
                <XAxis dataKey="hour" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ background: "#0f172a", borderRadius: 16, border: "1px solid #1e293b" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <defs>
                  <linearGradient id="deltaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="delta" stroke="#f472b6" fill="url(#deltaFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
              <p className="text-xs uppercase tracking-widest text-slate-500">Forecast</p>
              <p>Cooling sleeves keep ΔT under {overview ? (overview.gradient - 1).toFixed(1) : "--"} °C within next 4 hours.</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
              <p className="text-xs uppercase tracking-widest text-slate-500">Action</p>
              <p>Pause additional blanket removal until core &lt; {overview ? (overview.peak - 6).toFixed(1) : "--"} °C.</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
              <p className="text-xs uppercase tracking-widest text-slate-500">Notifications</p>
              <p>Escalation path ready if gradient exceeds 19 °C.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
