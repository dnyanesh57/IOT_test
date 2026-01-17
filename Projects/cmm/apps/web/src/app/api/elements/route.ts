import { NextResponse } from "next/server";
import { fetchRealtimeRecords } from "../../../lib/realtime";

const ELEMENT_NAMES = ["Slab", "Beam", "Column", "Shear Wall", "Footing", "Post-Tension", "Precast"] as const;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await fetchRealtimeRecords();
    const buckets = ELEMENT_NAMES.map((name) => ({ name, counts: 0, totalTemp: 0, lastTemp: 0 }));

    records.slice(-ELEMENT_NAMES.length * 8).forEach((record, index) => {
      const bucket = buckets[index % ELEMENT_NAMES.length];
      bucket.counts += 1;
      bucket.totalTemp += record.temperature;
      bucket.lastTemp = record.temperature;
    });

    const elements = buckets.map((bucket, index) => {
      const maturity = Math.round(bucket.totalTemp * 4);
      const compliance = 0.92 + ((index + 1) * 0.01) % 0.04;
      return {
        name: bucket.name,
        active: Math.max(1, Math.round(bucket.counts / 4)),
        avgTemp: bucket.counts ? bucket.totalTemp / bucket.counts : 0,
        maturity,
        stripEta: maturity > 600 ? "5h 45m" : "6h 20m",
        compliance,
      };
    });

    return NextResponse.json({ elements });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load elements" }, { status: 500 });
  }
}
