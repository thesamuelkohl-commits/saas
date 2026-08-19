"use client";

import CrudManager from "@/components/crud/CrudManager";
import type { ColumnDef } from "@/components/crud/types";

const columns: ColumnDef[] = [
  { key: "url", label: "URL", type: "text", required: true, summary: true },
  {
    key: "website_page_id",
    label: "Website Page",
    type: "relation",
    relation: { table: "website_pages", labelField: "title" },
  },
  { key: "indexed", label: "Indexed", type: "checkbox", summary: true },
  { key: "impressions", label: "Impressions", type: "number", summary: true },
  { key: "clicks", label: "Clicks", type: "number", summary: true },
  { key: "avg_position", label: "Avg Position", type: "number", step: "0.1" },
  { key: "last_checked", label: "Last Checked", type: "date" },
];

export default function SeoPage() {
  return (
    <CrudManager
      table="seo_entries"
      title="SEO Tracker"
      description="URL, indexing, impressions, clicks, position."
      columns={columns}
      addLabel="URL"
    />
  );
}
