"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench } from "lucide-react";

export function GlassNavbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="relative z-50 border-b border-white/[0.06] backdrop-blur-xl bg-black/[0.3]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 text-white no-underline hover:opacity-80 transition-opacity group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
            <Wrench size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Ree<span className="text-indigo-400">Tools</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {!isHome && (
            <Link
              href="/"
              className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              Home
            </Link>
          )}
          <Link
            href="/tools/tiktok"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white/80 hover:text-white border border-white/[0.06] hover:border-indigo-500/30 transition-all"
          >
            TikTok Tools
          </Link>
        </div>
      </div>
    </nav>
  );
}
