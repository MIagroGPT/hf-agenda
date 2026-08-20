"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Users, Star, UserCheck, UserX, ChevronRight } from "lucide-react";
import { cn, ETIQUETA_COLORES, formatFecha } from "@/lib/utils";
import Link from "next/link";
import { ClienteModal } from "@/components/crm/cliente-modal";

const ETIQUETAS = ["TODOS", "NUEVO", "REGULAR", "VIP", "INACTIVO"] as const;

export default function ClientesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [etiqueta, setEtiqueta] = useState("TODOS");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const params = new URLSearchParams({
    search,
    page: page.toString(),
    ...(etiqueta !== "TODOS" && { etiqueta }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["clientes", search, etiqueta, page],
    queryFn: () => fetch(`/api/clientes?${params}`).then((r) => r.json()),
    placeholderData: (prev) => prev,
  });

  const clientes = data?.clientes || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-sm text-neutral-500 mt-1">{total} clientes en total</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c9a82e] text-black text-sm font-semibold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre, teléfono o email..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-xl text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37]/50 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {ETIQUETAS.map((e) => (
            <button
              key={e}
              onClick={() => { setEtiqueta(e); setPage(1); }}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                etiqueta === e
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30"
                  : "bg-[#1A1A1A] text-neutral-400 border-white/10 hover:border-white/20"
              )}
            >
              {e === "TODOS" ? "Todos" : e}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No se encontraron clientes</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-5 py-3">Cliente</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Teléfono</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Última visita</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-5 py-3">Visitas</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-5 py-3">Etiqueta</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {clientes.map((c: any) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{c.nombre}</p>
                        {c.email && <p className="text-xs text-neutral-500">{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <p className="text-sm text-neutral-300">{c.telefono}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <p className="text-sm text-neutral-400">
                      {c.ultimaVisita ? formatFecha(c.ultimaVisita, "d MMM yyyy") : "—"}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-white">{c.visitas}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("text-xs px-2 py-0.5 rounded-lg border font-medium", ETIQUETA_COLORES[c.etiqueta])}>
                      {c.etiqueta}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/dashboard/clientes/${c.id}`}>
                      <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-[#D4AF37] transition-colors" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <p className="text-xs text-neutral-500">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs border border-white/10 rounded-lg text-neutral-400 hover:text-white hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Anterior
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs border border-white/10 rounded-lg text-neutral-400 hover:text-white hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <ClienteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["clientes"] });
          setModalOpen(false);
        }}
      />
    </div>
  );
}
