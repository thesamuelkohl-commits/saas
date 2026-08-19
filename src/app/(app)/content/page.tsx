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
      { value: "idea", label: "Idea", color: "bg-neutral-100 text-neutral-600" },
      { value: "filmed", label: "Filmed", color: "bg-blue-100 text-blue-700" },
      { value: "editing", label: "Editing", color: "bg-amber-100 text-amber-700" },
      { value: "scheduled", label: "Scheduled", color: "bg-purple-100 text-purple-700" },
      { value: "posted", label: "Posted", color: "bg-green-100 text-green-700" },
    ],
  },
  { key: "film_date", label: "Film Date", type: "date", summary: true },
  { key: "due_date", label: "Due Date", type: "date" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default function ContentPage() {
  return (
    <CrudManager
      table="content_items"
      title="Content Pipeline"
      description="Idea → filmed → editing → scheduled → posted."
      columns={columns}
      addLabel="Content Item"
    />
  );
}
