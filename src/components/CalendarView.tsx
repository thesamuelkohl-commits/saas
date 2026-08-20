"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  label: string;
  type: "film" | "due" | "scheduled" | "posted";
  table: "content_items" | "platform_posts";
  field: "film_date" | "due_date" | "posted_at";
}

const TYPE_STYLE: Record<CalendarEvent["type"], string> = {
  film: "bg-blue-100 text-blue-700",
  due: "bg-amber-100 text-amber-700",
  scheduled: "bg-purple-100 text-purple-700",
  posted: "bg-green-100 text-green-700",
};

const TYPE_LABEL: Record<CalendarEvent["type"], string> = {
  film: "Film",
  due: "Due",
  scheduled: "Scheduled",
  posted: "Posted",
};

const EDITABLE_TYPES = new Set<CalendarEvent["type"]>(["film", "scheduled", "posted"]);

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = createClient();
    const [{ data: content }, { data: posts }] = await Promise.all([
      supabase.from("content_items").select("id, title, film_date, due_date"),
      supabase.from("platform_posts").select("id, platform, posted_at, content_items(title)"),
    ]);

    const todayKey = toDateKey(new Date());
    const evts: CalendarEvent[] = [];
    for (const c of (content ?? []) as {
      id: string;
      title: string;
      film_date: string | null;
      due_date: string | null;
    }[]) {
      if (c.film_date) {
        evts.push({
          id: c.id,
          date: c.film_date,
          label: c.title,
          type: "film",
          table: "content_items",
          field: "film_date",
        });
      }
      if (c.due_date) {
        evts.push({
          id: c.id,
          date: c.due_date,
          label: c.title,
          type: "due",
          table: "content_items",
          field: "due_date",
        });
      }
    }
    for (const p of (posts ?? []) as unknown as {
      id: string;
      platform: string;
      posted_at: string | null;
      content_items: { title: string } | null;
    }[]) {
      if (p.posted_at) {
        evts.push({
          id: p.id,
          date: p.posted_at,
          label: `${p.content_items?.title ?? "Untitled"} (${p.platform})`,
          type: p.posted_at > todayKey ? "scheduled" : "posted",
          table: "platform_posts",
          field: "posted_at",
        });
      }
    }
    setEvents(evts);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const weeks = useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startOffset = firstOfMonth.getDay(); // 0 = Sunday
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - startOffset);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7));
    return result;
  }, [cursor]);

  const today = toDateKey(new Date());

  function openEditor(e: CalendarEvent) {
    if (!EDITABLE_TYPES.has(e.type)) return;
    setEditing(e);
    setEditDate(e.date);
  }

  async function handleSaveDate() {
    if (!editing) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from(editing.table)
      .update({ [editing.field]: editDate || null })
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    setEditing(null);
    await load();
  }

  async function handleClearDate() {
    if (!editing) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from(editing.table)
      .update({ [editing.field]: null })
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    setEditing(null);
    await load();
  }

  if (loading) return <p className="text-sm text-neutral-400">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Calendar</h1>
          <p className="text-sm text-neutral-500">
            Film dates, due dates, scheduled posts, and posted content.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            ←
          </button>
          <span className="w-36 text-center text-sm font-medium text-neutral-900">
            {monthLabel}
          </span>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            →
          </button>
          <button
            onClick={() => {
              const now = new Date();
              setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
            }}
            className="rounded-md px-2.5 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
          >
            Today
          </button>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-400" /> Film date
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Due date
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-purple-400" /> Scheduled
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-400" /> Posted
        </span>
        <span className="text-neutral-400">— click a film/scheduled/posted date to edit it</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200">
        <div className="grid grid-cols-7 bg-neutral-50 text-center text-xs font-medium text-neutral-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="border-b border-neutral-200 py-2">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day) => {
              const key = toDateKey(day);
              const inMonth = day.getMonth() === cursor.getMonth();
              const dayEvents = eventsByDay.get(key) ?? [];
              return (
                <div
                  key={key}
                  className={`min-h-[92px] border-b border-r border-neutral-100 p-1.5 last:border-r-0 ${
                    inMonth ? "bg-white" : "bg-neutral-50"
                  }`}
                >
                  <p
                    className={`mb-1 text-xs font-medium ${
                      key === today
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white"
                        : inMonth
                          ? "text-neutral-700"
                          : "text-neutral-300"
                    }`}
                  >
                    {day.getDate()}
                  </p>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <p
                        key={i}
                        onClick={() => openEditor(e)}
                        title={`${TYPE_LABEL[e.type]}: ${e.label}${
                          EDITABLE_TYPES.has(e.type) ? " (click to edit date)" : ""
                        }`}
                        className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${TYPE_STYLE[e.type]} ${
                          EDITABLE_TYPES.has(e.type) ? "cursor-pointer hover:opacity-75" : ""
                        }`}
                      >
                        {e.label}
                      </p>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="px-1 text-[10px] text-neutral-400">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-neutral-900">{editing.label}</p>
            <p className="mb-3 text-xs text-neutral-500">{TYPE_LABEL[editing.type]} date</p>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm outline-none focus:border-neutral-900"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSaveDate}
                disabled={saving}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={handleClearDate}
                disabled={saving}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 disabled:opacity-50"
              >
                Clear date
              </button>
              <button
                onClick={() => setEditing(null)}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
