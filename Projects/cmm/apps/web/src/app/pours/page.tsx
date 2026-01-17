'use client';

import { Card, CardContent, CardHeader, CardTitle, MetricPill } from "@cmm/ui";
import { useMemo } from "react";
import { useTimeCompare } from "../../components/time-compare-context";
import { useApiData } from "../../hooks/use-api-data";

type PourStatus = "planning" | "inProgress" | "curing";

interface PourItem {
  id: string;
  location: string;
  mix: string;
  progress: number;
  eta: string;
  status: PourStatus;
}

interface PoursResponse {
  pours: PourItem[];
}

const STATUS_LABEL: Record<PourStatus, string> = {
  planning: "Planning",
  inProgress: "In Progress",
  curing: "Curing",
};

export default function PoursPage() {
  const { factor } = useTimeCompare();
  const { data, isLoading, isError } = useApiData<PoursResponse>("/api/pours");
  const pours = data?.pours ?? [];

  const stats = useMemo(() => {
    const active = pours.filter((p) => p.status !== "planning").length;
    const curing = pours.filter((p) => p.status === "curing").length;
    const avgProgress = pours
      .filter((p) => p.status !== "planning")
      .reduce((sum, item) => sum + item.progress, 0);
    const avg = active ? avgProgress / active : 0;
    return {
      active,
      curing,
      avgProgress: avg.toFixed(1),
    };
  }, [pours]);

  const columns: Record<PourStatus, PourItem[]> = useMemo(
    () => ({
      planning: pours.filter((item) => item.status === "planning"),
      inProgress: pours.filter((item) => item.status === "inProgress"),
      curing: pours.filter((item) => item.status === "curing"),
    }),
    [pours],
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-slate-900/60">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Pour Management</CardTitle>
            <p className="text-xs text-slate-400">Live backlog and curing state sourced from real-time telemetry.</p>
          </div>
          <div className="flex gap-2">
            <MetricPill value={`${stats.active}`} label="Active pours" variant="positive" />
            <MetricPill value={`${stats.curing}`} label="Curing" variant="neutral" />
            <MetricPill value={`${stats.avgProgress}%`} label="Avg progress" variant="warning" />
          </div>
          {isLoading && <p className="text-xs text-slate-500">Loading pours…</p>}
          {isError && <p className="text-xs text-rose-400">Unable to load pours.</p>}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>List View</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="px-4 py-2 text-left">Pour</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Mix</th>
                <th className="px-4 py-2 text-left">Progress</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">ETA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {pours.map((pour) => (
                <tr key={pour.id} className="hover:bg-slate-900/60">
                  <td className="px-4 py-3 font-semibold">{pour.id}</td>
                  <td className="px-4 py-3">{pour.location}</td>
                  <td className="px-4 py-3">{pour.mix}</td>
                  <td className="px-4 py-3">{Math.round(pour.progress * factor)}%</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        pour.status === "curing"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : pour.status === "inProgress"
                          ? "bg-cyan-500/20 text-cyan-200"
                          : "bg-slate-800/50 text-slate-300"
                      }`}
                    >
                      {STATUS_LABEL[pour.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{pour.eta}</td>
                </tr>
              ))}
              {pours.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-xs text-slate-500">
                    {isLoading ? "Loading pours…" : "No pours available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {(["planning", "inProgress", "curing"] as const).map((status) => (
          <Card key={status} className="bg-slate-900/60">
            <CardHeader>
              <CardTitle>{STATUS_LABEL[status]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {columns[status].map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-800/70 bg-slate-950/70 p-3">
                  <p className="text-sm font-semibold text-slate-100">{item.id}</p>
                  <p className="text-xs text-slate-400">{item.location}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
                    <span>{item.mix}</span>
                    <span>{status === "planning" ? item.eta : `${Math.round(item.progress * factor)}%`}</span>
                  </div>
                </div>
              ))}
              {columns[status].length === 0 && (
                <div className="rounded-xl border border-slate-800/70 bg-slate-950/70 p-3 text-xs text-slate-400">
                  No items assigned.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

