'use client';

import { Card, CardContent, CardHeader, CardTitle, MetricPill } from "@cmm/ui";
import { useMemo } from "react";
import { useTimeCompare } from "../../components/time-compare-context";

const REPORTS = [
  {
    id: "RPT-PT-432",
    type: "PT Strip",
    pour: "CMM-432",
    generated: "2025-10-30 05:40",
    status: "Signed",
  },
  {
    id: "RPT-DLY-435",
    type: "Daily Summary",
    pour: "CMM-435",
    generated: "2025-10-30 04:15",
    status: "Ready",
  },
  {
    id: "RPT-CUBE-221",
    type: "Cube Equivalence",
    pour: "Batch Lab",
    generated: "2025-10-29 21:05",
    status: "Delivered",
  },
  {
    id: "RPT-MASS-46",
    type: "Mass Concrete",
    pour: "Block 46",
    generated: "2025-10-29 18:10",
    status: "Pending Approval",
  },
];

const STATUS_STYLE: Record<string, string> = {
  Signed: "bg-emerald-500/20 text-emerald-300",
  Ready: "bg-cyan-500/20 text-cyan-200",
  Delivered: "bg-blue-500/20 text-blue-200",
  "Pending Approval": "bg-amber-500/20 text-amber-300",
};

export default function ReportsPage() {
  const { factor } = useTimeCompare();

  const stats = useMemo(() => {
    const generated = Math.round(REPORTS.length * factor);
    const signed = REPORTS.filter((r) => r.status === "Signed").length;
    return { generated, signed };
  }, [factor]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-slate-900/60">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Reports</CardTitle>
            <p className="text-xs text-slate-400">
              Generate PDF, CSV, and signed HTML exports for pours, calibrations, and QA workflows.
            </p>
          </div>
          <div className="flex gap-2">
            <MetricPill value={`${stats.generated}`} label="Generated (24h)" variant="positive" />
            <MetricPill value={`${stats.signed}`} label="Signed" variant="neutral" />
            <MetricPill value="4 templates" label="Available" variant="warning" />
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent reports</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-4 py-2 text-left">Report</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Pour / Scope</th>
                <th className="px-4 py-2 text-left">Generated</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {REPORTS.map((report) => (
                <tr key={report.id} className="hover:bg-slate-900/60">
                  <td className="px-4 py-3 font-semibold">{report.id}</td>
                  <td className="px-4 py-3">{report.type}</td>
                  <td className="px-4 py-3">{report.pour}</td>
                  <td className="px-4 py-3 text-slate-300">{report.generated}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[report.status]}`}>
                      {report.status}
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
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>• PT Strip report v3 — uses maturity + Arrhenius forecasts.</p>
            <p>• Daily summary — includes time compare deltas automatically.</p>
            <p>• Mass concrete — ΔT charts embedded, exports to PDF + CSV bundle.</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/60">
          <CardHeader>
            <CardTitle>Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>• Email distribution groups synced (QA, Site Ops, Designers).</p>
            <p>• Signed HTML links valid for 14 days with watermark.</p>
            <p>• Webhooks available for downstream document control systems.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
