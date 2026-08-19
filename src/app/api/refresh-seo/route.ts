import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getAccessToken(clientEmail: string, privateKey: string) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(unsigned);
  sign.end();
  const signature = sign.sign(privateKey);
  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description ?? "Failed to get Google access token");
  return json.access_token as string;
}

interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  position: number;
}

async function fetchSearchAnalytics(
  siteUrl: string,
  accessToken: string
): Promise<SearchAnalyticsRow[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 28);
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: fmt(start),
        endDate: fmt(end),
        dimensions: ["page"],
        rowLimit: 1000,
      }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Search Console API error");
  return json.rows ?? [];
}

function normalizeUrl(url: string) {
  return url.trim().replace(/\/+$/, "").replace(/^https?:\/\//, "").toLowerCase();
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  if (!clientEmail || !privateKey || !siteUrl) {
    return NextResponse.json(
      { error: "Google Search Console credentials aren't configured on the server." },
      { status: 500 }
    );
  }

  const { data: entries, error } = await supabase.from("seo_entries").select("id, url");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let rows: SearchAnalyticsRow[];
  try {
    const accessToken = await getAccessToken(clientEmail, privateKey);
    rows = await fetchSearchAnalytics(siteUrl, accessToken);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch Search Console data" },
      { status: 502 }
    );
  }

  const rowByUrl = new Map(rows.map((r) => [normalizeUrl(r.keys[0]), r]));

  let updated = 0;
  let notFound = 0;
  const today = new Date().toISOString().split("T")[0];

  for (const entry of entries ?? []) {
    const match = rowByUrl.get(normalizeUrl(entry.url as string));
    if (!match) {
      notFound++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("seo_entries")
      .update({
        impressions: Math.round(match.impressions),
        clicks: Math.round(match.clicks),
        avg_position: Math.round(match.position * 100) / 100,
        last_checked: today,
      })
      .eq("id", entry.id);
    if (!updateError) updated++;
  }

  return NextResponse.json({ updated, notFound, total: entries?.length ?? 0 });
}
