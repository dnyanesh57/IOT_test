"use client";

import React from "react";
import { palette } from "./tokens";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-800/80 ${palette.background.panel} shadow-lg shadow-slate-900/40 ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: CardProps) {
  return <div className={`border-b border-slate-800/60 px-5 py-3 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: CardProps) {
  return <h3 className={`text-sm font-semibold tracking-wide text-slate-200 ${className}`} {...props} />;
}

export function CardContent({ className = "", ...props }: CardProps) {
  return <div className={`px-5 py-4 ${className}`} {...props} />;
}

