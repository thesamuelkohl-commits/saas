import type { ColumnDef } from "./types";
import { formatDateLocal } from "@/lib/date";

export function formatValue(
  value: unknown,
  column: ColumnDef,
  relationOptions: Record<string, Record<string, string>>
): string {
  if (value === null || value === undefined || value === "") return "—";

  if (column.type === "relation" && column.relation) {
    const labels = relationOptions[column.relation.table];
    return labels?.[String(value)] ?? "—";
  }

  if (column.type === "select") {
    const opt = column.options?.find((o) => o.value === value);
    return opt?.label ?? String(value);
  }

  if (column.type === "checkbox") {
    return value ? "Yes" : "No";
  }

  if (column.type === "date") {
    const str = String(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    return formatDateLocal(str);
  }

  if (column.key.toLowerCase().includes("amount") || column.key.toLowerCase().includes("value")) {
    const n = Number(value);
    if (!Number.isNaN(n) && column.type === "number") {
      return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }

  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";

  return String(value);
}

export function badgeClasses(value: unknown, column: ColumnDef): string {
  const opt = column.options?.find((o) => o.value === value);
  return opt?.color ?? "bg-neutral-100 text-neutral-700";
}
