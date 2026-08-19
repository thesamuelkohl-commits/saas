"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  restaurants: number;
  contentByStage: Record<string, number>;
  sponsorshipPipelineValue: number;
  sponsorshipActiveCount: number;
  revenueTotal: number;
  revenueBySource: Record<string, number>;
  topReviews: { id: string; name: string; sam_score: number | null }[];
  topVideos: { id: string; title: string; views: number | null; platform: string }[];
}

const STAT_LABEL: Record<string, string> = {
  idea: "Idea",
  filmed: "Filmed",
  editing: "Editing",
  scheduled: "Scheduled",
  posted: "Posted",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [
        { count: restaurantCount },
        { data: contentItems },
        { data: sponsorships },
        { data: revenue },
        { data: reviews },
        { data: platformPosts },
      ] = await Promise.all([
        supabase.from("restaurants").select("id", { count: "exact", head: true }),
        supabase.from("content_items").select("stage"),
        supabase.from("sponsorships").select("stage, deal_value"),
        supabase.from("revenue_entries").select("source, amount"),
        supabase
          .from("reviews")
          .select("id, sam_score, restaurants(name)")
          .not("sam_score", "is", null)
          .order("sam_score", { ascending: false })
          .limit(5),
        supabase
          .from("platform_posts")
          .select("id, platform, views, content_items(title)")
          .not("views", "is", null)
          .order("views", { ascending: false })
          .limit(5),
      ]);

      const contentByStage: Record<string, number> = {};
      for (const item of contentItems ?? []) {
        const stage = (item as { stage: string }).stage;
        contentByStage[stage] = (contentByStage[stage] ?? 0) + 1;
      }

      const activeStages = new Set(["prospect", "contacted", "negotiating", "deal_closed"]);
      let sponsorshipPipelineValue = 0;
      let sponsorshipActiveCount = 0;
      for (const s of sponsorships ?? []) {
        const row = s as { stage: string; deal_value: number | null };
        if (activeStages.has(row.stage)) {
          sponsorshipActiveCount += 1;
          sponsorshipPipelineValue += row.deal_value ?? 0;
        }
      }

      const revenueBySource: Record<string, number> = {};
      let revenueTotal = 0;
      for (const r of revenue ?? []) {
        const row = r as { source: string; amount: number };
        revenueBySource[row.source] = (revenueBySource[row.source] ?? 0) + row.amount;
        revenueTotal += row.amount;
      }

      setStats({
        restaurants: restaurantCount ?? 0,
        contentByStage,
        sponsorshipPipelineValue,
        sponsorshipActiveCount,
        revenueTotal,
        revenueBySource,
        topReviews: (reviews ?? []).map((r) => {
          const row = r as unknown as {
            id: string;
            sam_score: number | null;
            restaurants: { name: string } | null;
          };
          return { id: row.id, name: row.restaurants?.name ?? "Unknown", sam_score: row.sam_score };
        }),
        topVideos: (platformPosts ?? []).map((p) => {
          const row = p as unknown as {
            id: string;
            platform: string;
            views: number | null;
            content_items: { title: string } | null;
          };
          return {
            id: row.id,
            title: row.content_items?.title ?? "Untitled",
            views: row.views,
            platform: row.platform,
          };
        }),
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !stats) {
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">Which restaurants, content, and deals are performing.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Restaurants" value={String(stats.restaurants)} />
        <StatCard
          label="Active Sponsorships"
          value={String(stats.sponsorshipActiveCount)}
          sub={`$${stats.sponsorshipPipelineValue.toLocaleString()} in pipeline`}
        />
        <StatCard label="Total Revenue" value={`$${stats.revenueTotal.toLocaleString()}`} />
        <StatCard
          label="Posted Videos"
          value={String(stats.contentByStage.posted ?? 0)}
          sub={`${Object.values(stats.contentByStage).reduce((a, b) => a + b, 0)} total in pipeline`}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Panel title="Content Pipeline by Stage">
          <div className="space-y-2">
            {Object.entries(STAT_LABEL).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">{label}</span>
                <span className="font-medium text-neutral-900">
                  {stats.contentByStage[key] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Revenue by Source">
          <div className="space-y-2">
            {Object.entries(stats.revenueBySource).length === 0 ? (
              <p className="text-sm text-neutral-400">No revenue logged yet.</p>
            ) : (
              Object.entries(stats.revenueBySource).map(([source, amount]) => (
                <div key={source} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-neutral-600">{source}</span>
                  <span className="font-medium text-neutral-900">
                    ${amount.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Top Rated Restaurants">
          {stats.topReviews.length === 0 ? (
            <p className="text-sm text-neutral-400">No scored reviews yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.topReviews.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">{r.name}</span>
                  <span className="font-medium text-neutral-900">{r.sam_score}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Top Performing Videos">
          {stats.topVideos.length === 0 ? (
            <p className="text-sm text-neutral-400">No view data yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.topVideos.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-neutral-600">
                    {v.title} <span className="text-neutral-400 capitalize">({v.platform})</span>
                  </span>
                  <span className="font-medium text-neutral-900">
                    {v.views?.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-400">{sub}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-neutral-900">{title}</h2>
      {children}
    </div>
  );
}
