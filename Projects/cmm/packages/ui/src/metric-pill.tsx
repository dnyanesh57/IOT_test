"use client";

import React from "react";
import { kpiColors } from "./tokens";

type Variant = "positive" | "warning" | "negative" | "neutral";

const variantClasses: Record<Variant, string> = {
  positive: kpiColors.positive,
  warning: kpiColors.warning,
  negative: kpiColors.negative,
  neutral: "bg-slate-700/40 text-slate-200",
};

export function MetricPill({
  value,
  label,
  variant = "neutral",
  className = "",
}: {
  value: string;
  label: string;
  variant?: Variant;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${variantClasses[variant]} ${className}`}
    >
      <span className="text-sm font-semibold">{value}</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
}

