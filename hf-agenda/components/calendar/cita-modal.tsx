"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Calendar, User, Scissors, Clock } from "lucide-react";
import { format, addMinutes, setHours, setMinutes, parseISO, isValid } from "date-fns";

interface CitaModalProps {
  open: boolean;
  onClose: () => void;
  cita?: any;
  defaultDate?: string | null;
  onSuccess: () => void;
}

const ESTADOS = ["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA", "NO_SHOW"];

/**
 * Convierte cualquier fecha (Date, string ISO, "2026-08-20") a formato válido para <input type="datetime-local">
 * Formato requerido: "yyyy-MM-dd'T'HH:mm"
 */
function toDateTimeLocalString(dateInput?: string | Date | null): string {
  try {
    if (!dateInput) {
      // Si no hay fecha, poner hoy a la siguiente hora en punto (ej. 15:00)
      const now = new Date();
      const nextHour = setMinutes(setHours(now, now.getHours() + 1), 0);
      return format(nextHour, "yyyy-MM-dd'T'HH:mm");
    }

    if (typeof dateInput === "string") {
      // Si viene solo fecha "2026-08-20" (vista de mes)
      if (dateInput.length === 10) {
        return `${dateInput}T10:00`;
      }
      const parsed = parseISO(dateInput);
      if (isValid(parsed)) {
        return format(parsed, "yyyy-MM-dd'T'HH:mm");
      }
    }

    if (dateInput instanceof Date && isValid(dateInput)) {
      return format(dateInput, "yyyy-MM-dd'T'HH:mm");
    }
  } catch (err) {
    console.error("Error formateando fecha:", err);
  }

  const fallback = new Date();
  return format(fallback, "yyyy-MM-dd'T'HH:mm");
}

export function CitaModal({ open, onClose, cita, defaultDate, onSuccess }: CitaModalProps) {
  const [form, setForm] = useState({
    clienteId: "",
    barberoId: "",
    servicioId: "",
    inicio: "",
    fin: "",
    notas: "",
    precio: "",
    estado: "PENDIENTE",
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-select"],
    queryFn: () => fetch("/api/clientes?limit=100").then((r) => r.json().then((d: any) => d.clientes || [])),
  });
  const { data: barberos = [] } = useQuery({
    queryKey: ["barberos"],
    queryFn: () => fetch("/api/barberos").then((r) => r.json()),
  });
  const { data: servicios = [] } = useQuery({
    queryKey: ["servicios"],
    queryFn: () => fetch("/api/servicios").then((r) => r.json()),
  });

  // Inicializar o resetear formulario al abrir modal o cambiar fecha
  useEffect(() => {
    if (!open) return;

    if (cita) {
      setForm({
        clienteId: cita.clienteId || "",
        barberoId: cita.barberoId || "",
        servicioId: cita.servicioId || "",
        inicio: toDateTimeLocalString(cita.inicio),
        fin: toDateTimeLocalString(cita.fin),
        notas: cita.notas || "",
        precio: cita.precio !== null && cita.precio !== undefined ? cita.precio.toString() : "",
        estado: cita.estado || "PENDIENTE",
      });
    } else {
      const inicioLocal = toDateTimeLocalString(defaultDate);
      const finLocal = toDateTimeLocalString(addMinutes(parseISO(inicioLocal), 30));

      setForm({
        clienteId: clientes[0]?.id || "",
        barberoId: barberos[0]?.id || "",
        servicioId: servicios[0]?.id || "",
        inicio: inicioLocal,
        fin: finLocal,
        notas: "",
        precio: servicios[0]?.precio ? servicios[0].precio.toString() : "",
        estado: "PENDIENTE",
      });
    }
  }, [open, cita, defaultDate]);

  // Recalcular fin y precio automáticamente cuando cambia el servicio
  function handleServicioChange(servicioId: string) {
    const servicio = servicios.find((s: any) => s.id === servicioId);
    if (!servicio) {
      setForm((f) => ({ ...f, servicioId }));
      return;
    }

    const duracionMin = servicio.duracion || 30;
    let finCalculado = form.fin;

    if (form.inicio) {
      const inicioDate = parseISO(form.inicio);
      if (isValid(inicioDate)) {
        finCalculado = format(addMinutes(inicioDate, duracionMin), "yyyy-MM-dd'T'HH:mm");
      }
    }

    setForm((f) => ({
      ...f,
      servicioId,
      fin: finCalculado,
      precio: servicio.precio ? servicio.precio.toString() : f.precio,
    }));
  }

  // Recalcular fin automáticamente cuando cambia inicio
  function handleInicioChange(inicioVal: string) {
    let finCalculado = form.fin;
    const servicio = servicios.find((s: any) => s.id === form.servicioId);
    const duracionMin = servicio?.duracion || 30;

    const inicioDate = parseISO(inicioVal);
    if (isValid(inicioDate)) {
      finCalculado = format(addMinutes(inicioDate, duracionMin), "yyyy-MM-dd'T'HH:mm");
    }

    setForm((f) => ({
      ...f,
      inicio: inicioVal,
      fin: finCalculado,
    }));
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.clienteId) {
      setError("Debes seleccionar un cliente");
      setLoading(false);
      return;
    }
    if (!form.barberoId) {
      setError("Debes seleccionar un barbero");
      setLoading(false);
      return;
    }
    if (!form.servicioId) {
      setError("Debes seleccionar un servicio");
      setLoading(false);
      return;
    }
    if (!form.inicio || !form.fin) {
      setError("Debes ingresar fecha y hora de inicio y fin");
      setLoading(false);
      return;
    }

    const inicioDate = new Date(form.inicio);
    const finDate = new Date(form.fin);

    if (!isValid(inicioDate) || !isValid(finDate)) {
      setError("Formato de fecha inválido");
      setLoading(false);
      return;
    }

    const payload = {
      clienteId: form.clienteId,
      barberoId: form.barberoId,
      servicioId: form.servicioId,
      inicio: inicioDate.toISOString(),
      fin: finDate.toISOString(),
      notas: form.notas || undefined,
      precio: form.precio ? parseFloat(form.precio) : undefined,
      estado: form.estado,
    };

    try {
      const url = "/api/citas";
      const method = cita ? "PATCH" : "POST";
      const body = cita ? { id: cita.id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Error al guardar la cita");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            {cita ? "Editar Cita" : "Nueva Cita"}
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1" />Cliente *
            </label>
            <select
              value={form.clienteId}
              onChange={(e) => setForm((f) => ({ ...f, clienteId: e.target.value }))}
              required
              className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.nombre} — {c.telefono}</option>
              ))}
            </select>
          </div>

          {/* Barbero y Servicio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                <Scissors className="w-3.5 h-3.5 inline mr-1" />Barbero *
              </label>
              <select
                value={form.barberoId}
                onChange={(e) => setForm((f) => ({ ...f, barberoId: e.target.value }))}
                required
                className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
              >
                <option value="">Barbero...</option>
                {barberos.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Servicio *</label>
              <select
                value={form.servicioId}
                onChange={(e) => handleServicioChange(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
              >
                <option value="">Servicio...</option>
                {servicios.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.nombre} ({s.duracion}min)</option>
                ))}
              </select>
            </div>
          </div>

          {/* Inicio y Fin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                <Clock className="w-3.5 h-3.5 inline mr-1" />Inicio *
              </label>
              <input
                type="datetime-local"
                value={form.inicio}
                onChange={(e) => handleInicioChange(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Fin *</label>
              <input
                type="datetime-local"
                value={form.fin}
                onChange={(e) => setForm((f) => ({ ...f, fin: e.target.value }))}
                required
                className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
              />
            </div>
          </div>

          {/* Precio y Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Precio ($ MXN)</label>
              <input
                type="number"
                value={form.precio}
                onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
              />
            </div>
            {cita && (
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
                >
                  {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              rows={2}
              placeholder="Notas adicionales..."
              className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm resize-none focus:outline-none focus:border-[#D4AF37]/50 transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 rounded-xl text-sm font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-[#c9a82e] disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-all"
            >
              {loading ? "Guardando..." : cita ? "Actualizar" : "Crear Cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
