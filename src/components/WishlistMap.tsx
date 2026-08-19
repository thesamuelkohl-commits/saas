"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@/lib/supabase/client";

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
  website: string | null;
  photo_url: string | null;
  visited: boolean;
  latitude: number | null;
  longitude: number | null;
}

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

export default function WishlistMap() {
  const [rows, setRows] = useState<WishlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("wishlist_items").select("*");
      setRows((data as WishlistRow[]) ?? []);
      setLoading(false);
    }
    load();
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
    let result = rows.filter((r) => r.latitude !== null && r.longitude !== null);
    if (cityFilter) result = result.filter((r) => r.location === cityFilter);
    if (cuisineFilter) result = result.filter((r) => r.cuisine === cuisineFilter);

    if (userPos) {
      result = result
        .map((r) => ({
          ...r,
          _distance: haversineMiles(userPos[0], userPos[1], r.latitude!, r.longitude!),
        }))
        .sort((a, b) => a._distance - b._distance);
    }
    return result as (WishlistRow & { _distance?: number })[];
  }, [rows, cityFilter, cuisineFilter, userPos]);

  const missingCoords = rows.length - rows.filter((r) => r.latitude !== null).length;

  if (loading) return <p className="text-sm text-neutral-400">Loading map…</p>;

  return (
    <div>
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
        {(cityFilter || cuisineFilter) && (
          <button
            onClick={() => {
              setCityFilter("");
              setCuisineFilter("");
            }}
            className="rounded-md px-2.5 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-neutral-400">
          {filtered.length} shown
          {missingCoords > 0 && ` · ${missingCoords} not geocoded yet`}
        </span>
      </div>

      {geoError && (
        <p className="mb-3 rounded-md bg-amber-50 p-2.5 text-sm text-amber-700">{geoError}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="h-[520px] overflow-hidden rounded-lg border border-neutral-200">
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
            {filtered.map((r) => (
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

        <div className="h-[520px] space-y-2 overflow-y-auto">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-2.5"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-neutral-100">
                {r.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photo_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {r.restaurant_name}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {r.cuisine ?? "—"} · {r.location ?? "—"}
                </p>
              </div>
              {r._distance !== undefined && (
                <span className="shrink-0 text-xs font-medium text-neutral-600">
                  {r._distance.toFixed(1)} mi
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
