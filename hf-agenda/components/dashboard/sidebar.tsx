"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  ListChecks,
  TrendingUp,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",          label: "Dashboard",       icon: LayoutDashboard },
  { href: "/dashboard/citas",    label: "Citas",           icon: CalendarDays },
  { href: "/dashboard/ventas",   label: "Ventas & Reportes", icon: TrendingUp },
  { href: "/dashboard/clientes", label: "Clientes",        icon: Users },
  { href: "/dashboard/barberos", label: "Barberos",        icon: Scissors },
  { href: "/dashboard/servicios",label: "Servicios",       icon: ListChecks },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#1A1A1A] border-r border-white/5 flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">HF Agenda</p>
            <p className="text-xs text-neutral-500">Hustle Formulas</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <Link
          href="/dashboard/configuracion"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Settings className="w-4 h-4" />
          Configuración
        </Link>
      </div>
    </aside>
  );
}
