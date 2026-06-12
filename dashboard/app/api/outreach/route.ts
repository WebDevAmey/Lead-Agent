import { NextResponse } from "next/server";
import { getOutreach, setOutreachStatus } from "@/lib/leads-db";

export async function GET() {
  return NextResponse.json(getOutreach());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { input, domain, status, notes } = body ?? {};

  if (!input || !status) {
    return NextResponse.json({ error: "input and status are required" }, { status: 400 });
  }

  setOutreachStatus(input, domain ?? null, status, notes ?? null);
  return NextResponse.json({ ok: true });
}
