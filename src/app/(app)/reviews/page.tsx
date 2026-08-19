"use client";

import CrudManager from "@/components/crud/CrudManager";
import type { ColumnDef } from "@/components/crud/types";

const columns: ColumnDef[] = [
  { key: "restaurant_name", label: "Restaurant", type: "text", required: true, summary: true },
  { key: "cuisine", label: "Cuisine", type: "text", summary: true },
  { key: "sam_score", label: "Sam Score", type: "number", step: "0.1", summary: true },
  { key: "food_score", label: "Food Score", type: "number", step: "0.1" },
  { key: "service_score", label: "Service Score", type: "number", step: "0.1" },
  { key: "vibe_score", label: "Vibe Score", type: "number", step: "0.1" },
  {
    key: "price_range",
    label: "Price",
    type: "select",
    summary: true,
    options: [
      { value: "1", label: "$", color: "bg-green-100 text-green-700" },
      { value: "2", label: "$$", color: "bg-green-100 text-green-700" },
      { value: "3", label: "$$$", color: "bg-amber-100 text-amber-700" },
      { value: "4", label: "$$$$", color: "bg-red-100 text-red-700" },
    ],
  },
  { key: "visited_date", label: "Visited", type: "date", summary: true },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default function ReviewsPage() {
  return (
    <CrudManager
      table="reviews"
      title="Review Manager"
      description="Sam Score, food scores, notes, and price per restaurant. (Photo upload comes later.)"
      columns={columns}
      addLabel="Review"
    />
  );
}
