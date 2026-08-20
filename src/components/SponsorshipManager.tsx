"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FieldForm from "@/components/crud/FieldForm";
import type { ColumnDef } from "@/components/crud/types";
import { formatDateLocal, todayLocal } from "@/lib/date";

const STAGE_OPTIONS = [
  { value: "prospect", label: "Prospect", color: "bg-neutral-100 text-neutral-600" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-700" },
  { value: "negotiating", label: "Negotiating", color: "bg-amber-100 text-amber-700" },
  { value: "deal_closed", label: "Deal Closed", color: "bg-purple-100 text-purple-700" },
  { value: "worked_with", label: "Worked With", color: "bg-green-100 text-green-700" },
  { value: "passed", label: "Passed", color: "bg-red-100 text-red-700" },
];

const columns: ColumnDef[] = [
  { key: "brand_name", label: "Brand", type: "text", required: true },
  { key: "stage", label: "Stage", type: "select", required: true, options: STAGE_OPTIONS },
  { key: "deal_value", label: "Deal Value", type: "number", step: "0.01" },
  { key: "contact_name", label: "Contact Name", type: "text" },
  { key: "contact_email", label: "Contact Email", type: "text" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "last_contact_date", label: "Last Contact", type: "date" },
  { key: "notes", label: "Notes", type: "textarea" },
];

const ACTIVITY_TYPES = [
  { value: "call", label: "Call", emoji: "📞" },
  { value: "text", label: "Text", emoji: "💬" },
  { value: "email", label: "Email", emoji: "✉️" },
  { value: "meeting", label: "Meeting", emoji: "🤝" },
  { value: "other", label: "Other", emoji: "📌" },
];

const ACTIVITY_EMOJI: Record<string, string> = Object.fromEntries(
  ACTIVITY_TYPES.map((t) => [t.value, t.emoji])
);
const ACTIVITY_LABEL: Record<string, string> = Object.fromEntries(
  ACTIVITY_TYPES.map((t) => [t.value, t.label])
);

interface Sponsorship {
  [key: string]: unknown;
  id: string;
  brand_name: string;
  stage: string;
  deal_value: number | null;
  contact_name: string | null;
  contact_email: string | null;
  phone: string | null;
  last_contact_date: string | null;
  notes: string | null;
}

interface Activity {
  id: string;
  sponsorship_id: string;
  type: string;
  notes: string | null;
  occurred_at: string;
}

function badgeClasses(stage: string) {
  return STAGE_OPTIONS.find((s) => s.value === stage)?.color ?? "bg-neutral-100 text-neutral-600";
}
function stageLabel(stage: string) {
  return STAGE_OPTIONS.find((s) => s.value === stage)?.label ?? stage;
}

export default function SponsorshipManager() {
  const supabase = createClient();
  const [rows, setRows] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"new" | string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityType, setActivityType] = useState("call");
  const [activityDate, setActivityDate] = useState(() => todayLocal());
  const [activityNotes, setActivityNotes] = useState("");
  const [savingActivity, setSavingActivity] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("sponsorships")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data as Sponsorship[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editing = modal && modal !== "new" ? rows.find((r) => r.id === modal) : null;
  const formOpen = modal === "new" || Boolean(editing);

  async function loadActivities(sponsorshipId: string) {
    const { data } = await supabase
      .from("sponsorship_activities")
      .select("*")
      .eq("sponsorship_id", sponsorshipId)
      .order("occurred_at", { ascending: false });
    setActivities((data as Activity[]) ?? []);
  }

  function openDetail(id: string) {
    setModal(id);
    setActivityType("call");
    setActivityDate(todayLocal());
    setActivityNotes("");
    loadActivities(id);
  }

  async function handleCreate(values: Record<string, unknown>) {
    const { error } = await supabase.from("sponsorships").insert(values);
    if (error) throw new Error(error.message);
    setModal(null);
    await load();
  }

  async function handleUpdate(id: string, values: Record<string, unknown>) {
    const { error } = await supabase.from("sponsorships").update(values).eq("id", id);
    if (error) throw new Error(error.message);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this contact? This also deletes its activity history.")) return;
    const { error } = await supabase.from("sponsorships").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setModal(null);
    await load();
  }

  async function handleLogActivity() {
    if (!editing) return;
    setSavingActivity(true);
    const { error } = await supabase.from("sponsorship_activities").insert({
      sponsorship_id: editing.id,
      type: activityType,
      occurred_at: activityDate,
      notes: activityNotes || null,
    });
    setSavingActivity(false);
    if (error) {
      alert(error.message);
      return;
    }
    setActivityNotes("");
    await loadActivities(editing.id);
  }

  async function handleDeleteActivity(id: string) {
    if (!editing) return;
    const { error } = await supabase.from("sponsorship_activities").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    await loadActivities(editing.id);
  }

  if (loading) return <p className="text-sm text-neutral-400">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Sponsorship CRM</h1>
          <p className="text-sm text-neutral-500">Places to contact, contacted, and worked with.</p>
        </div>
        <button
          onClick={() => setModal("new")}
          className="shrink-0 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Brand
        </button>
      </div>

      {modal === "new" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setModal(null)}
        >
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <FieldForm
              columns={columns}
              relationOptions={{}}
              onCancel={() => setModal(null)}
              onSave={handleCreate}
            />
          </div>
        </div>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-neutral-200 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-neutral-100 p-4">
              <FieldForm
                columns={columns}
                initialValues={editing}
                relationOptions={{}}
                onCancel={() => setModal(null)}
                onSave={(v) => handleUpdate(editing.id, v)}
              />
              <button
                onClick={() => handleDelete(editing.id)}
                className="mt-2 text-xs font-medium text-red-600 hover:underline"
              >
                Delete contact
              </button>
            </div>

            <div className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Activity History</h3>

              <div className="mb-4 grid grid-cols-1 gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-[auto_auto_1fr_auto]">
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm"
                >
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.emoji} {t.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
                />
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={activityNotes}
                  onChange={(e) => setActivityNotes(e.target.value)}
                  className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
                />
                <button
                  onClick={handleLogActivity}
                  disabled={savingActivity}
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Log
                </button>
              </div>

              {activities.length === 0 ? (
                <p className="text-sm text-neutral-400">No activity logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {activities.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start justify-between gap-2 rounded-md border border-neutral-200 bg-white p-2.5"
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        <span>{ACTIVITY_EMOJI[a.type] ?? "📌"}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900">
                            {ACTIVITY_LABEL[a.type] ?? a.type}{" "}
                            <span className="font-normal text-neutral-400">
                              ·{" "}
                              {formatDateLocal(a.occurred_at, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </p>
                          {a.notes && <p className="text-sm text-neutral-600">{a.notes}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteActivity(a.id)}
                        className="shrink-0 text-xs font-medium text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
          Nothing here yet.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              onClick={() => openDetail(r.id)}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-3 hover:border-neutral-300"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-medium text-neutral-900">{r.brand_name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClasses(r.stage)}`}>
                  {stageLabel(r.stage)}
                </span>
                {r.deal_value !== null && (
                  <span className="text-sm text-neutral-600">
                    ${Number(r.deal_value).toLocaleString()}
                  </span>
                )}
                {r.phone && <span className="text-sm text-neutral-500">{r.phone}</span>}
              </div>
              <span className="shrink-0 text-xs font-medium text-neutral-400">View →</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
