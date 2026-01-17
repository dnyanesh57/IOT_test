"use client";

import React from "react";

export type TimeCompareKey = "current" | "previous" | "previousPrevious";

export interface TimeCompareOption {
  key: TimeCompareKey;
  label: string;
  subtitle?: string;
  deltaLabel?: string;
}

interface TimeCompareBarProps {
  options: TimeCompareOption[];
  selected: TimeCompareKey;
  onSelect: (key: TimeCompareKey) => void;
  className?: string;
}

export function TimeCompareBar({ options, selected, onSelect, className = "" }: TimeCompareBarProps) {
  return (
    <nav
      className={`flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-2 shadow-md shadow-slate-900/40 ${className}`}
    >
      {options.map((option) => {
        const isActive = option.key === selected;
        return (
          <button
            key={option.key}
            onClick={() => onSelect(option.key)}
            className={`flex min-w-[140px] flex-1 flex-col rounded-xl px-4 py-2 text-left transition ${
              isActive
                ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/60"
                : "bg-slate-900/40 text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider">{option.label}</span>
            {option.subtitle && <span className="text-[11px] text-slate-400">{option.subtitle}</span>}
            {option.deltaLabel && (
              <span className={`text-xs font-medium ${isActive ? "text-emerald-300" : "text-slate-400"}`}>
                {option.deltaLabel}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

