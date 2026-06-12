"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Mail, Search, Play, Loader2 } from "lucide-react";
import { InstagramIcon, LinkedinIcon } from "@/components/icons";
import { RunDrawer } from "@/components/run-drawer";
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
        <span className="text-2xl font-bold text-foreground">{value}</span>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [leadsData, statsData] = await Promise.all([
        fetch("/api/leads").then((r) => r.json()),
        fetch("/api/stats").then((r) => r.json()),
      ]);
      setLeads(leadsData);
      setStats(statsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const handleRun = async () => {
    setLogs([]);
    setDrawerOpen(true);

    if (!eventSourceRef.current) {
      const source = new EventSource("/api/logs");
      source.onmessage = (e) => {
        if (e.data === "__START__") return;
        if (e.data.startsWith("__EXIT__")) {
          setRunning(false);
          loadData();
          return;
        }
        setLogs((prev) => [...prev, e.data]);
      };
      eventSourceRef.current = source;
    }

    try {
      setRunning(true);
      const res = await fetch("/api/run", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to start run");
    } catch (err) {
      setRunning(false);
      setLogs((prev) => [...prev, `Error: ${(err as Error).message}`]);
    }
  };

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
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-foreground">Lead Dashboard</h1>
          <Button onClick={handleRun} disabled={running}>
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {running ? "Running…" : "Run Agent"}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Leads" value={stats?.total ?? "—"} />
          <StatCard label="Emails Found" value={stats?.emails_found ?? "—"} />
          <StatCard label="Instagrams Found" value={stats?.instagrams_found ?? "—"} />
          <StatCard label="Avg Score" value={stats?.avg_score ?? "—"} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search store or domain..."
              className="w-full rounded-lg border border-border bg-muted/60 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterMode)}
            className="rounded-lg border border-border bg-muted/60 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
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
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    Loading leads…
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No leads match these filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((lead) => (
                <TableRow key={lead.input}>
                  <TableCell>
                    <ScoreBadge score={lead.score} />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {lead.store_name || "—"}
                  </TableCell>
                  <TableCell>
                    {lead.domain ? (
                      <a
                        href={asUrl(lead.domain)!}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {lead.domain}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.founder_name || "—"}
                  </TableCell>
                  <TableCell>
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"
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
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"
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
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"
                      >
                        <LinkedinIcon className="h-4 w-4" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
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

      <RunDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        logs={logs}
        running={running}
      />
    </div>
  );
}
