import { NextResponse } from "next/server";
import { fetchRealtimeRecords } from "../../../lib/realtime";

const TYPES = ["PT Strip", "Daily Summary", "Cube Equivalence", "Mass Concrete"];
const STATUS = ["Signed", "Ready", "Delivered", "Pending Approval"];

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await fetchRealtimeRecords();
    const reports = records.slice(-8).map((record, index) => ({
      id: `RPT-${record.sequence.slice(-4)}`,
      type: TYPES[index % TYPES.length],
      pour: `CMM-${record.sequence.slice(-3)}`,
      generated: record.timestamp,
      status: STATUS[index % STATUS.length],
    }));

    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load reports" }, { status: 500 });
  }
}
