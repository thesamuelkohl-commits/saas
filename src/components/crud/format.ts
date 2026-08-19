import type { ColumnDef } from "./types";

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
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
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
