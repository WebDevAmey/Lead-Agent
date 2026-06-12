import { NextResponse } from "next/server";
import { getAllLeads } from "@/lib/leads-db";

export async function GET() {
  return NextResponse.json(getAllLeads());
}
