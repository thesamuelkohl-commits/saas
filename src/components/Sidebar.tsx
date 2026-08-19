"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/", label: "Dashboard", emoji: "📊" },
  { href: "/content", label: "Content Pipeline", emoji: "🎥" },
  { href: "/calendar", label: "Calendar", emoji: "📅" },
  { href: "/platforms", label: "Platform Tracker", emoji: "📱" },
  { href: "/wishlist", label: "Wish List", emoji: "📝" },
  { href: "/seo", label: "SEO Tracker", emoji: "🔎" },
  { href: "/sponsorships", label: "Sponsorship CRM", emoji: "🤝" },
  { href: "/revenue", label: "Revenue", emoji: "💰" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const currentLabel = NAV.find((item) => item.href === pathname)?.label ?? "Eat With Sam K";

  return (
    <>
      {/* mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-4 sm:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100"
        >
          ☰
        </button>
        <p className="truncate text-sm font-semibold text-neutral-900">{currentLabel}</p>
      </div>

      {/* mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 sm:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 sm:static sm:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "sm:w-16" : "sm:w-64"}`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
          <div className={collapsed ? "sm:hidden" : ""}>
            <p className="text-sm font-semibold text-neutral-900">Eat With Sam K</p>
            <p className="text-xs text-neutral-400">Ops hub</p>
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-6 w-6 shrink-0 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 sm:flex"
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  collapsed ? "sm:justify-center" : ""
                } ${active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
              >
                <span>{item.emoji}</span>
                <span className={collapsed ? "sm:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-neutral-200 p-2">
          <button
            onClick={handleSignOut}
            title={collapsed ? "Sign out" : undefined}
            className={`w-full rounded-md px-3 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100 ${
              collapsed ? "sm:text-center" : "text-left"
            }`}
          >
            <span className={collapsed ? "sm:hidden" : ""}>Sign out</span>
            <span className={collapsed ? "hidden sm:inline" : "hidden"}>⏻</span>
          </button>
        </div>
      </aside>
    </>
  );
}
