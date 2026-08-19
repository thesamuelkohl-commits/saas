export type ContentStage = "idea" | "filmed" | "editing" | "scheduled" | "posted";
export type PlatformName = "tiktok" | "instagram" | "youtube";
export type PlatformStatus = "not_started" | "scheduled" | "posted";
export type SponsorshipStage =
  | "prospect"
  | "contacted"
  | "negotiating"
  | "deal_closed"
  | "worked_with"
  | "passed";
export type WebsiteStage = "draft" | "in_review" | "published" | "indexed";
export type RevenueSource = "sponsorship" | "affiliate" | "ads" | "platform" | "other";

export interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  cuisine: string | null;
  city: string | null;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  restaurant_name: string;
  location: string | null;
  reason: string | null;
  priority: number;
  visited: boolean;
  notes: string | null;
  created_at: string;
}

export interface ContentItem {
  id: string;
  restaurant_id: string | null;
  title: string;
  stage: ContentStage;
  notes: string | null;
  film_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformPost {
  id: string;
  content_item_id: string;
  platform: PlatformName;
  status: PlatformStatus;
  posted_at: string | null;
  url: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  created_at: string;
}

export interface Review {
  id: string;
  restaurant_id: string | null;
  content_item_id: string | null;
  sam_score: number | null;
  food_score: number | null;
  service_score: number | null;
  vibe_score: number | null;
  price_range: number | null;
  visited_date: string | null;
  notes: string | null;
  photos: string[];
  created_at: string;
}

export interface WebsitePage {
  id: string;
  restaurant_id: string | null;
  review_id: string | null;
  title: string;
  url: string | null;
  stage: WebsiteStage;
  published_at: string | null;
  created_at: string;
}

export interface SeoEntry {
  id: string;
  website_page_id: string | null;
  url: string;
  indexed: boolean;
  impressions: number;
  clicks: number;
  avg_position: number | null;
  last_checked: string | null;
  created_at: string;
}

export interface Sponsorship {
  id: string;
  brand_name: string;
  contact_name: string | null;
  contact_email: string | null;
  stage: SponsorshipStage;
  deal_value: number | null;
  notes: string | null;
  last_contact_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface RevenueEntry {
  id: string;
  source: RevenueSource;
  sponsorship_id: string | null;
  amount: number;
  entry_date: string;
  notes: string | null;
  created_at: string;
}
