import { NextResponse } from "next/server";
import { DATA_SOURCE_URL, fetchRealtimeRecords } from "../../../lib/realtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await fetchRealtimeRecords();
    return NextResponse.json({
      source: DATA_SOURCE_URL,
      fetchedAt: new Date().toISOString(),
      count: records.length,
      records,
    });
  } catch (error) {
    return NextResponse.json({ error: "Unable to reach data server" }, { status: 500 });
  }
}
