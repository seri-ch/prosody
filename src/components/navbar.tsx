"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, BarChart3, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all",
      isLanding ? "bg-transparent" : "glass border-b border-white/5"
    )}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
            <Mic className="w-4 h-4 text-accent-light" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Prosody
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <NavLink href="/practice" active={pathname === "/practice"}>
            <Zap className="w-4 h-4" />
            Practice
          </NavLink>
          <NavLink href="/dashboard" active={pathname === "/dashboard"}>
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-accent/15 text-accent-light"
          : "text-muted hover:text-foreground hover:bg-white/5"
      )}
    >
      {children}
    </Link>
  );
}
