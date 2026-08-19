"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-4">
        <p className="text-sm font-semibold text-neutral-900">Eat With Sam K</p>
        <p className="text-xs text-neutral-400">Ops hub</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span>{item.emoji}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-neutral-200 p-2">
        <button
          onClick={handleSignOut}
          className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-500 hover:bg-neutral-100"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
