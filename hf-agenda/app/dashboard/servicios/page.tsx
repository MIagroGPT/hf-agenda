"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ListChecks, Edit2, Trash2, Clock, DollarSign } from "lucide-react";
import { formatPrecio } from "@/lib/utils";

export default function ServiciosPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ nombre: "", descripcion: "", precio: "", duracion: "", color: "#6366f1" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: servicios = [], isLoading } = useQuery({
    queryKey: ["servicios"],
    queryFn: () => fetch("/api/servicios").then((r) => r.json()),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = editId ? `/api/servicios/${editId}` : "/api/servicios";
    const method = editId ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, precio: parseFloat(form.precio), duracion: parseInt(form.duracion) }),
    });
    queryClient.invalidateQueries({ queryKey: ["servicios"] });
    setForm({ nombre: "", descripcion: "", precio: "", duracion: "", color: "#6366f1" });
    setEditId(null);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este servicio?")) return;
    await fetch(`/api/servicios/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["servicios"] });
  }

  const COLORS = ["#6366f1", "#D4AF37", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Servicios</h1>
        <p className="text-sm text-neutral-500 mt-1">Catálogo de servicios de tu barbería</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2 bg-[#1A1A1A] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            {editId ? "Editar servicio" : "Nuevo servicio"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Nombre *", key: "nombre", placeholder: "Corte clásico" },
              { label: "Descripción", key: "descripcion", placeholder: "Detalles del servicio..." },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">{label}</label>
                <input
                  value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required={key === "nombre"}
                  className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  <DollarSign className="w-3 h-3 inline" /> Precio *
                </label>
                <input
                  type="number"
                  value={form.precio}
                  onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
                  required
                  placeholder="200"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  <Clock className="w-3 h-3 inline" /> Duración (min) *
                </label>
                <input
                  type="number"
                  value={form.duracion}
                  onChange={(e) => setForm((f) => ({ ...f, duracion: e.target.value }))}
                  required
                  placeholder="45"
                  min="5"
                  className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c} type="button"
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
                <button type="button" onClick={() => { setEditId(null); setForm({ nombre: "", descripcion: "", precio: "", duracion: "", color: "#6366f1" }); }}
                  className="px-4 py-2.5 border border-white/10 text-neutral-400 hover:text-white rounded-xl text-sm transition-all">
                  Cancelar
                </button>
              )}
              <button type="submit" disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#D4AF37] hover:bg-[#c9a82e] disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-all">
                <Plus className="w-4 h-4" />
                {editId ? "Actualizar" : "Agregar"}
              </button>
            </div>
          </form>
        </div>

        {/* Lista */}
        <div className="lg:col-span-3 bg-[#1A1A1A] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Servicios ({servicios.length})</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
            </div>
          ) : servicios.length === 0 ? (
            <div className="text-center py-10">
              <ListChecks className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">Sin servicios todavía</p>
            </div>
          ) : (
            <div className="space-y-2">
              {servicios.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: s.color + "20" }}>
                    <ListChecks className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{s.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <Clock className="w-3 h-3" />{s.duracion} min
                      </span>
                      <span className="text-xs font-semibold text-[#D4AF37]">{formatPrecio(s.precio)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { setEditId(s.id); setForm({ nombre: s.nombre, descripcion: s.descripcion || "", precio: s.precio.toString(), duracion: s.duracion.toString(), color: s.color }); }}
                      className="p-2 text-neutral-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
