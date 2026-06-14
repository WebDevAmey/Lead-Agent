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
import { Mail, Search, Play, Loader2, Check, Reply, X as XIcon } from "lucide-react";
import { InstagramIcon, LinkedinIcon } from "@/components/icons";
import { RunDrawer } from "@/components/run-drawer";
import type { Lead, OutreachRow } from "@/lib/leads-db";

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
type OutreachFilter = "all" | "not_contacted" | "sent" | "replied";

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

function OutreachBadge({ status }: { status: string }) {
  if (status === "sent") return <Badge variant="warning">sent</Badge>;
  if (status === "replied") return <Badge variant="success">replied</Badge>;
  if (status === "not_interested") return <Badge variant="destructive">skipped</Badge>;
  return <Badge variant="default">not contacted</Badge>;
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

const OUTREACH_TABS: { value: OutreachFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "not_contacted", label: "Not Contacted" },
  { value: "sent", label: "Sent" },
  { value: "replied", label: "Replied" },
];

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [outreach, setOutreach] = useState<Record<string, OutreachRow>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [outreachFilter, setOutreachFilter] = useState<OutreachFilter>("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const loadOutreach = useCallback(async () => {
    const rows: OutreachRow[] = await fetch("/api/outreach").then((r) => r.json());
    const map: Record<string, OutreachRow> = {};
    for (const row of rows) map[row.input] = row;
    setOutreach(map);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [leadsData, statsData] = await Promise.all([
        fetch("/api/leads").then((r) => r.json()),
        fetch("/api/stats").then((r) => r.json()),
      ]);
      setLeads(leadsData);
      setStats(statsData);
      await loadOutreach();
    } finally {
      setLoading(false);
    }
  }, [loadOutreach]);

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

  const handleOutreach = async (lead: Lead, status: string) => {
    const res = await fetch("/api/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: lead.input, domain: lead.domain, status }),
    });
    if (!res.ok) return;
    await loadOutreach();
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

      if (outreachFilter !== "all") {
        const status = outreach[lead.input]?.status ?? "pending";
        if (outreachFilter === "not_contacted" && status !== "pending") return false;
        if (outreachFilter === "sent" && status !== "sent") return false;
        if (outreachFilter === "replied" && status !== "replied") return false;
      }
      return true;
    });
  }, [leads, search, filter, outreach, outreachFilter]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
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

        <div className="flex flex-wrap gap-2">
          {OUTREACH_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setOutreachFilter(tab.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                outreachFilter === tab.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
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
                <TableHead>Compliment</TableHead>
                <TableHead>Outreach</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                    Loading leads…
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                    No leads match these filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((lead) => {
                const outreachStatus = outreach[lead.input]?.status ?? "pending";
                return (
                  <TableRow key={lead.input} className="[&>td]:align-top">
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
                    <TableCell className="w-[260px] max-w-[260px] min-w-[200px] whitespace-normal break-words text-xs text-muted-foreground">
                      {lead.compliment || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <OutreachBadge status={outreachStatus} />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={outreachStatus === "sent" ? "default" : "outline"}
                            disabled={outreachStatus === "sent"}
                            onClick={() => handleOutreach(lead, "sent")}
                            title="Mark as sent"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant={outreachStatus === "replied" ? "default" : "outline"}
                            disabled={outreachStatus === "replied"}
                            onClick={() => handleOutreach(lead, "replied")}
                            title="Mark as replied"
                          >
                            <Reply className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant={outreachStatus === "not_interested" ? "default" : "outline"}
                            disabled={outreachStatus === "not_interested"}
                            onClick={() => handleOutreach(lead, "not_interested")}
                            title="Skip / not interested"
                          >
                            <XIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
