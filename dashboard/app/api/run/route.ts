import { NextResponse } from "next/server";
import { startAgent } from "@/lib/agent-runner";

export async function POST() {
  const result = startAgent();
  if (!result.started) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ status: "started" });
}
