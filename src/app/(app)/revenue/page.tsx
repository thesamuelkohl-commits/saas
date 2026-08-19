"use client";

import CrudManager from "@/components/crud/CrudManager";
import type { ColumnDef } from "@/components/crud/types";

const columns: ColumnDef[] = [
  {
    key: "source",
    label: "Source",
    type: "select",
    required: true,
    summary: true,
    options: [
      { value: "sponsorship", label: "Sponsorship", color: "bg-purple-100 text-purple-700" },
      { value: "affiliate", label: "Affiliate", color: "bg-blue-100 text-blue-700" },
      { value: "ads", label: "Ads", color: "bg-amber-100 text-amber-700" },
      { value: "platform", label: "Platform", color: "bg-neutral-900 text-white" },
      { value: "other", label: "Other", color: "bg-neutral-100 text-neutral-600" },
    ],
  },
  { key: "amount", label: "Amount", type: "number", step: "0.01", required: true, summary: true },
  { key: "entry_date", label: "Date", type: "date", required: true, summary: true },
  {
    key: "sponsorship_id",
    label: "Sponsorship",
    type: "relation",
    relation: { table: "sponsorships", labelField: "brand_name" },
  },
  {
    key: "content_item_id",
    label: "Content",
    type: "relation",
    relation: { table: "content_items", labelField: "title" },
  },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default function RevenuePage() {
  return (
    <CrudManager
      table="revenue_entries"
      title="Revenue"
      description="Sponsorships, affiliates, ads, and platform revenue in one ledger."
      columns={columns}
      orderBy="entry_date"
      addLabel="Entry"
    />
  );
}
