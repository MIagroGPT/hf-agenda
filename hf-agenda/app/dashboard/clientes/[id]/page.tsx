"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ArrowLeft, Phone, Mail, Calendar, Edit2, Scissors } from "lucide-react";
import Link from "next/link";
import { cn, formatFecha, formatHora, formatPrecio, ETIQUETA_COLORES, ESTADO_COLORES } from "@/lib/utils";
import { useState } from "react";

interface Cita {
  id: string;
  inicio: string;
  fin: string;
  estado: string;
  precio?: number;
  barbero?: { nombre: string; color: string };
  servicio?: { nombre: string };
}

interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  notas?: string;
  fechaNac?: string;
  visitas: number;
  ultimaVisita?: string;
  etiqueta: string;
  createdAt: string;
  citas: Cita[];
  error?: string;
}

export default function ClienteDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [editingNotas, setEditingNotas] = useState(false);
  const [notas, setNotas] = useState("");

  const { data: cliente, isLoading } = useQuery<Cliente>({
    queryKey: ["cliente", id],
    queryFn: () =>
      fetch(`/api/clientes/${id}`)
        .then((r) => r.json())
        .then((d: Cliente) => { setNotas(d.notas || ""); return d; }),
  });

  async function saveNotas() {
    await fetch(`/api/clientes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notas }),
    });
    queryClient.invalidateQueries({ queryKey: ["cliente", id] });
    setEditingNotas(false);
  }

  async function updateEtiqueta(etiqueta: string) {
    await fetch(`/api/clientes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etiqueta }),
    });
    queryClient.invalidateQueries({ queryKey: ["cliente", id] });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
      </div>
    );
  }

  if (!cliente || cliente.error) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-500">Cliente no encontrado</p>
        <Link href="/dashboard/clientes" className="text-[#D4AF37] text-sm mt-2 block">
          Volver a clientes
        </Link>
      </div>
    );
  }

  const ETIQUETAS = ["NUEVO", "REGULAR", "VIP", "INACTIVO"];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/dashboard/clientes"
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Clientes
        </Link>

        {/* Header cliente */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-2xl font-bold text-[#D4AF37]">
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{cliente.nombre}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {cliente.telefono && (
                <span className="flex items-center gap-1 text-sm text-neutral-400">
                  <Phone className="w-3.5 h-3.5" />{cliente.telefono}
                </span>
              )}
              {cliente.email && (
                <span className="flex items-center gap-1 text-sm text-neutral-400">
                  <Mail className="w-3.5 h-3.5" />{cliente.email}
                </span>
              )}
            </div>
          </div>
          {/* Cambiar etiqueta */}
          <div className="flex flex-wrap gap-1.5">
            {ETIQUETAS.map((e) => (
              <button
                key={e}
                onClick={() => updateEtiqueta(e)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-lg border transition-all",
                  cliente.etiqueta === e
                    ? ETIQUETA_COLORES[e]
                    : "bg-transparent border-white/10 text-neutral-600 hover:border-white/20"
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total visitas", value: cliente.visitas },
          { label: "Última visita", value: cliente.ultimaVisita ? formatFecha(cliente.ultimaVisita, "d MMM") : "—" },
          { label: "Miembro desde", value: formatFecha(cliente.createdAt, "MMM yyyy") },
          { label: "Citas registradas", value: cliente.citas?.length || 0 },
        ].map((s) => (
          <div key={s.label} className="bg-[#1A1A1A] border border-white/5 rounded-xl p-4">
            <p className="text-xs text-neutral-500">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notas */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Notas del barbero</h3>
            <button
              onClick={() => (editingNotas ? saveNotas() : setEditingNotas(true))}
              className="text-xs text-[#D4AF37] hover:underline"
            >
              {editingNotas ? "Guardar" : <Edit2 className="w-3.5 h-3.5" />}
            </button>
          </div>
          {editingNotas ? (
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={5}
              placeholder="Alergias, preferencias, color aplicado..."
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-[#D4AF37]/50"
            />
          ) : (
            <p className="text-sm text-neutral-400 whitespace-pre-wrap">
              {cliente.notas || "Sin notas todavía. Haz clic en el icono para agregar."}
            </p>
          )}
        </div>

        {/* Historial de citas */}
        <div className="lg:col-span-2 bg-[#1A1A1A] border border-white/5 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Historial de citas</h3>
          <div className="space-y-2">
            {(cliente.citas || []).length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">Sin citas registradas</p>
            ) : (
              cliente.citas.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: (c.barbero?.color || "#6366f1") + "20" }}
                  >
                    <Scissors className="w-3.5 h-3.5" style={{ color: c.barbero?.color || "#6366f1" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">{c.servicio?.nombre}</p>
                    <p className="text-xs text-neutral-500">
                      {c.barbero?.nombre} · {formatFecha(c.inicio, "d MMM yyyy")} {formatHora(c.inicio)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {c.precio && (
                      <p className="text-xs font-semibold text-[#D4AF37]">{formatPrecio(c.precio)}</p>
                    )}
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-md border", ESTADO_COLORES[c.estado])}>
                      {c.estado}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
