'use client';

import { Card, CardContent, CardHeader, CardTitle, MetricPill } from "@cmm/ui";
import { useMemo } from "react";
import { useTimeCompare } from "../../components/time-compare-context";

const CAL_RUNS = [
  {
    id: "CAL-2025-21",
    mix: "PT-65",
    lab: "Lab North",
    date: "2025-10-22",
    r: 0.997,
    method: "Arrhenius",
  },
  {
    id: "CAL-2025-18",
    mix: "Mass-46",
    lab: "Lab Central",
    date: "2025-10-12",
    r: 0.992,
    method: "Nurse-Saul",
  },
  {
    id: "CAL-2025-16",
    mix: "Core-52",
    lab: "Lab Central",
    date: "2025-09-29",
    r: 0.989,
    method: "Arrhenius",
  },
];

const CERTIFICATES = [
  {
    id: "CERT-PT-65-v3",
    calibration: "CAL-2025-21",
    version: 3,
    signer: "QA Ops",
    status: "Active",
  },
  {
    id: "CERT-MASS-46-v2",
    calibration: "CAL-2025-18",
    version: 2,
    signer: "QA Ops",
    status: "Active",
  },
  {
    id: "CERT-CORE-52-v1",
    calibration: "CAL-2025-16",
    version: 1,
    signer: "QA Ops",
    status: "Revoked - superseded",
  },
];

export default function CalibrationPage() {
  const { factor } = useTimeCompare();

  const stats = useMemo(() => {
    const avgR = CAL_RUNS.reduce((sum, item) => sum + item.r * factor, 0) / CAL_RUNS.length;
    return {
      pending: 2,
      certificates: CERTIFICATES.length,
      avgR: avgR.toFixed(3),
    };
  }, [factor]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-slate-900/60">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Calibration & Certificates</CardTitle>
            <p className="text-xs text-slate-400">
              Curve management, validation runs, and certificate vault for audit-ready data.
            </p>
          </div>
          <div className="flex gap-2">
            <MetricPill value={`${stats.pending}`} label="Runs pending" variant="warning" />
            <MetricPill value={`${stats.certificates}`} label="Certificates" variant="neutral" />
            <MetricPill value={`R² ${stats.avgR}`} label="Average fit" variant="positive" />
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent calibration runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-200">
          {CAL_RUNS.map((run) => (
            <div key={run.id} className="rounded-xl border border-slate-800/70 bg-slate-900/50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{run.id}</p>
                  <p className="text-xs text-slate-400">
                    {run.mix} · {run.method}
                  </p>
                </div>
                <span className="rounded-full bg-slate-800/70 px-3 py-1 text-xs text-slate-300">
                  R² {run.r.toFixed(3)}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                <p>
                  Lab: <span className="text-slate-200">{run.lab}</span>
                </p>
                <p>
                  Completed: <span className="text-slate-200">{run.date}</span>
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certificate vault</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-4 py-2 text-left">Certificate</th>
                <th className="px-4 py-2 text-left">Calibration</th>
                <th className="px-4 py-2 text-left">Version</th>
                <th className="px-4 py-2 text-left">Signer</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {CERTIFICATES.map((cert) => (
                <tr key={cert.id} className="hover:bg-slate-900/60">
                  <td className="px-4 py-3 font-semibold">{cert.id}</td>
                  <td className="px-4 py-3">{cert.calibration}</td>
                  <td className="px-4 py-3">{cert.version}</td>
                  <td className="px-4 py-3">{cert.signer}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        cert.status.includes("Revoked")
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {cert.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
