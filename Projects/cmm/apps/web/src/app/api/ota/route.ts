import { NextResponse } from "next/server";
import { fetchRealtimeRecords } from "../../../lib/realtime";

const CHANNELS = ["stable", "canary", "archive"];
const STATUS = ["Healthy", "Monitoring", "Retired"];

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await fetchRealtimeRecords();
    const releases = records.slice(-3).map((record, index) => ({
      version: `v${2 + index}.${Math.abs(Math.round(record.temperature)) % 5}.${index}`,
      channel: CHANNELS[index % CHANNELS.length],
      cohort: index === 0 ? "All" : index === 1 ? "Tower A" : "Legacy",
      promoted: record.timestamp,
      status: STATUS[index % STATUS.length],
    }));

    return NextResponse.json({ releases });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load OTA releases" }, { status: 500 });
  }
}
