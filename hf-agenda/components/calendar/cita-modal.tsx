"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Calendar, User, Scissors, Clock, UserPlus, Check } from "lucide-react";
import { format, addMinutes, setHours, setMinutes, parseISO, isValid, isBefore } from "date-fns";

interface CitaModalProps {
  open: boolean;
  onClose: () => void;
  cita?: any;
  defaultDate?: string | null;
  onSuccess: () => void;
}

const ESTADOS = ["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA", "NO_SHOW"];

function toDateTimeLocalString(dateInput?: string | Date | null): string {
  try {
    const now = new Date();
    if (!dateInput) {
      const nextHour = setMinutes(setHours(now, now.getHours() + 1), 0);
      return format(nextHour, "yyyy-MM-dd'T'HH:mm");
    }

    if (typeof dateInput === "string") {
      if (dateInput.length === 10) {
        // "2026-08-20"
        return `${dateInput}T10:00`;
      }
      const parsed = parseISO(dateInput);
      if (isValid(parsed)) {
        // Si la fecha seleccionada está en el pasado, avanzar a hoy
        if (isBefore(parsed, now)) {
          const nextHour = setMinutes(setHours(now, now.getHours() + 1), 0);
          return format(nextHour, "yyyy-MM-dd'T'HH:mm");
        }
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
  const queryClient = useQueryClient();
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

  // Estado para creación rápida de cliente
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", telefono: "" });
  const [guardandoCliente, setGuardandoCliente] = useState(false);

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-select"],
    queryFn: () => fetch("/api/clientes?limit=200").then((r) => r.json().then((d: any) => d.clientes || [])),
  });
  const { data: barberos = [] } = useQuery({
    queryKey: ["barberos"],
    queryFn: () => fetch("/api/barberos").then((r) => r.json()),
  });
  const { data: servicios = [] } = useQuery({
    queryKey: ["servicios"],
    queryFn: () => fetch("/api/servicios").then((r) => r.json()),
  });
  const { data: citas = [] } = useQuery({
    queryKey: ["citas-all"],
    queryFn: () => fetch("/api/citas").then((r) => r.json()),
  });

  // Inicializar o resetear formulario
  useEffect(() => {
    if (!open) return;

    setCreandoCliente(false);
    setNuevoCliente({ nombre: "", telefono: "" });

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
        clienteId: "", // Siempre inicia vacío para seleccionar
        barberoId: "", // Se seleccionará según disponibilidad
        servicioId: "",
        inicio: inicioLocal,
        fin: finLocal,
        notas: "",
        precio: "",
        estado: "PENDIENTE",
      });
    }
  }, [open, cita, defaultDate]);

  // Recalcular fin y precio al cambiar servicio
  function handleServicioChange(servicioId: string) {
    const servicio = servicios.find((s: any) => s.id === servicioId);
    if (!servicio) {
      setForm((f) => ({ ...f, servicioId, precio: "" }));
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

  // Recalcular fin al cambiar inicio
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

  // Comprobar disponibilidad de un barbero para la fecha/hora seleccionada
  function checkDisponibilidadBarbero(b: any) {
    if (!form.inicio || !form.fin) return { disponible: true, motivo: "Disponible" };

    const inicioDate = parseISO(form.inicio);
    const finDate = parseISO(form.fin);

    if (!isValid(inicioDate) || !isValid(finDate)) return { disponible: true, motivo: "Disponible" };

    // 1. Verificar día de la semana (0=Dom, 1=Lun, ..., 6=Sab)
    const diaSemana = inicioDate.getDay().toString();
    const diasTrabajo = (b.diasTrabajo || "1,2,3,4,5,6").split(",");
    if (!diasTrabajo.includes(diaSemana)) {
      return { disponible: false, motivo: "No labora este día" };
    }

    // 2. Verificar horario de trabajo (HH:mm)
    const horaInicioCita = format(inicioDate, "HH:mm");
    const horaFinCita = format(finDate, "HH:mm");
    const barberoInicio = b.horaInicio || "09:00";
    const barberoFin = b.horaFin || "20:00";

    if (horaInicioCita < barberoInicio || horaFinCita > barberoFin) {
      return { disponible: false, motivo: `Horario: ${barberoInicio} - ${barberoFin}` };
    }

    // 3. Verificar si tiene cita solapada
    const solapada = citas.find((c: any) => {
      if (c.id === cita?.id) return false;
      if (c.barberoId !== b.id) return false;
      if (c.estado === "CANCELADA") return false;

      const cInicio = new Date(c.inicio);
      const cFin = new Date(c.fin);
      return inicioDate < cFin && finDate > cInicio;
    });

    if (solapada) {
      return { disponible: false, motivo: "Ocupado en este horario" };
    }

    return { disponible: true, motivo: "Disponible" };
  }

  // Crear cliente rápido al vuelo
  async function handleCrearClienteRapido(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoCliente.nombre || !nuevoCliente.telefono) return;

    setGuardandoCliente(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoCliente.nombre,
          telefono: nuevoCliente.telefono,
          etiqueta: "NUEVO",
        }),
      });
      const clienteCreado = await res.json();
      if (!res.ok) throw new Error(clienteCreado.error?.message || "Error al crear cliente");

      await queryClient.invalidateQueries({ queryKey: ["clientes-select"] });
      setForm((f) => ({ ...f, clienteId: clienteCreado.id }));
      setCreandoCliente(false);
      setNuevoCliente({ nombre: "", telefono: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGuardandoCliente(false);
    }
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const minDateTime = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.clienteId) {
      setError("Por favor selecciona un cliente o agrega uno nuevo");
      setLoading(false);
      return;
    }
    if (!form.barberoId) {
      setError("Por favor selecciona un barbero");
      setLoading(false);
      return;
    }
    if (!form.servicioId) {
      setError("Por favor selecciona un servicio");
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

    // Validación estricta de fechas en el pasado
    const ahoraMenos5Min = new Date(Date.now() - 5 * 60 * 1000);
    if (inicioDate < ahoraMenos5Min) {
      setError("No se pueden agendar citas en fechas u horas pasadas");
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
      <div className="relative w-full max-w-lg bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            {cita ? "Editar Cita" : "Nueva Cita"}
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* CLIENTE */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-neutral-400">
                <User className="w-3.5 h-3.5 inline mr-1" /> Cliente *
              </label>
              {!creandoCliente && (
                <button
                  type="button"
                  onClick={() => setCreandoCliente(true)}
                  className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 font-medium"
                >
                  <UserPlus className="w-3 h-3" /> + Agregar nuevo cliente
                </button>
              )}
            </div>

            {creandoCliente ? (
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-[#D4AF37]/30 space-y-3">
                <p className="text-xs font-semibold text-[#D4AF37] flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5" /> Registrar nuevo cliente rápido
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Nombre completo *"
                    value={nuevoCliente.nombre}
                    onChange={(e) => setNuevoCliente((c) => ({ ...c, nombre: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]/50"
                  />
                  <input
                    placeholder="Teléfono (WhatsApp) *"
                    value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente((c) => ({ ...c, telefono: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]/50"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreandoCliente(false)}
                    className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded-lg border border-white/10"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCrearClienteRapido}
                    disabled={guardandoCliente || !nuevoCliente.nombre || !nuevoCliente.telefono}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#D4AF37] hover:bg-[#c9a82e] text-black rounded-lg disabled:opacity-50 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    {guardandoCliente ? "Guardando..." : "Guardar y Seleccionar"}
                  </button>
                </div>
              </div>
            ) : (
              <select
                value={form.clienteId}
                onChange={(e) => {
                  if (e.target.value === "NUEVO") {
                    setCreandoCliente(true);
                  } else {
                    setForm((f) => ({ ...f, clienteId: e.target.value }));
                  }
                }}
                required
                className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
              >
                <option value="">-- Seleccionar cliente --</option>
                {clientes.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} — {c.telefono} ({c.etiqueta || "REGULAR"})
                  </option>
                ))}
                <option value="NUEVO" className="font-semibold text-[#D4AF37]">
                  + Agregar nuevo cliente...
                </option>
              </select>
            )}
          </div>

          {/* FECHA Y HORA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                <Clock className="w-3.5 h-3.5 inline mr-1" /> Inicio *
              </label>
              <input
                type="datetime-local"
                min={minDateTime}
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
                min={minDateTime}
                value={form.fin}
                onChange={(e) => setForm((f) => ({ ...f, fin: e.target.value }))}
                required
                className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
              />
            </div>
          </div>

          {/* SERVICIO & BARBERO */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Servicio *</label>
              <select
                value={form.servicioId}
                onChange={(e) => handleServicioChange(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
              >
                <option value="">-- Seleccionar servicio --</option>
                {servicios.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.duracion}min - ${s.precio})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                <Scissors className="w-3.5 h-3.5 inline mr-1" /> Barbero *
              </label>
              <select
                value={form.barberoId}
                onChange={(e) => setForm((f) => ({ ...f, barberoId: e.target.value }))}
                required
                className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all"
              >
                <option value="">-- Seleccionar barbero --</option>
                {barberos.map((b: any) => {
                  const { disponible, motivo } = checkDisponibilidadBarbero(b);
                  return (
                    <option
                      key={b.id}
                      value={b.id}
                      disabled={!disponible}
                      className={disponible ? "text-white" : "text-neutral-500"}
                    >
                      {b.nombre} {disponible ? "✓ (Disponible)" : `✗ (${motivo})`}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* PRECIO Y ESTADO */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Precio ($ MXN)</label>
              <input
                type="number"
                value={form.precio}
                onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
                placeholder="0.00"
                min="0"
                step="0.01"
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
                  {ESTADOS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* NOTAS */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Notas / Comentarios</label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              rows={2}
              placeholder="Preferencias del cliente, estilo de corte..."
              className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm resize-none focus:outline-none focus:border-[#D4AF37]/50 transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              {error}
            </p>
          )}
        </div>

        {/* Footer con botones de acción */}
        <div className="p-4 border-t border-white/5 flex gap-3 shrink-0 bg-[#161616]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 rounded-xl text-sm font-medium transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-[#c9a82e] disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-all"
          >
            {loading ? "Guardando..." : cita ? "Actualizar Cita" : "Crear Cita"}
          </button>
        </div>
      </div>
    </div>
  );
}
