import { NextResponse } from "next/server";
import { fetchRealtimeRecords } from "../../../lib/realtime";

const ROLES = ["Admin", "Approver", "Operator", "Viewer"];

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await fetchRealtimeRecords();
    const users = records.slice(-8).map((record, index) => ({
      name: `User ${String.fromCharCode(65 + index)}.${record.sequence.slice(-2)}`,
      role: ROLES[index % ROLES.length],
      email: `user${index}@example.io`,
      status: index % 5 === 0 ? "Pending Invite" : "Active",
    }));

    const featureFlags = [
      { key: "mass_concrete_module", description: "Enable mass concrete dashboards", enabled: true },
      { key: "ota_beta", description: "Access to OTA canary features", enabled: true },
      { key: "document_ai", description: "Document AI ingestion", enabled: records.length % 2 === 0 },
    ];

    const license = {
      plan: "Enterprise",
      seats: 25,
      inUse: 18 + (records.length % 4),
      expiry: new Date(Date.now() + 150 * 24 * 3600 * 1000).toISOString(),
    };

    return NextResponse.json({ users, featureFlags, license });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load admin data" }, { status: 500 });
  }
}
