"use client";

import CrudManager from "@/components/crud/CrudManager";
import type { ColumnDef } from "@/components/crud/types";

const columns: ColumnDef[] = [
  { key: "brand_name", label: "Brand", type: "text", required: true, summary: true },
  {
    key: "stage",
    label: "Stage",
    type: "select",
    required: true,
    summary: true,
    options: [
      { value: "prospect", label: "Prospect", color: "bg-neutral-100 text-neutral-600" },
      { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-700" },
      { value: "negotiating", label: "Negotiating", color: "bg-amber-100 text-amber-700" },
      { value: "deal_closed", label: "Deal Closed", color: "bg-purple-100 text-purple-700" },
      { value: "worked_with", label: "Worked With", color: "bg-green-100 text-green-700" },
      { value: "passed", label: "Passed", color: "bg-red-100 text-red-700" },
    ],
  },
  { key: "deal_value", label: "Deal Value", type: "number", step: "0.01", summary: true },
  { key: "contact_name", label: "Contact Name", type: "text" },
  { key: "contact_email", label: "Contact Email", type: "text" },
  { key: "last_contact_date", label: "Last Contact", type: "date", summary: true },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default function SponsorshipsPage() {
  return (
    <CrudManager
      table="sponsorships"
      title="Sponsorship CRM"
      description="Places to contact, contacted, and worked with."
      columns={columns}
      addLabel="Brand"
    />
  );
}
