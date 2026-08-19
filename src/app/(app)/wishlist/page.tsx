"use client";

import dynamic from "next/dynamic";

const WishlistBrowser = dynamic(() => import("@/components/WishlistBrowser"), {
  ssr: false,
  loading: () => <p className="text-sm text-neutral-400">Loading…</p>,
});

export default function WishlistPage() {
  return <WishlistBrowser />;
}
