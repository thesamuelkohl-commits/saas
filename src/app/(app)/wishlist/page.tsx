"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import CrudManager from "@/components/crud/CrudManager";
import type { ColumnDef } from "@/components/crud/types";

const WishlistMap = dynamic(() => import("@/components/WishlistMap"), {
  ssr: false,
  loading: () => <p className="text-sm text-neutral-400">Loading map…</p>,
});

const columns: ColumnDef[] = [
  { key: "photo_url", label: "Photo", type: "image", summary: true },
  { key: "restaurant_name", label: "Restaurant", type: "text", required: true, summary: true },
  { key: "location", label: "Location", type: "text", summary: true },
  { key: "cuisine", label: "Cuisine", type: "text", summary: true },
  {
    key: "priority",
    label: "Priority",
    type: "select",
    summary: true,
    options: [
      { value: "1", label: "High", color: "bg-red-100 text-red-700" },
      { value: "2", label: "Medium", color: "bg-amber-100 text-amber-700" },
      { value: "3", label: "Low", color: "bg-neutral-100 text-neutral-600" },
    ],
  },
  { key: "visited", label: "Visited", type: "checkbox", summary: true },
  { key: "address", label: "Address", type: "text" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "website", label: "Website", type: "text" },
  { key: "reason", label: "Why", type: "textarea" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default function WishlistPage() {
  const [view, setView] = useState<"list" | "map">("map");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Wish List</h1>
          <p className="text-sm text-neutral-500">Everywhere you still want to eat.</p>
        </div>
        <div className="flex rounded-md border border-neutral-300 bg-white p-0.5">
          <button
            onClick={() => setView("map")}
            className={`rounded px-3 py-1 text-sm font-medium ${
              view === "map" ? "bg-neutral-900 text-white" : "text-neutral-600"
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded px-3 py-1 text-sm font-medium ${
              view === "list" ? "bg-neutral-900 text-white" : "text-neutral-600"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {view === "map" ? (
        <WishlistMap />
      ) : (
        <CrudManager
          table="wishlist_items"
          title=""
          columns={columns}
          addLabel="Place"
          filterFields={["location", "cuisine"]}
        />
      )}
    </div>
  );
}
