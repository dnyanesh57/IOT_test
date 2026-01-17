'use client';

import { Card, CardContent, CardHeader, CardTitle, MetricPill } from "@cmm/ui";
import { useMemo } from "react";
import { useTimeCompare } from "../../components/time-compare-context";

const RELEASES = [
  { version: "v2.4.1", channel: "stable", cohort: "All", promoted: "2025-10-29", status: "Healthy" },
  { version: "v2.5.0-rc1", channel: "canary", cohort: "Tower A PT", promoted: "2025-10-30", status: "Monitoring" },
  { version: "v2.3.5", channel: "archive", cohort: "Legacy", promoted: "2025-09-18", status: "Retired" },
];

const HEALTH_STYLE: Record<string, string> = {
  Healthy: "bg-emerald-500/20 text-emerald-300",
  Monitoring: "bg-amber-500/20 text-amber-300",
  Retired: "bg-slate-800/70 text-slate-300",
};

export default function OTAPage() {
  const { factor } = useTimeCompare();

  const stats = useMemo(() => {
    const adoption = Math.round(92 * factor);
    return {
      active: RELEASES.filter((r) => r.channel !== "archive").length,
      adoption,
      rollbackReady: 1,
    };
  }, [factor]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-slate-900/60">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>OTA Releases</CardTitle>
            <p className="text-xs text-slate-400">
              Manage firmware cohorts, rollout health, and rollback readiness for the device fleet.
            </p>
          </div>
          <div className="flex gap-2">
            <MetricPill value={`${stats.active}`} label="Active releases" variant="positive" />
            <MetricPill value={`${stats.adoption}%`} label="Adoption" variant="neutral" />
            <MetricPill value={`${stats.rollbackReady}`} label="Rollback ready" variant="warning" />
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Release matrix</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-4 py-2 text-left">Version</th>
                <th className="px-4 py-2 text-left">Channel</th>
                <th className="px-4 py-2 text-left">Cohort</th>
                <th className="px-4 py-2 text-left">Promoted</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {RELEASES.map((release) => (
                <tr key={release.version} className="hover:bg-slate-900/60">
                  <td className="px-4 py-3 font-semibold">{release.version}</td>
                  <td className="px-4 py-3 capitalize">{release.channel}</td>
                  <td className="px-4 py-3">{release.cohort}</td>
                  <td className="px-4 py-3 text-slate-300">{release.promoted}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${HEALTH_STYLE[release.status]}`}>
                      {release.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-900/60">
          <CardHeader>
            <CardTitle>Release notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>• v2.5.0 introduces OTA telemetry compression and maturity engine patch.</p>
            <p>• Canary cohort limited to 20 devices with automatic rollback triggers.</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/60">
          <CardHeader>
            <CardTitle>Health checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>• Heartbeat success rate: 99.3% (past 24h).</p>
            <p>• Diagnostic requests queued for 3 devices post-update.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
