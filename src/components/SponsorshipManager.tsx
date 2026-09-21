"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FieldForm from "@/components/crud/FieldForm";
import type { ColumnDef } from "@/components/crud/types";
import { formatDateLocal, todayLocal } from "@/lib/date";

const STAGE_OPTIONS = [
  { value: "prospect", label: "Prospect", color: "bg-neutral-100 text-neutral-600" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-700" },
  { value: "responded", label: "Responded", color: "bg-sky-100 text-sky-700" },
  // Stored as call_discussion so existing rows need no migration; only the label changed.
  { value: "call_discussion", label: "Negotiating", color: "bg-amber-100 text-amber-700" },
  { value: "won", label: "Won", color: "bg-green-100 text-green-700" },
  { value: "monthly_client", label: "Monthly Client", color: "bg-emerald-100 text-emerald-700" },
  { value: "lost_not_now", label: "Lost/Not Now", color: "bg-red-100 text-red-700" },
];

const PRIORITY_OPTIONS = [
  { value: "1", label: "High" },
  { value: "2", label: "Medium" },
  { value: "3", label: "Low" },
];

const BILLING_TYPE_OPTIONS = [
  { value: "one_time", label: "One-Time" },
  { value: "monthly", label: "Monthly" },
];

const CATEGORY_OPTIONS = ["Restaurant/Bar/Coffee", "Product", "Hotel", "Event", "Venue", "Shop"].map(
  (c) => ({ value: c, label: c })
);

const companyColumns: ColumnDef[] = [
  { key: "brand_name", label: "Company", type: "text", required: true },
  { key: "category", label: "Category", type: "select", options: CATEGORY_OPTIONS },
  { key: "location", label: "Location", type: "text" },
  { key: "email", label: "Email", type: "text", placeholder: "info@…" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "instagram_url", label: "Instagram", type: "text", placeholder: "https://instagram.com/…" },
  { key: "website", label: "Website", type: "text", placeholder: "https://…" },
  { key: "tiktok_url", label: "TikTok", type: "text", placeholder: "https://tiktok.com/@…" },
  { key: "lead_source", label: "Lead Source", type: "text", placeholder: "e.g. Instagram, Referral, Walk-in" },
  { key: "priority", label: "Priority", type: "select", options: PRIORITY_OPTIONS },
  { key: "stage", label: "Status", type: "select", required: true, options: STAGE_OPTIONS },
  { key: "deal_value", label: "Quoted $", type: "number", step: "0.01" },
  { key: "billing_type", label: "One-Time/Monthly", type: "select", options: BILLING_TYPE_OPTIONS },
  { key: "closed_amount", label: "Closed $", type: "number", step: "0.01" },
];

const contactColumns: ColumnDef[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "role", label: "Role", type: "text", placeholder: "e.g. Marketing Manager" },
  { key: "email", label: "Email", type: "text" },
  { key: "phone", label: "Phone", type: "text" },
];

const ACTIVITY_TYPES = [
  { value: "call", label: "Call", emoji: "📞" },
  { value: "text", label: "Text", emoji: "💬" },
  { value: "ig_dm", label: "IG DM", emoji: "📷" },
  { value: "email", label: "Email", emoji: "✉️" },
  { value: "meeting", label: "Meeting", emoji: "🤝" },
  { value: "note", label: "Note", emoji: "📝" },
  { value: "other", label: "Other", emoji: "📌" },
];

const ACTIVITY_EMOJI: Record<string, string> = Object.fromEntries(
  ACTIVITY_TYPES.map((t) => [t.value, t.emoji])
);
const ACTIVITY_LABEL: Record<string, string> = Object.fromEntries(
  ACTIVITY_TYPES.map((t) => [t.value, t.label])
);

interface Company {
  [key: string]: unknown;
  id: string;
  brand_name: string;
  category: string | null;
  location: string | null;
  lead_source: string | null;
  priority: number | null;
  stage: string;
  deal_value: number | null;
  billing_type: string | null;
  closed_amount: number | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  created_at: string;
}

interface Contact {
  [key: string]: unknown;
  id: string;
  company_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
}

interface Activity {
  id: string;
  company_id: string;
  type: string;
  notes: string | null;
  occurred_at: string;
}

export default function SponsorshipManager() {
  const supabase = createClient();
  const [rows, setRows] = useState<Company[]>([]);
  const [lastActivityByCompany, setLastActivityByCompany] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"new" | string | null>(null);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactModal, setContactModal] = useState<"new" | string | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityType, setActivityType] = useState("call");
  const [activityDate, setActivityDate] = useState(() => todayLocal());
  const [activityNotes, setActivityNotes] = useState("");
  const [savingActivity, setSavingActivity] = useState(false);

  async function load() {
    const [{ data }, { data: allActivities }] = await Promise.all([
      supabase.from("companies").select("*"),
      supabase.from("company_activities").select("company_id, occurred_at, type"),
    ]);

    const lastActivity: Record<string, string> = {};
    for (const a of (allActivities ?? []) as { company_id: string; occurred_at: string; type: string }[]) {
      if (a.type === "note") continue;
      if (!lastActivity[a.company_id] || a.occurred_at > lastActivity[a.company_id]) {
        lastActivity[a.company_id] = a.occurred_at;
      }
    }
    setLastActivityByCompany(lastActivity);

    const companies = (data as Company[]) ?? [];
    companies.sort((a, b) => {
      const aActivity = lastActivity[a.id];
      const bActivity = lastActivity[b.id];
      if (aActivity && !bActivity) return -1;
      if (!aActivity && bActivity) return 1;
      if (aActivity && bActivity) return bActivity.localeCompare(aActivity);
      return b.created_at.localeCompare(a.created_at);
    });
    setRows(companies);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editing = modal && modal !== "new" ? rows.find((r) => r.id === modal) : null;
  const formOpen = modal === "new" || Boolean(editing);
  const editingContact =
    contactModal && contactModal !== "new" ? contacts.find((c) => c.id === contactModal) : null;

  const searchedRows = search.trim()
    ? rows.filter((r) => {
        const q = search.trim().toLowerCase();
        return r.brand_name.toLowerCase().includes(q) || (r.location ?? "").toLowerCase().includes(q);
      })
    : rows;

  const categories = Array.from(
    new Set(rows.map((r) => r.category).filter((c): c is string => Boolean(c)))
  ).sort();

  async function loadContacts(companyId: string) {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });
    setContacts((data as Contact[]) ?? []);
  }

  async function loadActivities(companyId: string) {
    const { data } = await supabase
      .from("company_activities")
      .select("*")
      .eq("company_id", companyId)
      .order("occurred_at", { ascending: false });
    setActivities((data as Activity[]) ?? []);
  }

  function openDetail(id: string) {
    setModal(id);
    setContactModal(null);
    setActivityType("call");
    setActivityDate(todayLocal());
    setActivityNotes("");
    loadContacts(id);
    loadActivities(id);
  }

  async function handleCreate(values: Record<string, unknown>) {
    const { error } = await supabase.from("companies").insert(values);
    if (error) throw new Error(error.message);
    setModal(null);
    await load();
  }

  async function handleUpdate(id: string, values: Record<string, unknown>) {
    const { error } = await supabase.from("companies").update(values).eq("id", id);
    if (error) throw new Error(error.message);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this company? This also deletes its contacts and activity history."))
      return;
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setModal(null);
    await load();
  }

  async function handleCreateContact(values: Record<string, unknown>) {
    if (!editing) return;
    const { error } = await supabase.from("contacts").insert({ ...values, company_id: editing.id });
    if (error) throw new Error(error.message);
    setContactModal(null);
    await loadContacts(editing.id);
  }

  async function handleUpdateContact(id: string, values: Record<string, unknown>) {
    if (!editing) return;
    const { error } = await supabase.from("contacts").update(values).eq("id", id);
    if (error) throw new Error(error.message);
    setContactModal(null);
    await loadContacts(editing.id);
  }

  async function handleDeleteContact(id: string) {
    if (!editing) return;
    if (!confirm("Delete this contact?")) return;
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    await loadContacts(editing.id);
  }

  async function handleLogActivity() {
    if (!editing) return;
    setSavingActivity(true);
    const { error } = await supabase.from("company_activities").insert({
      company_id: editing.id,
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
    await load();
  }

  async function handleDeleteActivity(id: string) {
    if (!editing) return;
    const { error } = await supabase.from("company_activities").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    await loadActivities(editing.id);
    await load();
  }

  if (loading) return <p className="text-sm text-neutral-400">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">CRM</h1>
          <p className="text-sm text-neutral-500">Places to contact, contacted, and worked with.</p>
        </div>
        <button
          onClick={() => setModal("new")}
          className="shrink-0 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Company
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name or location…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStageFilter("all")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
            stageFilter === "all"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          All ({searchedRows.length})
        </button>
        {STAGE_OPTIONS.map((s) => {
          const count = searchedRows.filter((r) => r.stage === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setStageFilter(s.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
                stageFilter === s.value
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {categories.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-700 outline-none focus:border-neutral-900"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {categoryFilter !== "all" && (
            <button
              onClick={() => setCategoryFilter("all")}
              className="text-sm font-medium text-neutral-500 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {modal === "new" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setModal(null)}
        >
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <FieldForm
              columns={companyColumns}
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
              <h2 className="mb-4 text-base font-semibold text-neutral-900">{editing.brand_name}</h2>
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Activity History</h3>

              <div className="mb-4 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <div className="flex flex-wrap gap-2">
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
                <button
                  onClick={handleLogActivity}
                  // A note is only its text, so an empty one has nothing to save.
                  disabled={savingActivity || (activityType === "note" && !activityNotes.trim())}
                  className="ml-auto rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {activityType === "note" ? "Add Note" : "Log"}
                </button>
                </div>
                <textarea
                  rows={activityType === "note" ? 4 : 2}
                  placeholder={activityType === "note" ? "Write a note…" : "Notes (optional)"}
                  value={activityNotes}
                  onChange={(e) => setActivityNotes(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-neutral-900"
                />
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
                          {a.notes && <p className="whitespace-pre-wrap text-sm text-neutral-600">{a.notes}</p>}
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

            <div className="border-b border-neutral-100 p-4">
              <FieldForm
                columns={companyColumns}
                initialValues={editing}
                relationOptions={{}}
                onCancel={() => setModal(null)}
                onSave={(v) => handleUpdate(editing.id, v)}
              />
              <button
                onClick={() => handleDelete(editing.id)}
                className="mt-2 text-xs font-medium text-red-600 hover:underline"
              >
                Delete company
              </button>
            </div>

            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">Contacts</h3>
                <button
                  onClick={() => setContactModal(contactModal === "new" ? null : "new")}
                  className="rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white"
                >
                  {contactModal === "new" ? "Close" : "+ Contact"}
                </button>
              </div>

              {contactModal === "new" && (
                <div className="mb-3">
                  <FieldForm
                    columns={contactColumns}
                    relationOptions={{}}
                    onCancel={() => setContactModal(null)}
                    onSave={handleCreateContact}
                  />
                </div>
              )}

              {contacts.length === 0 && contactModal !== "new" ? (
                <p className="text-sm text-neutral-400">No contacts added yet.</p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((c) =>
                    contactModal === c.id ? (
                      <FieldForm
                        key={c.id}
                        columns={contactColumns}
                        initialValues={c}
                        relationOptions={{}}
                        onCancel={() => setContactModal(null)}
                        onSave={(v) => handleUpdateContact(c.id, v)}
                      />
                    ) : (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 bg-white p-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900">
                            {c.name || "Unnamed contact"}
                            {c.role && <span className="font-normal text-neutral-400"> · {c.role}</span>}
                          </p>
                          <p className="truncate text-xs text-neutral-500">
                            {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => setContactModal(c.id)}
                            className="text-xs font-medium text-neutral-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteContact(c.id)}
                            className="text-xs font-medium text-red-500 hover:underline"
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
          </div>
        </div>
      )}

      {(() => {
        const visibleRows = searchedRows.filter(
          (r) =>
            (stageFilter === "all" || r.stage === stageFilter) &&
            (categoryFilter === "all" || r.category === categoryFilter)
        );
        if (rows.length === 0) {
          return (
            <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
              Nothing here yet.
            </p>
          );
        }
        if (visibleRows.length === 0) {
          return (
            <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
              No matches for this filter.
            </p>
          );
        }
        return (
          <div className="space-y-2">
            {visibleRows.map((r) => (
              <div
                key={r.id}
                onClick={() => openDetail(r.id)}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-3 hover:border-neutral-300"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-medium text-neutral-900">{r.brand_name}</span>
                  {lastActivityByCompany[r.id] ? (
                    <span className="text-sm text-neutral-500">
                      Last activity:{" "}
                      {formatDateLocal(lastActivityByCompany[r.id], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  ) : (
                    <span className="text-sm text-neutral-300">No activity yet</span>
                  )}
                </div>
                <span className="shrink-0 text-xs font-medium text-neutral-400">View →</span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
