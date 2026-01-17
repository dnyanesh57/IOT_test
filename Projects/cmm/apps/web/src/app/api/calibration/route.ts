import { NextResponse } from "next/server";
import { fetchRealtimeRecords } from "../../../lib/realtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await fetchRealtimeRecords();
    const runs = records.slice(-9).map((record, index) => ({
      id: `CAL-${record.sequence.slice(-4)}`,
      mix: index % 2 === 0 ? "PT-65" : "Mass-46",
      lab: index % 2 === 0 ? "Lab North" : "Lab Central",
      date: new Date(record.timestamp).toISOString(),
      r: Number((0.985 + (record.temperature % 3) * 0.004).toFixed(3)),
      method: index % 2 === 0 ? "Arrhenius" : "Nurse-Saul",
    }));

    const certificates = runs.slice(0, 5).map((run, index) => ({
      id: `CERT-${run.mix}-${index + 1}`,
      calibration: run.id,
      version: index + 1,
      signer: "QA Ops",
      status: index === 0 ? "Active" : index === 1 ? "Active" : "Revoked",
    }));

    return NextResponse.json({ runs, certificates });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load calibration" }, { status: 500 });
  }
}
