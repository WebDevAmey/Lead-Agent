import { NextResponse } from "next/server";
import { getAllLeads } from "@/lib/leads-db";

export async function GET() {
  const leads = getAllLeads();
  const done = leads.filter((l) => l.status === "done");
  const notShopify = leads.filter((l) => l.status === "not_shopify").length;
  const pending = leads.filter((l) => l.status === "pending" || !l.status).length;
  const avgScore = done.length
    ? done.reduce((sum, l) => sum + (l.score || 0), 0) / done.length
    : 0;

  return NextResponse.json({
    total: leads.length,
    done: done.length,
    not_shopify: notShopify,
    pending,
    emails_found: done.filter((l) => l.email).length,
    instagrams_found: done.filter((l) => l.instagram).length,
    avg_score: Math.round(avgScore * 10) / 10,
  });
}
