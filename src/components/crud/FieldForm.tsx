"use client";

import { useState } from "react";
import type { ColumnDef } from "./types";

interface FieldFormProps {
  columns: ColumnDef[];
  initialValues?: Record<string, unknown>;
  relationOptions: Record<string, { value: string; label: string }[]>;
  onCancel: () => void;
  onSave: (values: Record<string, unknown>) => Promise<void>;
}

export default function FieldForm({
  columns,
  initialValues,
  relationOptions,
  onCancel,
  onSave,
}: FieldFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = columns.filter((c) => !c.hideInForm);

  function setField(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        cleaned[k] = v === "" ? null : v;
      }
      await onSave(cleaned);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2"
    >
      {fields.map((col) => (
        <div
          key={col.key}
          className={col.type === "textarea" ? "sm:col-span-2" : ""}
        >
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            {col.label}
            {col.required && <span className="text-red-500"> *</span>}
          </label>

          {col.type === "textarea" ? (
            <textarea
              required={col.required}
              placeholder={col.placeholder}
              value={(values[col.key] as string) ?? ""}
              onChange={(e) => setField(col.key, e.target.value)}
              rows={3}
              className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm outline-none focus:border-neutral-900"
            />
          ) : col.type === "select" ? (
            <select
              required={col.required}
              value={(values[col.key] as string) ?? ""}
              onChange={(e) => setField(col.key, e.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-neutral-900"
            >
              <option value="">Select…</option>
              {col.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : col.type === "relation" && col.relation ? (
            <select
              required={col.required}
              value={(values[col.key] as string) ?? ""}
              onChange={(e) => setField(col.key, e.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-neutral-900"
            >
              <option value="">None</option>
              {relationOptions[col.relation.table]?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : col.type === "image" ? (
            <div className="flex items-center gap-2">
              {values[col.key] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={values[col.key] as string}
                  alt=""
                  className="h-10 w-10 rounded object-cover"
                  onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                />
              ) : null}
              <input
                type="text"
                placeholder={col.placeholder ?? "Image URL"}
                value={(values[col.key] as string) ?? ""}
                onChange={(e) => setField(col.key, e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm outline-none focus:border-neutral-900"
              />
            </div>
          ) : col.type === "checkbox" ? (
            <input
              type="checkbox"
              checked={Boolean(values[col.key])}
              onChange={(e) => setField(col.key, e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
          ) : (
            <input
              type={col.type === "number" ? "number" : col.type === "date" ? "date" : "text"}
              step={col.step}
              required={col.required}
              placeholder={col.placeholder}
              value={(values[col.key] as string | number) ?? ""}
              onChange={(e) =>
                setField(
                  col.key,
                  col.type === "number" ? e.target.valueAsNumber || null : e.target.value
                )
              }
              className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm outline-none focus:border-neutral-900"
            />
          )}
        </div>
      ))}

      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
