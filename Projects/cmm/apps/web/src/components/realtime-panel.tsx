'use client';

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@cmm/ui";

interface RealtimeRecord {
  sequence: string;
  timestamp: string;
  temperature: number;
  status: string;
  raw: string;
}

interface RealtimeResponse {
  source: string;
  fetchedAt: string;
  records: RealtimeRecord[];
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function RealTimePanel({ className = "" }: { className?: string }) {
  const [records, setRecords] = useState<RealtimeRecord[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/realtime", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Remote error ${res.status}`);
        }
        const data: RealtimeResponse = await res.json();
        if (canceled) return;
        setRecords(data.records.slice(-5).reverse());
        setUpdatedAt(new Date(data.fetchedAt));
        setError(null);
      } catch (e) {
        if (!canceled) {
          setError("Unable to refresh data");
        }
      }
    };

    load();
    const interval = setInterval(load, 15000);
    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, []);

  const latest = useMemo(() => records[0], [records]);

  return (
    <Card className={`bg-slate-900/70 ${className}`}>
      <CardHeader>
        <CardTitle>Real-time feed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {error && <p className="text-rose-300">{error}</p>}
        {latest ? (
          <div className="rounded-xl border border-slate-800/70 bg-slate-950/70 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Latest temperature</p>
            <p className="text-lg font-semibold text-slate-100">{latest.temperature.toFixed(2)} °C</p>
            <p className="text-xs text-slate-500">Seq {latest.sequence} · {formatTimestamp(latest.timestamp)}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Waiting for data…</p>
        )}

        <div className="space-y-2 text-xs">
          {records.map((record) => (
            <div key={record.raw} className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-950/60 px-3 py-2">
              <div className="text-slate-300">
                <span className="font-semibold">{record.temperature.toFixed(2)} °C</span>
                <span className="ml-2 text-slate-500">{formatTimestamp(record.timestamp)}</span>
              </div>
              <span className="text-slate-500">status {record.status}</span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-500">
          {updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : "Awaiting first update"}
        </p>
      </CardContent>
    </Card>
  );
}
