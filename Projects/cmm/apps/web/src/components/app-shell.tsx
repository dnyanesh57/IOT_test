"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TimeCompareBar, type TimeCompareKey } from "@cmm/ui";
import { TimeCompareProvider, useTimeCompare } from "./time-compare-context";
import { queryClient } from "../lib/query-client";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Timeline", href: "/timeline" },
  { label: "Elements", href: "/elements" },
  { label: "Mass Concrete", href: "/mass-concrete" },
  { label: "Analytics", href: "/analytics" },
  { label: "Pours", href: "/pours" },
  { label: "Sensors", href: "/sensors" },
  { label: "Calibration", href: "/calibration" },
  { label: "Reports", href: "/reports" },
  { label: "OTA", href: "/ota" },
  { label: "Admin", href: "/admin" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TimeCompareProvider>
        <ShellContent>{children}</ShellContent>
      </TimeCompareProvider>
    </QueryClientProvider>
  );
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { options, selected, select } = useTimeCompare();

  const handleSelect = (key: TimeCompareKey) => {
    select(key);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <aside className="hidden w-60 flex-col border-r border-slate-800/80 bg-slate-950/80 px-4 py-6 lg:flex">
        <div className="mb-6 px-2">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">CMM</p>
          <h1 className="mt-2 text-lg font-semibold text-slate-100">Maturity Monitor</h1>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-cyan-500/20 text-cyan-200" : "text-slate-300 hover:bg-slate-900/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-xs text-slate-400">
          <p className="font-semibold text-slate-200">Staging Mode</p>
          <p>Demo data seeded for inspection.</p>
        </div>
      </aside>
      <main className="flex flex-1 flex-col">
        <header className="border-b border-slate-800/80 bg-slate-950/80 px-4 pb-4 pt-6 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-wide text-slate-100">Operations Control</h2>
              <p className="text-sm text-slate-400">
                Compare current performance against rolling windows across pours, elements, and analytics.
              </p>
            </div>
            <TimeCompareBar options={options} selected={selected} onSelect={handleSelect} />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-10 lg:py-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
