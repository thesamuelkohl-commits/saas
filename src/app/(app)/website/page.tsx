"use client";

import CrudManager from "@/components/crud/CrudManager";
import type { ColumnDef } from "@/components/crud/types";

const columns: ColumnDef[] = [
  { key: "title", label: "Title", type: "text", required: true, summary: true },
  {
    key: "restaurant_id",
    label: "Restaurant",
    type: "relation",
    relation: { table: "restaurants", labelField: "name" },
    summary: true,
  },
  {
    key: "stage",
    label: "Stage",
    type: "select",
    required: true,
    summary: true,
    options: [
      { value: "draft", label: "Draft", color: "bg-neutral-100 text-neutral-600" },
      { value: "in_review", label: "In Review", color: "bg-amber-100 text-amber-700" },
      { value: "published", label: "Published", color: "bg-blue-100 text-blue-700" },
      { value: "indexed", label: "Indexed", color: "bg-green-100 text-green-700" },
    ],
  },
  { key: "url", label: "URL", type: "text", summary: true },
  { key: "published_at", label: "Published", type: "date" },
];

export default function WebsitePage() {
  return (
    <CrudManager
      table="website_pages"
      title="Website Pipeline"
      description="Draft → review page → indexed."
      columns={columns}
      addLabel="Page"
    />
  );
}
