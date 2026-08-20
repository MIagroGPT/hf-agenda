"use client";

import { useState } from "react";
import { X, User } from "lucide-react";

interface ClienteModalProps {
  open: boolean;
  onClose: () => void;
  cliente?: any;
  onSuccess: () => void;
}

export function ClienteModal({ open, onClose, cliente, onSuccess }: ClienteModalProps) {
  const [form, setForm] = useState({
    nombre: cliente?.nombre || "",
    telefono: cliente?.telefono || "",
    email: cliente?.email || "",
    fechaNac: cliente?.fechaNac?.slice(0, 10) || "",
    etiqueta: cliente?.etiqueta || "NUEVO",
    notas: cliente?.notas || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = cliente ? `/api/clientes/${cliente.id}` : "/api/clientes";
      const method = cliente ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Error al guardar");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const field = (label: string, key: string, type = "text", placeholder = "") => (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
      />
    </div>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-[#D4AF37]" />
            {cliente ? "Editar Cliente" : "Nuevo Cliente"}
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {field("Nombre *", "nombre", "text", "Juan Pérez")}
          {field("Teléfono *", "telefono", "tel", "+52 55 1234 5678")}
          {field("Email", "email", "email", "juan@email.com")}
          {field("Fecha de nacimiento", "fechaNac", "date")}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Etiqueta</label>
            <select
              value={form.etiqueta}
              onChange={(e) => setForm((f) => ({ ...f, etiqueta: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
            >
              {["NUEVO", "REGULAR", "VIP", "INACTIVO"].map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              rows={3}
              placeholder="Preferencias, alergias, notas..."
              className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm resize-none focus:outline-none focus:border-[#D4AF37]/50 transition-all"
            />
          </div>
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-white/10 text-neutral-400 hover:text-white rounded-xl text-sm font-medium transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-[#c9a82e] disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-all">
              {loading ? "Guardando..." : cliente ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
