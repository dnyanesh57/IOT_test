import { NextResponse } from "next/server";
import { fetchRealtimeRecords } from "../../../lib/realtime";

export const dynamic = "force-dynamic";

function deriveEvents(records: Awaited<ReturnType<typeof fetchRealtimeRecords>>) {
  const result = [] as Array<{
    id: string;
    title: string;
    time: string;
    status: "green" | "amber" | "red";
    summary: string;
    sensorCount: number;
  }>;

  for (let i = records.length - 1; i >= Math.max(records.length - 20, 0); i -= 5) {
    const record = records[i];
    const previous = records[i - 1] ?? record;
    const delta = record.temperature - previous.temperature;
    const status = delta > 1.5 ? "amber" : delta < -1.5 ? "red" : "green";
    result.push({
      id: record.sequence,
      title: delta > 0 ? "Temperature ramp" : delta < 0 ? "Cooling phase" : "Stable trend",
      time: record.timestamp,
      status,
      summary: `Δ ${delta.toFixed(2)} °C since last sample, status ${record.status}.`,
      sensorCount: 6 + (parseInt(record.sequence.slice(-1), 16) % 4),
    });
  }
  return result.slice(0, 12);
}

export async function GET() {
  try {
    const records = await fetchRealtimeRecords();
    const events = deriveEvents(records);

    const chart = records.slice(-24).map((record, index, array) => {
      const prev = array[index - 1] ?? record;
      return {
        time: new Date(record.timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
        temperature: record.temperature,
        previous: prev.temperature,
        baseline: array[0].temperature,
      };
    });

    return NextResponse.json({ events, chart });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load timeline" }, { status: 500 });
  }
}
