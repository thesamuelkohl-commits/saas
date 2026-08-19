import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GRAPH_VERSION = "v21.0";

interface IgMedia {
  id: string;
  permalink: string;
  media_type: string;
  like_count?: number;
  comments_count?: number;
}

function normalizeUrl(url: string) {
  return url.trim().replace(/\/+$/, "").replace(/^https?:\/\//, "").toLowerCase();
}

async function fetchAllMedia(igUserId: string, accessToken: string): Promise<IgMedia[]> {
  const media: IgMedia[] = [];
  let url =
    `https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media` +
    `?fields=id,permalink,media_type,like_count,comments_count&limit=50&access_token=${accessToken}`;

  for (let page = 0; page < 6 && url; page++) {
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message ?? "Instagram API error");
    media.push(...(json.data ?? []));
    url = json.paging?.next ?? "";
  }
  return media;
}

async function fetchVideoViews(mediaId: string, accessToken: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}/insights?metric=plays&access_token=${accessToken}`
    );
    const json = await res.json();
    if (!res.ok) return null;
    return json.data?.[0]?.values?.[0]?.value ?? null;
  } catch {
    return null;
  }
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!accessToken || !igUserId) {
    return NextResponse.json(
      { error: "Instagram credentials aren't configured on the server." },
      { status: 500 }
    );
  }

  const { data: posts, error } = await supabase
    .from("platform_posts")
    .select("id, url")
    .eq("platform", "instagram")
    .not("url", "is", null);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let media: IgMedia[];
  try {
    media = await fetchAllMedia(igUserId, accessToken);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch Instagram media" },
      { status: 502 }
    );
  }

  const mediaByUrl = new Map(media.map((m) => [normalizeUrl(m.permalink), m]));

  let updated = 0;
  let notFound = 0;

  for (const post of posts ?? []) {
    const match = mediaByUrl.get(normalizeUrl(post.url as string));
    if (!match) {
      notFound++;
      continue;
    }

    const values: Record<string, unknown> = {
      likes: match.like_count ?? null,
      comments: match.comments_count ?? null,
      status: "posted",
    };

    if (match.media_type === "VIDEO" || match.media_type === "REELS") {
      const views = await fetchVideoViews(match.id, accessToken);
      if (views !== null) values.views = views;
    }

    const { error: updateError } = await supabase
      .from("platform_posts")
      .update(values)
      .eq("id", post.id);
    if (!updateError) updated++;
  }

  return NextResponse.json({ updated, notFound, total: posts?.length ?? 0 });
}
