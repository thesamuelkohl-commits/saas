"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@/lib/supabase/client";
import FieldForm from "@/components/crud/FieldForm";
import type { ColumnDef } from "@/components/crud/types";

const restaurantIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const meIcon = L.divIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 0 2px #2563eb;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface WishlistRow {
  id: string;
  restaurant_name: string;
  location: string | null;
  cuisine: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  photo_url: string | null;
  reason: string | null;
  notes: string | null;
  priority: number;
  visited: boolean;
  latitude: number | null;
  longitude: number | null;
}

const columns: ColumnDef[] = [
  { key: "photo_url", label: "Photo", type: "image" },
  { key: "restaurant_name", label: "Restaurant", type: "text", required: true },
  { key: "location", label: "Location", type: "text" },
  { key: "cuisine", label: "Cuisine", type: "text" },
  {
    key: "priority",
    label: "Priority",
    type: "select",
    options: [
      { value: "1", label: "High" },
      { value: "2", label: "Medium" },
      { value: "3", label: "Low" },
    ],
  },
  { key: "visited", label: "Visited", type: "checkbox" },
  { key: "address", label: "Address", type: "text" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "website", label: "Website", type: "text" },
  { key: "reason", label: "Why", type: "textarea" },
  { key: "notes", label: "Notes", type: "textarea" },
];

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function RecenterOnLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 11);
  }, [position, map]);
  return null;
}

function websiteHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function WishlistBrowser() {
  const supabase = createClient();
  const [rows, setRows] = useState<WishlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState<string | "new" | null>(null);

  async function load() {
    const { data } = await supabase.from("wishlist_items").select("*");
    setRows((data as WishlistRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation isn't available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => setGeoError("Location permission denied — showing unsorted results."),
      { timeout: 8000 }
    );
  }, []);

  const cities = useMemo(
    () => Array.from(new Set(rows.map((r) => r.location).filter(Boolean))).sort() as string[],
    [rows]
  );
  const cuisines = useMemo(
    () => Array.from(new Set(rows.map((r) => r.cuisine).filter(Boolean))).sort() as string[],
    [rows]
  );

  const filtered = useMemo(() => {
    let result = rows.slice();
    if (cityFilter) result = result.filter((r) => r.location === cityFilter);
    if (cuisineFilter) result = result.filter((r) => r.cuisine === cuisineFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.restaurant_name.toLowerCase().includes(q) ||
          (r.location ?? "").toLowerCase().includes(q) ||
          (r.cuisine ?? "").toLowerCase().includes(q)
      );
    }

    const withDistance = result.map((r) => ({
      ...r,
      _distance:
        userPos && r.latitude !== null && r.longitude !== null
          ? haversineMiles(userPos[0], userPos[1], r.latitude, r.longitude)
          : undefined,
    }));

    withDistance.sort((a, b) => {
      if (a._distance === undefined && b._distance === undefined) return 0;
      if (a._distance === undefined) return 1;
      if (b._distance === undefined) return -1;
      return a._distance - b._distance;
    });

    return withDistance;
  }, [rows, cityFilter, cuisineFilter, search, userPos]);

  const mapped = filtered.filter((r) => r.latitude !== null && r.longitude !== null);
  const missingCoords = rows.length - rows.filter((r) => r.latitude !== null).length;

  async function handleCreate(values: Record<string, unknown>) {
    const { error } = await supabase.from("wishlist_items").insert(values);
    if (error) throw new Error(error.message);
    setFormOpen(null);
    await load();
  }

  async function handleUpdate(id: string, values: Record<string, unknown>) {
    const { error } = await supabase.from("wishlist_items").update(values).eq("id", id);
    if (error) throw new Error(error.message);
    setFormOpen(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this place from your wish list?")) return;
    const { error } = await supabase.from("wishlist_items").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
  }

  if (loading) return <p className="text-sm text-neutral-400">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Wish List</h1>
          <p className="text-sm text-neutral-500">Everywhere you still want to eat.</p>
        </div>
        <button
          onClick={() => setFormOpen(formOpen === "new" ? null : "new")}
          className="shrink-0 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          {formOpen === "new" ? "Close" : "+ Place"}
        </button>
      </div>

      {formOpen === "new" && (
        <div className="mb-4">
          <FieldForm columns={columns} relationOptions={{}} onCancel={() => setFormOpen(null)} onSave={handleCreate} />
        </div>
      )}

      <input
        type="text"
        placeholder="Search by name, city, or food…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-700 outline-none focus:border-neutral-900"
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={cuisineFilter}
          onChange={(e) => setCuisineFilter(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-700 outline-none focus:border-neutral-900"
        >
          <option value="">All Cuisines</option>
          {cuisines.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {(cityFilter || cuisineFilter || search) && (
          <button
            onClick={() => {
              setCityFilter("");
              setCuisineFilter("");
              setSearch("");
            }}
            className="rounded-md px-2.5 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-neutral-400">
          {filtered.length} places
          {missingCoords > 0 && ` · ${missingCoords} not geocoded yet`}
        </span>
      </div>

      {geoError && (
        <p className="mb-3 rounded-md bg-amber-50 p-2.5 text-sm text-amber-700">{geoError}</p>
      )}

      <div className="mb-6 h-[420px] overflow-hidden rounded-lg border border-neutral-200">
        <MapContainer
          center={userPos ?? [39.8283, -98.5795]}
          zoom={userPos ? 11 : 4}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterOnLocation position={userPos} />
          {userPos && (
            <Marker position={userPos} icon={meIcon}>
              <Popup>You are here</Popup>
            </Marker>
          )}
          {mapped.map((r) => (
            <Marker key={r.id} position={[r.latitude!, r.longitude!]} icon={restaurantIcon}>
              <Popup>
                <div className="w-40">
                  {r.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.photo_url}
                      alt=""
                      className="mb-1.5 h-20 w-full rounded object-cover"
                    />
                  )}
                  <p className="text-sm font-semibold">{r.restaurant_name}</p>
                  <p className="text-xs text-neutral-500">{r.cuisine}</p>
                  {r._distance !== undefined && (
                    <p className="mt-1 text-xs font-medium text-neutral-700">
                      {r._distance.toFixed(1)} mi away
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
          No matches.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) =>
            formOpen === r.id ? (
              <div key={r.id} className="sm:col-span-2 lg:col-span-3">
                <FieldForm
                  columns={columns}
                  initialValues={r}
                  relationOptions={{}}
                  onCancel={() => setFormOpen(null)}
                  onSave={(values) => handleUpdate(r.id, values)}
                />
              </div>
            ) : (
              <div
                key={r.id}
                className="overflow-hidden rounded-lg border border-neutral-200 bg-white"
              >
                <div className="h-36 w-full bg-neutral-100">
                  {r.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.photo_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-neutral-900">{r.restaurant_name}</p>
                    {r._distance !== undefined && (
                      <span className="shrink-0 text-xs font-medium text-neutral-500">
                        {r._distance.toFixed(1)} mi
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">{r.location ?? "—"}</p>
                  {r.cuisine && (
                    <span className="mt-2 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                      {r.cuisine}
                    </span>
                  )}
                  {r.website && (
                    <a
                      href={r.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block truncate text-xs text-blue-600 hover:underline"
                    >
                      {websiteHost(r.website)}
                    </a>
                  )}
                  <div className="mt-3 flex gap-2 border-t border-neutral-100 pt-2">
                    <button
                      onClick={() => setFormOpen(r.id)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
