"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Scissors, Edit2, Trash2 } from "lucide-react";

export default function BarberosPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ nombre: "", telefono: "", color: "#6366f1" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: barberos = [], isLoading } = useQuery({
    queryKey: ["barberos"],
    queryFn: () => fetch("/api/barberos").then((r) => r.json()),
  });

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
    setForm({ nombre: "", telefono: "", color: "#6366f1" });
    setEditId(null);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este barbero?")) return;
    await fetch(`/api/barberos/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["barberos"] });
  }

  const COLORS = ["#6366f1", "#D4AF37", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Barberos & Estilistas</h1>
        <p className="text-sm text-neutral-500 mt-1">Gestiona tu equipo de trabajo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2 bg-[#1A1A1A] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            {editId ? "Editar barbero" : "Agregar barbero"}
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
                  onClick={() => { setEditId(null); setForm({ nombre: "", telefono: "", color: "#6366f1" }); }}
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
          <h2 className="text-sm font-semibold text-white mb-4">Equipo actual</h2>
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
            <div className="space-y-2">
              {barberos.map((b: any) => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: b.color + "20", color: b.color }}
                  >
                    {b.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{b.nombre}</p>
                    {b.telefono && <p className="text-xs text-neutral-500">{b.telefono}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditId(b.id); setForm({ nombre: b.nombre, telefono: b.telefono || "", color: b.color }); }}
                      className="p-2 text-neutral-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
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
