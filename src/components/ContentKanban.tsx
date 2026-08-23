"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FieldForm from "@/components/crud/FieldForm";
import type { ColumnDef } from "@/components/crud/types";
import { formatDateLocal } from "@/lib/date";

const STAGES: { value: string; label: string; color: string }[] = [
  { value: "idea", label: "Idea", color: "border-t-neutral-400" },
  { value: "film_scheduled", label: "Film Scheduled", color: "border-t-sky-400" },
  { value: "editing", label: "Filmed/Editing", color: "border-t-blue-400" },
  { value: "scheduled", label: "Ready to Post", color: "border-t-purple-400" },
  { value: "posted", label: "Posted", color: "border-t-green-400" },
];

const columns: ColumnDef[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "inspo_link", label: "Inspo Link", type: "text", placeholder: "https://…" },
  {
    key: "stage",
    label: "Stage",
    type: "select",
    required: true,
    options: STAGES.map((s) => ({ value: s.value, label: s.label })),
  },
  { key: "film_scheduled_date", label: "Film Scheduled Date", type: "date" },
  { key: "film_date", label: "Film Date", type: "date" },
  { key: "posted_date", label: "Posted Date", type: "date" },
  { key: "notes", label: "Notes", type: "textarea" },
];

interface ContentItem {
  [key: string]: unknown;
  id: string;
  title: string;
  inspo_link: string | null;
  stage: string;
  film_scheduled_date: string | null;
  film_date: string | null;
  posted_date: string | null;
  notes: string | null;
}

export default function ContentKanban() {
  const supabase = createClient();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"new" | string | null>(null);
  const [newStage, setNewStage] = useState("idea");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("content_items")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data as ContentItem[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(values: Record<string, unknown>) {
    const { error } = await supabase
      .from("content_items")
      .insert({ ...values, stage: values.stage || newStage });
    if (error) throw new Error(error.message);
    setModal(null);
    await load();
  }

  async function handleUpdate(id: string, values: Record<string, unknown>) {
    const { error } = await supabase.from("content_items").update(values).eq("id", id);
    if (error) throw new Error(error.message);
    setModal(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this content item?")) return;
    const { error } = await supabase.from("content_items").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
  }

  async function moveStage(id: string, stage: string) {
    const prev = items;
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, stage } : i)));
    const { error } = await supabase.from("content_items").update({ stage }).eq("id", id);
    if (error) {
      alert(error.message);
      setItems(prev);
    }
  }

  function mostRecentDate(item: ContentItem): string {
    const dates = [item.film_date, item.posted_date].filter((d): d is string => Boolean(d));
    return dates.length ? dates.sort().pop()! : "";
  }

  if (loading) return <p className="text-sm text-neutral-400">Loading…</p>;

  const editingItem = modal && modal !== "new" ? items.find((i) => i.id === modal) : null;
  const formOpen = modal === "new" || Boolean(editingItem);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Content Pipeline</h1>
          <p className="text-sm text-neutral-500">
            Idea → film scheduled → filmed/editing → ready to post → posted.
          </p>
        </div>
        <button
          onClick={() => {
            setNewStage("idea");
            setModal("new");
          }}
          className="shrink-0 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Content Item
        </button>
      </div>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <FieldForm
              columns={columns}
              initialValues={editingItem ?? { stage: newStage }}
              relationOptions={{}}
              onCancel={() => setModal(null)}
              onSave={editingItem ? (v) => handleUpdate(editingItem.id, v) : handleCreate}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STAGES.map((stage) => {
          const stageItems = items
            .filter((i) => i.stage === stage.value)
            .sort((a, b) => mostRecentDate(b).localeCompare(mostRecentDate(a)));
          return (
            <div
              key={stage.value}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(stage.value);
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={() => {
                if (dragId) moveStage(dragId, stage.value);
                setDragId(null);
                setDragOverStage(null);
              }}
              className={`rounded-lg border-t-4 bg-neutral-50 p-2 ${stage.color} ${
                dragOverStage === stage.value ? "ring-2 ring-neutral-300" : ""
              }`}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-neutral-700">{stage.label}</h3>
                <span className="text-xs text-neutral-400">{stageItems.length}</span>
              </div>

              <div className="min-h-[60px] space-y-2">
                {stageItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDragId(item.id)}
                    onClick={() => setModal(item.id)}
                    className="cursor-pointer rounded-md border border-neutral-200 bg-white p-2.5 shadow-sm hover:border-neutral-300"
                  >
                    <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                    {item.inspo_link && (
                      <a
                        href={item.inspo_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 block truncate text-xs text-blue-600 hover:underline"
                      >
                        🔗 Inspo link
                      </a>
                    )}
                    {item.film_scheduled_date && (
                      <p className="mt-1 text-xs text-neutral-400">
                        📅{" "}
                        {formatDateLocal(item.film_scheduled_date, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                    {item.film_date && (
                      <p className="mt-0.5 text-xs text-neutral-400">
                        🎬 {formatDateLocal(item.film_date, { month: "short", day: "numeric" })}
                      </p>
                    )}
                    {item.posted_date && (
                      <p className="mt-0.5 text-xs text-neutral-400">
                        📤 {formatDateLocal(item.posted_date, { month: "short", day: "numeric" })}
                      </p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="mt-1.5 text-xs font-medium text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setNewStage(stage.value);
                  setModal("new");
                }}
                className="mt-2 w-full rounded-md px-2 py-1 text-left text-xs font-medium text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                + Add
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
