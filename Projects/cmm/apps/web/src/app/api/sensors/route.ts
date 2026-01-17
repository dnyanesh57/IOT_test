import { NextResponse } from "next/server";
import { fetchRealtimeRecords } from "../../../lib/realtime";

const TYPES = ["Temperature", "Humidity", "Strain"];
const STATUS = ["online", "maintenance", "offline"];

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await fetchRealtimeRecords();
    const sensors = records.slice(-18).map((record, index) => ({
      id: `D-${record.sequence.slice(0, 3)}-${String(index).padStart(2, "0")}`,
      device: `D-${record.sequence.slice(0, 3)}`,
      type: TYPES[index % TYPES.length],
      location: `Area ${String.fromCharCode(65 + (index % 5))} - Block ${index % 7}`,
      status: STATUS[index % STATUS.length === 2 ? 2 : record.status === "0" ? 0 : 1],
      drift: Number((Math.sin(index) * 0.5 + 0.3).toFixed(2)),
    }));

    return NextResponse.json({ sensors });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load sensors" }, { status: 500 });
  }
}
