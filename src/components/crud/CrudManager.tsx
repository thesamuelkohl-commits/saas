"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ColumnDef } from "./types";
import { formatValue, badgeClasses } from "./format";
import FieldForm from "./FieldForm";

interface CrudManagerProps {
  table: string;
  title: string;
  description?: string;
  columns: ColumnDef[];
  orderBy?: string;
  ascending?: boolean;
  addLabel?: string;
  filterFields?: string[];
}

type Row = Record<string, unknown> & { id: string };

export default function CrudManager({
  table,
  title,
  description,
  columns,
  orderBy = "created_at",
  ascending = false,
  addLabel = "New",
  filterFields = [],
}: CrudManagerProps) {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relationOptions, setRelationOptions] = useState<
    Record<string, { value: string; label: string }[]>
  >({});
  const [relationLabels, setRelationLabels] = useState<Record<string, Record<string, string>>>(
    {}
  );
  const [formOpen, setFormOpen] = useState<string | "new" | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const relationColumns = columns.filter((c) => c.type === "relation" && c.relation);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderBy, { ascending });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setRows((data as Row[]) ?? []);

    for (const col of relationColumns) {
      const rel = col.relation!;
      const { data: relData } = await supabase.from(rel.table).select("*");
      if (relData) {
        const opts = (relData as Record<string, unknown>[]).map((r) => ({
          value: String(r.id),
          label: String(r[rel.labelField] ?? r.id),
        }));
        setRelationOptions((prev) => ({ ...prev, [rel.table]: opts }));
        setRelationLabels((prev) => ({
          ...prev,
          [rel.table]: Object.fromEntries(opts.map((o) => [o.value, o.label])),
        }));
      }
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, orderBy, ascending]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(values: Record<string, unknown>) {
    const { error } = await supabase.from(table).insert(values);
    if (error) throw new Error(error.message);
    setFormOpen(null);
    await load();
  }

  async function handleUpdate(id: string, values: Record<string, unknown>) {
    const { error } = await supabase.from(table).update(values).eq("id", id);
    if (error) throw new Error(error.message);
    setFormOpen(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this record? This can't be undone.")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
  }

  const summaryColumns = columns.filter((c) => c.summary && c.type !== "image");
  const displayColumns = summaryColumns.length ? summaryColumns : columns.slice(0, 3);
  const imageColumn = columns.find((c) => c.type === "image");

  const filteredRows = rows.filter((row) =>
    filterFields.every((key) => {
      const active = activeFilters[key];
      if (!active) return true;
      return String(row[key] ?? "") === active;
    })
  );

  function filterOptionsFor(key: string): string[] {
    const values = new Set<string>();
    for (const row of rows) {
      const v = row[key];
      if (v !== null && v !== undefined && v !== "") values.add(String(v));
    }
    return Array.from(values).sort();
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
          {description && <p className="text-sm text-neutral-500">{description}</p>}
        </div>
        <button
          onClick={() => setFormOpen(formOpen === "new" ? null : "new")}
          className="shrink-0 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          {formOpen === "new" ? "Close" : `+ ${addLabel}`}
        </button>
      </div>

      {filterFields.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {filterFields.map((key) => {
            const col = columns.find((c) => c.key === key);
            return (
              <select
                key={key}
                value={activeFilters[key] ?? ""}
                onChange={(e) =>
                  setActiveFilters((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-700 outline-none focus:border-neutral-900"
              >
                <option value="">All {col?.label ?? key}</option>
                {filterOptionsFor(key).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            );
          })}
          {Object.values(activeFilters).some(Boolean) && (
            <button
              onClick={() => setActiveFilters({})}
              className="rounded-md px-2.5 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {formOpen === "new" && (
        <div className="mb-4">
          <FieldForm
            columns={columns}
            relationOptions={relationOptions}
            onCancel={() => setFormOpen(null)}
            onSave={handleCreate}
          />
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
          Nothing here yet.
        </p>
      ) : filteredRows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
          No matches for the current filters.
        </p>
      ) : (
        <div className="space-y-2">
          {filteredRows.map((row) =>
            formOpen === row.id ? (
              <FieldForm
                key={row.id}
                columns={columns}
                initialValues={row}
                relationOptions={relationOptions}
                onCancel={() => setFormOpen(null)}
                onSave={(values) => handleUpdate(row.id, values)}
              />
            ) : (
              <div
                key={row.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-3"
              >
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
                  {imageColumn && (
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-neutral-100">
                      {row[imageColumn.key] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row[imageColumn.key] as string}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      ) : null}
                    </div>
                  )}
                  {displayColumns.map((col) => {
                    const value = row[col.key];
                    const text = formatValue(value, col, relationLabels);
                    if (col.type === "select" && value) {
                      return (
                        <span
                          key={col.key}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClasses(value, col)}`}
                        >
                          {text}
                        </span>
                      );
                    }
                    return (
                      <span key={col.key} className="truncate text-sm text-neutral-800">
                        {text}
                      </span>
                    );
                  })}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setFormOpen(row.id)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(row.id)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
