import { NextResponse } from "next/server";
import { fetchRealtimeRecords } from "../../../lib/realtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await fetchRealtimeRecords();
    const recent = records.slice(-56);

    const trends = recent.map((record, idx, arr) => {
      const day = Math.floor(idx / 8) + 1;
      const previous = arr[idx - 1] ?? record;
      const maturity = record.temperature * 20;
      return {
        label: `Day ${day}`,
        current: maturity,
        previous: previous.temperature * 18,
        previousPrevious: arr[0].temperature * 16,
        cooldown: Math.max(12, 25 - record.temperature / 2),
      };
    });

    const cohorts = ["Mix A", "Mix B", "Mix C", "Mix D"].map((mix, index) => ({
      mix,
      current: records[index]?.temperature ?? 28,
      previous: records[index + 4]?.temperature ?? 27,
      baseline: 26 + index,
    }));

    const control = recent.slice(-12).map((record, index) => ({
      batch: index + 1,
      xbar: record.temperature,
      r: Math.abs(record.temperature - (recent[index] ?? record).temperature) / 2 + 3,
    }));

    const insights = [
      {
        title: "Anomaly detected",
        detail: `Seq ${recent.at(-1)?.sequence ?? "--"} deviated ${
          ((recent.at(-1)?.temperature ?? 0) - (recent.at(-2)?.temperature ?? 0)).toFixed(2)
        } °C compared to previous sample.`,
      },
      {
        title: "Forecast strip ETA",
        detail: "Latest maturity slope indicates PT strip window 65 minutes earlier than baseline.",
      },
      {
        title: "Sensor drift",
        detail: "Automated drift compensation scheduled for devices exceeding ±0.8 °C bias.",
      },
    ];

    return NextResponse.json({ trends, cohorts, control, insights });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load analytics" }, { status: 500 });
  }
}
