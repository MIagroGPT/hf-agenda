import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFecha(fecha: Date | string, formatStr = "PPP") {
  const d = typeof fecha === "string" ? parseISO(fecha) : fecha;
  return format(d, formatStr, { locale: es });
}

export function formatHora(fecha: Date | string) {
  const d = typeof fecha === "string" ? parseISO(fecha) : fecha;
  return format(d, "HH:mm", { locale: es });
}

export function formatPrecio(precio: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(precio);
}

export const ESTADO_COLORES: Record<string, string> = {
  PENDIENTE:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  CONFIRMADA:  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  COMPLETADA:  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  CANCELADA:   "bg-red-500/20 text-red-400 border-red-500/30",
  NO_SHOW:     "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export const ETIQUETA_COLORES: Record<string, string> = {
  NUEVO:    "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  REGULAR:  "bg-slate-500/20 text-slate-400 border-slate-500/30",
  VIP:      "bg-amber-500/20 text-amber-400 border-amber-500/30",
  INACTIVO: "bg-red-500/20 text-red-400 border-red-500/30",
};
