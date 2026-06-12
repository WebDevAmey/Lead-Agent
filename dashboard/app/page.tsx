"use client";

import { useEffect, useMemo, useState } from "react";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Mail, Search } from "lucide-react";
import { InstagramIcon, LinkedinIcon } from "@/components/icons";
import type { Lead } from "@/lib/leads-db";

interface Stats {
  total: number;
  done: number;
  not_shopify: number;
  pending: number;
  emails_found: number;
  instagrams_found: number;
  avg_score: number;
}

type FilterMode = "all" | "email" | "instagram" | "top";

function asUrl(value: string | null) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function ScoreBadge({ score }: { score: number | null }) {
  const value = Math.round(score ?? 0);
  const variant = value >= 70 ? "success" : value >= 50 ? "warning" : "destructive";
  return <Badge variant={variant}>{value}</Badge>;
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === "done") return <Badge variant="success">done</Badge>;
  if (status === "not_shopify") return <Badge variant="default">not_shopify</Badge>;
  return <Badge variant="warning">pending</Badge>;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <span className="text-2xl font-bold text-zinc-100">{value}</span>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/leads").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
    ])
      .then(([leadsData, statsData]) => {
        setLeads(leadsData);
        setStats(statsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (q) {
        const haystack = `${lead.store_name ?? ""} ${lead.domain ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filter === "email" && !lead.email) return false;
      if (filter === "instagram" && !lead.instagram) return false;
      if (filter === "top" && (lead.score ?? 0) < 70) return false;
      return true;
    });
  }, [leads, search, filter]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="relative flex h-48 w-full items-center justify-center overflow-hidden border-b border-zinc-800 bg-zinc-950">
        <FlickeringGrid
          className="absolute inset-0"
          squareSize={4}
          gridGap={6}
          color="rgb(124, 58, 237)"
          maxOpacity={0.25}
          flickerChance={0.3}
        />
        <div className="relative z-10 flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            LeadFinder
          </h1>
          <p className="text-sm text-zinc-400 sm:text-base">
            Shopify Solo Founder Intelligence
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Leads" value={stats?.total ?? "—"} />
          <StatCard label="Emails Found" value={stats?.emails_found ?? "—"} />
          <StatCard label="Instagrams Found" value={stats?.instagrams_found ?? "—"} />
          <StatCard label="Avg Score" value={stats?.avg_score ?? "—"} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search store or domain..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterMode)}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="email">Has Email</option>
            <option value="instagram">Has Instagram</option>
            <option value="top">Score 70+</option>
          </select>
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Score</TableHead>
                <TableHead>Store Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Founder</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>LinkedIn</TableHead>
                <TableHead>Solo Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-zinc-500">
                    Loading leads…
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-zinc-500">
                    No leads match these filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((lead) => (
                <TableRow key={lead.input}>
                  <TableCell>
                    <ScoreBadge score={lead.score} />
                  </TableCell>
                  <TableCell className="font-medium text-zinc-100">
                    {lead.store_name || "—"}
                  </TableCell>
                  <TableCell>
                    {lead.domain ? (
                      <a
                        href={asUrl(lead.domain)!}
                        target="_blank"
                        rel="noreferrer"
                        className="text-violet-400 hover:underline"
                      >
                        {lead.domain}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {lead.founder_name || "—"}
                  </TableCell>
                  <TableCell>
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-violet-400"
                        title={lead.email}
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.instagram ? (
                      <a
                        href={asUrl(lead.instagram)!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-violet-400"
                      >
                        <InstagramIcon className="h-4 w-4" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.linkedin ? (
                      <a
                        href={asUrl(lead.linkedin)!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-violet-400"
                      >
                        <LinkedinIcon className="h-4 w-4" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {Math.max(0, Math.min(50, lead.solo_score ?? 0))}/50
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={lead.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
