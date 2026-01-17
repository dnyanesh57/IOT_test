"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { TimeCompareKey, TimeCompareOption } from "@cmm/ui";

const TimeCompareContext = createContext<TimeCompareContextValue | undefined>(undefined);

const DEFAULT_OPTIONS: TimeCompareOption[] = [
  {
    key: "current",
    label: "Current",
    subtitle: "Last 24 h",
    deltaLabel: "+4.2% vs prev",
  },
  {
    key: "previous",
    label: "Previous",
    subtitle: "24–48 h ago",
    deltaLabel: "-1.1% vs prev-prev",
  },
  {
    key: "previousPrevious",
    label: "Prev-Prev",
    subtitle: "48–72 h ago",
    deltaLabel: "+2.3% vs baseline",
  },
];

const RANGE_FACTORS: Record<TimeCompareKey, number> = {
  current: 1,
  previous: 0.94,
  previousPrevious: 0.88,
};

interface TimeCompareContextValue {
  options: TimeCompareOption[];
  selected: TimeCompareKey;
  select: (key: TimeCompareKey) => void;
  factor: number;
  factors: Record<TimeCompareKey, number>;
}

export function TimeCompareProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<TimeCompareKey>("current");
  const options = useMemo(() => DEFAULT_OPTIONS, []);

  const value = useMemo<TimeCompareContextValue>(
    () => ({
      options,
      selected,
      select: setSelected,
      factor: RANGE_FACTORS[selected],
      factors: RANGE_FACTORS,
    }),
    [options, selected],
  );

  return <TimeCompareContext.Provider value={value}>{children}</TimeCompareContext.Provider>;
}

export function useTimeCompare(): TimeCompareContextValue {
  const ctx = useContext(TimeCompareContext);
  if (!ctx) {
    throw new Error("useTimeCompare must be used within a TimeCompareProvider");
  }
  return ctx;
}
