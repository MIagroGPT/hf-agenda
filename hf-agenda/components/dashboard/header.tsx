"use client";

import { signOut } from "next-auth/react";
import { Bell, LogOut, User } from "lucide-react";

interface HeaderProps {
  user: {
    name?: string;
    email?: string;
    negocioNombre?: string;
    rol?: string;
  };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="h-16 bg-[#1A1A1A] border-b border-white/5 flex items-center justify-between px-6 shrink-0">
      {/* Negocio */}
      <div>
        <p className="text-sm font-semibold text-white">{user.negocioNombre || "Mi Barbería"}</p>
        <p className="text-xs text-neutral-500 capitalize">{user.rol?.toLowerCase()}</p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all">
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center">
            <User className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-white">{user.name}</p>
            <p className="text-xs text-neutral-500">{user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-2 w-8 h-8 flex items-center justify-center rounded-xl text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
