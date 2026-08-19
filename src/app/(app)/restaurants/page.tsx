"use client";

import CrudManager from "@/components/crud/CrudManager";
import type { ColumnDef } from "@/components/crud/types";

const columns: ColumnDef[] = [
  { key: "name", label: "Name", type: "text", required: true, summary: true },
  { key: "cuisine", label: "Cuisine", type: "text", summary: true },
  { key: "city", label: "City", type: "text", summary: true },
  { key: "address", label: "Address", type: "text" },
];

export default function RestaurantsPage() {
  return (
    <CrudManager
      table="restaurants"
      title="Restaurants"
      description="The master list every review, content item, and website page links back to."
      columns={columns}
      orderBy="name"
      ascending={true}
      addLabel="Restaurant"
    />
  );
}
