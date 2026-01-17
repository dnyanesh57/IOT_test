'use client';

import { Card, CardContent, CardHeader, CardTitle, MetricPill } from "@cmm/ui";
import { useMemo } from "react";
import { useTimeCompare } from "../../components/time-compare-context";

const USERS = [
  { name: "Alex Rivera", role: "Admin", email: "alex@demo", status: "Active" },
  { name: "Morgan Lee", role: "Approver", email: "morgan@demo", status: "Active" },
  { name: "Jamie Chen", role: "Operator", email: "jamie@demo", status: "Pending Invite" },
  { name: "Taylor Singh", role: "Viewer", email: "taylor@demo", status: "Active" },
];

const FEATURE_FLAGS = [
  { key: "mass_concrete_module", description: "Enable mass concrete dashboards", enabled: true },
  { key: "ota_beta", description: "Access to OTA canary features", enabled: true },
  { key: "document_ai", description: "Document AI ingestion", enabled: false },
];

const LICENSE = {
  plan: "Enterprise",
  seats: 25,
  inUse: 18,
  expiry: "2026-05-01",
};

export default function AdminPage() {
  const { factor } = useTimeCompare();
  const seatsUsed = useMemo(() => Math.round(LICENSE.inUse * factor), [factor]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-slate-900/60">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Administration</CardTitle>
            <p className="text-xs text-slate-400">
              Manage tenants, roles, feature flags, and licensing from a single control surface.
            </p>
          </div>
          <div className="flex gap-2">
            <MetricPill value={LICENSE.plan} label="Plan" variant="neutral" />
            <MetricPill value={`${seatsUsed}/${LICENSE.seats}`} label="Seats" variant="positive" />
            <MetricPill value={LICENSE.expiry} label="Expiry" variant="warning" />
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users & Roles</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {USERS.map((user) => (
                <tr key={user.email} className="hover:bg-slate-900/60">
                  <td className="px-4 py-3 font-semibold">{user.name}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.status === "Active" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {user.status}
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
            <CardTitle>Feature Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-200">
            {FEATURE_FLAGS.map((flag) => (
              <div key={flag.key} className="rounded-xl border border-slate-800/70 bg-slate-950/70 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{flag.key}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      flag.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800/70 text-slate-300"
                    }`}
                  >
                    {flag.enabled ? "Enabled" : "Off"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{flag.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60">
          <CardHeader>
            <CardTitle>Governance Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>• Run audit log integrity check weekly (hash chain validation).</p>
            <p>• Review expiring access tokens and OAuth clients.</p>
            <p>• Export tenant data snapshot for compliance (S3 signed URL).</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
