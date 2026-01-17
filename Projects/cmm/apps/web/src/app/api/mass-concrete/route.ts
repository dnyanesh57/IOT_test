import { NextResponse } from "next/server";
import { fetchRealtimeRecords } from "../../../lib/realtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await fetchRealtimeRecords();
    const recent = records.slice(-40);

    const profile = recent.map((record, index) => ({
      hour: index,
      core: record.temperature,
      surface: record.temperature - 2 - Math.sin(index / 5) * 1.5,
    }));

    const gradients = profile.map((point) => ({ hour: point.hour, delta: point.core - point.surface }));
    const peak = Math.max(...profile.map((point) => point.core));
    const gradientMax = Math.max(...gradients.map((point) => point.delta));

    return NextResponse.json({
      profile,
      gradients,
      overview: {
        peak,
        gradient: gradientMax,
        cooldown: Math.round(peak / 3 + 10),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load mass concrete data" }, { status: 500 });
  }
}
