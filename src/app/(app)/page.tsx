"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  contentByStage: Record<string, number>;
  sponsorshipPipelineValue: number;
  sponsorshipActiveCount: number;
  revenueTotal: number;
  revenueThisMonth: number;
  revenueBySource: Record<string, number>;
  totalReviews: number;
  avgViews: number | null;
  seoImpressions: number;
  seoClicks: number;
  bestCuisines: { cuisine: string; avgScore: number; count: number }[];
  topReviews: { id: string; name: string; sam_score: number | null }[];
  topVideos: { id: string; title: string; views: number | null; platform: string }[];
  topContentByRevenue: { id: string; title: string; amount: number }[];
  suggestions: string[];
}

const STAT_LABEL: Record<string, string> = {
  idea: "Idea",
  filmed: "Filmed",
  editing: "Editing",
  scheduled: "Scheduled",
  posted: "Posted",
};

const ALL_PLATFORMS = ["tiktok", "instagram", "youtube"];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [
        { data: contentItems },
        { data: sponsorships },
        { data: revenue },
        { data: reviews },
        { data: platformPosts },
        { data: websitePages },
        { data: seoEntries },
      ] = await Promise.all([
        supabase.from("content_items").select("id, title, stage"),
        supabase.from("sponsorships").select("stage, deal_value"),
        supabase.from("revenue_entries").select("source, amount, entry_date, content_item_id, content_items(title)"),
        supabase.from("reviews").select("id, sam_score, restaurant_name, cuisine"),
        supabase
          .from("platform_posts")
          .select("id, platform, views, status, content_item_id, content_items(title)"),
        supabase.from("website_pages").select("id, title, stage"),
        supabase.from("seo_entries").select("website_page_id, impressions, clicks, indexed"),
      ]);

      // ---- content pipeline by stage ----
      const contentByStage: Record<string, number> = {};
      for (const item of contentItems ?? []) {
        const stage = (item as { stage: string }).stage;
        contentByStage[stage] = (contentByStage[stage] ?? 0) + 1;
      }

      // ---- sponsorships ----
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

      // ---- revenue ----
      const revenueBySource: Record<string, number> = {};
      let revenueTotal = 0;
      let revenueThisMonth = 0;
      const revenueByContent = new Map<string, { title: string; amount: number }>();
      const now = new Date();
      for (const r of revenue ?? []) {
        const row = r as unknown as {
          source: string;
          amount: number;
          entry_date: string;
          content_item_id: string | null;
          content_items: { title: string } | null;
        };
        revenueBySource[row.source] = (revenueBySource[row.source] ?? 0) + row.amount;
        revenueTotal += row.amount;

        const d = new Date(row.entry_date);
        if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
          revenueThisMonth += row.amount;
        }

        if (row.content_item_id && row.content_items) {
          const existing = revenueByContent.get(row.content_item_id);
          revenueByContent.set(row.content_item_id, {
            title: row.content_items.title,
            amount: (existing?.amount ?? 0) + row.amount,
          });
        }
      }
      const topContentByRevenue = Array.from(revenueByContent.entries())
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // ---- reviews + cuisines ----
      const reviewRows = (reviews ?? []) as {
        id: string;
        sam_score: number | null;
        restaurant_name: string | null;
        cuisine: string | null;
      }[];
      const totalReviews = reviewRows.length;

      const cuisineAgg = new Map<string, { total: number; count: number }>();
      for (const r of reviewRows) {
        if (!r.cuisine || r.sam_score === null) continue;
        const agg = cuisineAgg.get(r.cuisine) ?? { total: 0, count: 0 };
        agg.total += r.sam_score;
        agg.count += 1;
        cuisineAgg.set(r.cuisine, agg);
      }
      const bestCuisines = Array.from(cuisineAgg.entries())
        .map(([cuisine, agg]) => ({ cuisine, avgScore: agg.total / agg.count, count: agg.count }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

      const topReviews = reviewRows
        .filter((r) => r.sam_score !== null)
        .sort((a, b) => (b.sam_score ?? 0) - (a.sam_score ?? 0))
        .slice(0, 5)
        .map((r) => ({ id: r.id, name: r.restaurant_name ?? "Unknown", sam_score: r.sam_score }));

      // ---- platform posts / views ----
      const postRows = (platformPosts ?? []) as unknown as {
        id: string;
        platform: string;
        views: number | null;
        status: string;
        content_item_id: string;
        content_items: { title: string } | null;
      }[];

      const viewedPosts = postRows.filter((p) => p.views !== null);
      const avgViews = viewedPosts.length
        ? viewedPosts.reduce((sum, p) => sum + (p.views ?? 0), 0) / viewedPosts.length
        : null;

      const topVideos = postRows
        .filter((p) => p.views !== null)
        .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
        .slice(0, 5)
        .map((p) => ({
          id: p.id,
          title: p.content_items?.title ?? "Untitled",
          views: p.views,
          platform: p.platform,
        }));

      // ---- seo ----
      let seoImpressions = 0;
      let seoClicks = 0;
      for (const s of seoEntries ?? []) {
        const row = s as { impressions: number; clicks: number };
        seoImpressions += row.impressions ?? 0;
        seoClicks += row.clicks ?? 0;
      }

      // ---- automation suggestions ----
      const suggestions: string[] = [];

      const postsByContent = new Map<string, Set<string>>();
      for (const p of postRows) {
        if (p.status !== "posted") continue;
        const set = postsByContent.get(p.content_item_id) ?? new Set();
        set.add(p.platform);
        postsByContent.set(p.content_item_id, set);
      }
      for (const item of (contentItems ?? []) as { id: string; title: string }[]) {
        const posted = postsByContent.get(item.id);
        if (!posted || posted.size === 0) continue;
        const missing = ALL_PLATFORMS.filter((p) => !posted.has(p));
        if (missing.length > 0) {
          const postedList = Array.from(posted).join(", ");
          suggestions.push(
            `"${item.title}" is posted on ${postedList} but not ${missing.join(", ")}.`
          );
        }
      }

      const indexedPages = new Set(
        (seoEntries ?? [])
          .filter((s) => (s as { indexed: boolean }).indexed && (s as { website_page_id: string | null }).website_page_id)
          .map((s) => (s as { website_page_id: string }).website_page_id)
      );
      for (const page of (websitePages ?? []) as { id: string; title: string; stage: string }[]) {
        if (page.stage === "published" && !indexedPages.has(page.id)) {
          suggestions.push(`"${page.title}" is live on the website but not indexed by Google yet.`);
        }
      }

      setStats({
        contentByStage,
        sponsorshipPipelineValue,
        sponsorshipActiveCount,
        revenueTotal,
        revenueThisMonth,
        revenueBySource,
        totalReviews,
        avgViews,
        seoImpressions,
        seoClicks,
        bestCuisines,
        topReviews,
        topVideos,
        topContentByRevenue,
        suggestions,
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
        <p className="text-sm text-neutral-500">Which content, cuisines, and deals are performing.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Reviews" value={String(stats.totalReviews)} />
        <StatCard
          label="Posted Videos"
          value={String(stats.contentByStage.posted ?? 0)}
          sub={`${Object.values(stats.contentByStage).reduce((a, b) => a + b, 0)} total in pipeline`}
        />
        <StatCard
          label="Average Views"
          value={stats.avgViews !== null ? Math.round(stats.avgViews).toLocaleString() : "—"}
        />
        <StatCard
          label="Active Sponsorships"
          value={String(stats.sponsorshipActiveCount)}
          sub={`$${stats.sponsorshipPipelineValue.toLocaleString()} in pipeline`}
        />
        <StatCard label="Revenue This Month" value={`$${stats.revenueThisMonth.toLocaleString()}`} />
        <StatCard label="Total Revenue" value={`$${stats.revenueTotal.toLocaleString()}`} />
        <StatCard label="Google Impressions" value={stats.seoImpressions.toLocaleString()} />
        <StatCard label="Google Clicks" value={stats.seoClicks.toLocaleString()} />
      </div>

      {stats.suggestions.length > 0 && (
        <Panel title="Suggestions">
          <ul className="space-y-2">
            {stats.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-neutral-700">
                <span>💡</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

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

        <Panel title="Best-Performing Cuisines">
          {stats.bestCuisines.length === 0 ? (
            <p className="text-sm text-neutral-400">No scored reviews with a cuisine yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.bestCuisines.map((c) => (
                <div key={c.cuisine} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">
                    {c.cuisine} <span className="text-neutral-400">({c.count})</span>
                  </span>
                  <span className="font-medium text-neutral-900">{c.avgScore.toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
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

        <Panel title="Top Earning Content">
          {stats.topContentByRevenue.length === 0 ? (
            <p className="text-sm text-neutral-400">No revenue linked to content yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.topContentByRevenue.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-neutral-600">{c.title}</span>
                  <span className="font-medium text-neutral-900">
                    ${c.amount.toLocaleString()}
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
