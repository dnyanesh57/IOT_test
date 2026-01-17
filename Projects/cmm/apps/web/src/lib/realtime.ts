const REMOTE_FILE =
  process.env.DATA_SERVER_FILE ??
  "http://143.110.186.187:3000/data_viewer.html?file=3C8A1F8053AC_282E39C0000000F5.txt";

export interface RealtimeRecord {
  sequence: string;
  timestamp: string;
  temperature: number;
  status: string;
  raw: string;
}

function parseLine(line: string): RealtimeRecord | null {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 5) return null;

  const [sequence, date, time, tempRaw, statusRaw] = parts;
  const [day, month, year] = date.split("-");
  const [hours, minutes, seconds] = time.split(":");
  const yearNumber = Number(year) + (year.length === 2 ? 2000 : 0);
  const timestamp = new Date(
    Date.UTC(yearNumber, Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds)),
  ).toISOString();

  return {
    sequence,
    timestamp,
    temperature: Number(tempRaw),
    status: statusRaw,
    raw: line.trim(),
  };
}

export async function fetchRealtimeRecords(): Promise<RealtimeRecord[]> {
  const response = await fetch(REMOTE_FILE, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch remote file: ${response.status}`);
  }
  const body = await response.text();
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseLine(line))
    .filter((record): record is RealtimeRecord => Boolean(record));
}

export { REMOTE_FILE as DATA_SOURCE_URL };
