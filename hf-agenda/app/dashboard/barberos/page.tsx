"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Scissors, Edit2, Trash2, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = [
  { id: "1", label: "Lun" },
  { id: "2", label: "Mar" },
  { id: "3", label: "Mié" },
  { id: "4", label: "Jue" },
  { id: "5", label: "Vie" },
  { id: "6", label: "Sáb" },
  { id: "0", label: "Dom" },
];

export default function BarberosPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    color: "#6366f1",
    horaInicio: "09:00",
    horaFin: "20:00",
    diasTrabajo: "1,2,3,4,5,6",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: barberos = [], isLoading } = useQuery({
    queryKey: ["barberos"],
    queryFn: () => fetch("/api/barberos").then((r) => r.json()),
  });

  function toggleDia(diaId: string) {
    const actuales = form.diasTrabajo.split(",").filter(Boolean);
    let nuevos: string[];
    if (actuales.includes(diaId)) {
      nuevos = actuales.filter((d) => d !== diaId);
    } else {
      nuevos = [...actuales, diaId];
    }
    setForm((f) => ({ ...f, diasTrabajo: nuevos.join(",") }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = editId ? `/api/barberos/${editId}` : "/api/barberos";
    const method = editId ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    queryClient.invalidateQueries({ queryKey: ["barberos"] });
    setForm({
      nombre: "",
      telefono: "",
      color: "#6366f1",
      horaInicio: "09:00",
      horaFin: "20:00",
      diasTrabajo: "1,2,3,4,5,6",
    });
    setEditId(null);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este barbero?")) return;
    await fetch(`/api/barberos/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["barberos"] });
  }

  function handleEdit(b: any) {
    setEditId(b.id);
    setForm({
      nombre: b.nombre,
      telefono: b.telefono || "",
      color: b.color || "#6366f1",
      horaInicio: b.horaInicio || "09:00",
      horaFin: b.horaFin || "20:00",
      diasTrabajo: b.diasTrabajo || "1,2,3,4,5,6",
    });
  }

  const COLORS = ["#6366f1", "#D4AF37", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Barberos & Estilistas</h1>
        <p className="text-sm text-neutral-500 mt-1">Gestiona tu equipo, sus horarios y disponibilidad</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2 bg-[#1A1A1A] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            {editId ? "Editar Barbero & Horario" : "Nuevo Barbero"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Nombre *</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                required
                placeholder="Carlos Ramírez"
                className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Teléfono</label>
              <input
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                placeholder="+52 55 1234 5678"
                className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
              />
            </div>

            {/* Días laborales */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" /> Días de trabajo
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DIAS_SEMANA.map((d) => {
                  const activo = form.diasTrabajo.split(",").includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDia(d.id)}
                      className={cn(
                        "px-2.5 py-1 text-xs rounded-lg border font-medium transition-all",
                        activo
                          ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40"
                          : "bg-[#0F0F0F] text-neutral-500 border-white/10 hover:text-white"
                      )}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horario de trabajo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  <Clock className="w-3 h-3 inline mr-1" /> Entrada
                </label>
                <input
                  type="time"
                  value={form.horaInicio}
                  onChange={(e) => setForm((f) => ({ ...f, horaInicio: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  <Clock className="w-3 h-3 inline mr-1" /> Salida
                </label>
                <input
                  type="time"
                  value={form.horaFin}
                  onChange={(e) => setForm((f) => ({ ...f, horaFin: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
                />
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2">Color en calendario</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c,
                      borderColor: form.color === c ? "white" : "transparent",
                      transform: form.color === c ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {editId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setForm({
                      nombre: "",
                      telefono: "",
                      color: "#6366f1",
                      horaInicio: "09:00",
                      horaFin: "20:00",
                      diasTrabajo: "1,2,3,4,5,6",
                    });
                  }}
                  className="px-4 py-2.5 border border-white/10 text-neutral-400 hover:text-white rounded-xl text-sm transition-all"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#D4AF37] hover:bg-[#c9a82e] disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                {editId ? "Actualizar" : "Agregar"}
              </button>
            </div>
          </form>
        </div>

        {/* Lista */}
        <div className="lg:col-span-3 bg-[#1A1A1A] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Equipo actual ({barberos.length})</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
            </div>
          ) : barberos.length === 0 ? (
            <div className="text-center py-10">
              <Scissors className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">Sin barberos todavía</p>
            </div>
          ) : (
            <div className="space-y-3">
              {barberos.map((b: any) => {
                const diasActivos = (b.diasTrabajo || "1,2,3,4,5,6").split(",");
                return (
                  <div key={b.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ backgroundColor: (b.color || "#6366f1") + "20", color: b.color || "#6366f1" }}
                      >
                        {b.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{b.nombre}</p>
                        {b.telefono && <p className="text-xs text-neutral-400">{b.telefono}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleEdit(b)}
                          className="p-2 text-neutral-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-all"
                          title="Editar horario y datos"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Horario y días */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{b.horaInicio || "09:00"} — {b.horaFin || "20:00"}</span>
                      </div>
                      <div className="flex gap-1">
                        {DIAS_SEMANA.map((d) => (
                          <span
                            key={d.id}
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-medium",
                              diasActivos.includes(d.id)
                                ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                                : "text-neutral-600 opacity-40"
                            )}
                          >
                            {d.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
