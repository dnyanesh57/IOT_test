import { NextResponse } from "next/server";
import { fetchRealtimeRecords } from "../../../lib/realtime";

const STATUS: Array<"planning" | "inProgress" | "curing"> = ["planning", "inProgress", "curing"];

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await fetchRealtimeRecords();
    const items = records.slice(-15).map((record, index) => ({
      id: `CMM-${record.sequence.slice(-3)}`,
      location: `Zone ${String.fromCharCode(65 + (index % 5))} - Level ${10 + (index % 4)}`,
      mix: index % 3 === 0 ? "PT-65" : index % 3 === 1 ? "Mass-46" : "Core-52",
      progress: Math.min(100, Math.abs(record.temperature * 3)),
      eta: `${Math.max(2, Math.round(12 - record.temperature / 3))}h`,
      status: STATUS[index % STATUS.length],
    }));

    return NextResponse.json({ pours: items });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load pours" }, { status: 500 });
  }
}
