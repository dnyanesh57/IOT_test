'use client';

import { Card, CardContent, CardHeader, CardTitle, MetricPill, StatCard } from "@cmm/ui";
import { useMemo } from "react";
import { useTimeCompare } from "../../components/time-compare-context";
import { useApiData } from "../../hooks/use-api-data";

interface ElementMetric {
  name: string;
  active: number;
  avgTemp: number;
  maturity: number;
  stripEta: string;
  compliance: number;
}

interface ElementsResponse {
  elements: ElementMetric[];
}

export default function ElementsPage() {
  const { factor } = useTimeCompare();
  const { data, isLoading, isError } = useApiData<ElementsResponse>("/api/elements");
  const elements = data?.elements ?? [];

  const summary = useMemo(() => {
    const activeTotals = elements.reduce((sum, element) => sum + element.active, 0);
    const avgCompliance = elements.length
      ? elements.reduce((sum, element) => sum + element.compliance, 0) / elements.length
      : 0;
    return { activeTotals, avgCompliance };
  }, [elements]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-slate-900/50">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Element Overview</CardTitle>
            <p className="text-xs text-slate-400">
              Element-level KPIs sourced from the latest field telemetry.
            </p>
          </div>
          <div className="flex gap-2">
            <MetricPill value={`${summary.activeTotals}`} label="Active Elements" variant="positive" />
            <MetricPill
              value={`${(summary.avgCompliance * 100).toFixed(1)}%`}
              label="Compliance"
              variant="neutral"
            />
          </div>
          {isLoading && <p className="text-xs text-slate-500">Loading elements…</p>}
          {isError && <p className="text-xs text-rose-400">Unable to load element metrics.</p>}
        </CardHeader>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {elements.map((element) => (
          <Card key={element.name}>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>{element.name}</CardTitle>
              <MetricPill
                value={`${(element.compliance * 100).toFixed(1)}%`}
                label="Spec compliance"
                variant={element.compliance > 0.96 ? "positive" : "warning"}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
                  <p className="text-[11px] uppercase tracking-widest text-slate-500">Active pours</p>
                  <p className="text-lg font-semibold text-slate-100">{element.active}</p>
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
                  <p className="text-[11px] uppercase tracking-widest text-slate-500">Avg Temp</p>
                  <p className="text-lg font-semibold text-slate-100">{element.avgTemp.toFixed(1)} °C</p>
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
                  <p className="text-[11px] uppercase tracking-widest text-slate-500">Maturity window</p>
                  <p className="text-lg font-semibold text-slate-100">{element.maturity} °C·h</p>
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
                  <p className="text-[11px] uppercase tracking-widest text-slate-500">Strip ETA</p>
                  <p className="text-lg font-semibold text-slate-100">{element.stripEta}</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3 text-xs text-slate-400">
                <p>
                  Last alert: <span className="text-slate-200">None</span>
                </p>
                <p>
                  Calibration due: <span className="text-slate-200">+{Math.round(48 / factor)} h</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {elements.length === 0 && <p className="text-xs text-slate-500">Loading element metrics…</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Quiet hours overrides" value={`${Math.round(3 * factor)} scheduled`} />
        <StatCard title="Cooling blankets engaged" value={`${Math.round(2 * factor)} of 7 elements`} />
        <StatCard title="Performance trend (7d)" value={`+${(6.8 * factor).toFixed(1)}% maturity gain`} />
      </div>
    </div>
  );
}
