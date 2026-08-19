"use client";

import CrudManager from "@/components/crud/CrudManager";
import type { ColumnDef } from "@/components/crud/types";

const columns: ColumnDef[] = [
  {
    key: "content_item_id",
    label: "Video",
    type: "relation",
    relation: { table: "content_items", labelField: "title" },
    required: true,
    summary: true,
  },
  {
    key: "platform",
    label: "Platform",
    type: "select",
    required: true,
    summary: true,
    options: [
      { value: "tiktok", label: "TikTok", color: "bg-neutral-900 text-white" },
      { value: "instagram", label: "Instagram", color: "bg-pink-100 text-pink-700" },
      { value: "youtube", label: "YouTube", color: "bg-red-100 text-red-700" },
    ],
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    required: true,
    summary: true,
    options: [
      { value: "not_started", label: "Not Started", color: "bg-neutral-100 text-neutral-600" },
      { value: "scheduled", label: "Scheduled", color: "bg-amber-100 text-amber-700" },
      { value: "posted", label: "Posted", color: "bg-green-100 text-green-700" },
    ],
  },
  { key: "posted_at", label: "Posted Date", type: "date" },
  { key: "url", label: "URL", type: "text" },
  { key: "views", label: "Views", type: "number", summary: true },
  { key: "likes", label: "Likes", type: "number" },
  { key: "comments", label: "Comments", type: "number" },
];

export default function PlatformsPage() {
  return (
    <CrudManager
      table="platform_posts"
      title="Platform Tracker"
      description="TikTok / IG / YouTube status for each video."
      columns={columns}
      addLabel="Post"
    />
  );
}
