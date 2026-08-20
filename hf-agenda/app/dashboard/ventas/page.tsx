"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  Scissors,
  Calendar,
  Clock,
  User,
  ShoppingBag,
  Award,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatPrecio, formatFecha, formatHora, cn } from "@/lib/utils";

const PERIODOS = [
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "Esta Semana" },
  { id: "mes", label: "Este Mes" },
  { id: "ano", label: "Este Año" },
  { id: "todo", label: "Todo" },
];

export default function VentasPage() {
  const [periodo, setPeriodo] = useState("mes");

  const { data, isLoading } = useQuery({
    queryKey: ["ventas", periodo],
    queryFn: () => fetch(`/api/ventas?periodo=${periodo}`).then((r) => r.json()),
  });

  const resumen = data?.resumen || {
    totalIngresos: 0,
    totalServicios: 0,
    ticketPromedio: 0,
    ingresosPendientes: 0,
    citasPendientesCount: 0,
  };

  const ventasPorBarbero = data?.ventasPorBarbero || [];
  const ventasPorServicio = data?.ventasPorServicio || [];
  const evolucion = data?.evolucion || [];
  const ultimasVentas = data?.ultimasVentas || [];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header & Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
            Ventas & Finanzas
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Reporte de ingresos, rendimiento por barbero y servicios más vendidos
          </p>
        </div>

        {/* Selector de Período */}
        <div className="flex items-center gap-1 bg-[#1A1A1A] p-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodo(p.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                periodo === p.id
                  ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas KPI Financieros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos Cobrados */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Ingresos Cobrados
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#D4AF37]" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#D4AF37]">
            {formatPrecio(resumen.totalIngresos)}
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            De {resumen.totalServicios} servicios completados
          </p>
        </div>

        {/* Servicios Realizados */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Servicios Realizados
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">
            {resumen.totalServicios}
          </p>
          <p className="text-xs text-neutral-500 mt-2">Citas atendidas y pagadas</p>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Ticket Promedio
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">
            {formatPrecio(resumen.ticketPromedio)}
          </p>
          <p className="text-xs text-neutral-500 mt-2">Gasto promedio por cliente</p>
        </div>

        {/* Por Cobrar (Pendiente) */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Por Cobrar / Agendado
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-400">
            {formatPrecio(resumen.ingresosPendientes)}
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            En {resumen.citasPendientesCount} citas agendadas
          </p>
        </div>
      </div>

      {/* Gráfica de Tendencia de Ingresos */}
      {evolucion.length > 0 && (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            Evolución de Ingresos ($ MXN)
          </h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolucion}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#737373"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#737373"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#111] border border-white/10 rounded-xl p-3 shadow-xl">
                          <p className="text-xs text-neutral-400">{d.label}</p>
                          <p className="text-sm font-bold text-[#D4AF37] mt-1">
                            {formatPrecio(d.ventas)}
                          </p>
                          <p className="text-xs text-neutral-500">{d.servicios} servicios</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="ventas" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Desglose por Barbero y por Servicio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por Barbero */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-[#D4AF37]" />
              Ventas por Barbero
            </span>
            <span className="text-xs text-neutral-500">{ventasPorBarbero.length} barberos</span>
          </h2>

          {ventasPorBarbero.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">
              No hay ventas registradas en este período
            </p>
          ) : (
            <div className="space-y-3">
              {ventasPorBarbero.map((b: any, idx: number) => (
                <div key={b.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: b.color + "25", color: b.color }}
                      >
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{b.nombre}</p>
                        <p className="text-xs text-neutral-500">{b.totalServicios} servicios realizados</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#D4AF37]">{formatPrecio(b.totalVentas)}</p>
                      <p className="text-xs text-neutral-500">{b.porcentaje}% del total</p>
                    </div>
                  </div>

                  {/* Barra de progreso de ventas */}
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(b.porcentaje, 4)}%`,
                        backgroundColor: b.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ventas por Servicio */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
              Servicios más Vendidos
            </span>
            <span className="text-xs text-neutral-500">{ventasPorServicio.length} servicios</span>
          </h2>

          {ventasPorServicio.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">
              No hay servicios completados en este período
            </p>
          ) : (
            <div className="space-y-3">
              {ventasPorServicio.map((s: any) => (
                <div key={s.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: s.color + "25", color: s.color }}
                      >
                        <Scissors className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{s.nombre}</p>
                        <p className="text-xs text-neutral-500">{s.cantidad} veces vendido · {s.duracionPromedio} min</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#D4AF37]">{formatPrecio(s.totalVentas)}</p>
                      <p className="text-xs text-neutral-500">{s.porcentaje}%</p>
                    </div>
                  </div>

                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(s.porcentaje, 4)}%`,
                        backgroundColor: s.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Historial de Citas Cobradas */}
      <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#D4AF37]" />
          Últimas Ventas Cobradas
        </h2>

        {ultimasVentas.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-6">
            Aún no has marcado citas como completadas/pagadas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-xs text-neutral-500 uppercase tracking-wider">
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Servicio</th>
                  <th className="pb-3 font-medium">Barbero</th>
                  <th className="pb-3 font-medium">Fecha & Hora</th>
                  <th className="pb-3 font-medium text-right">Monto Pagado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {ultimasVentas.map((c: any) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 text-white font-medium">
                      {c.cliente?.nombre || "Cliente"}
                    </td>
                    <td className="py-3 text-neutral-300">
                      {c.servicio?.nombre}
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5 text-xs text-neutral-300">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: c.barbero?.color || "#6366f1" }}
                        />
                        {c.barbero?.nombre}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-neutral-400">
                      {formatFecha(c.inicio, "d MMM yyyy")} {formatHora(c.inicio)}
                    </td>
                    <td className="py-3 text-right font-bold text-[#D4AF37]">
                      {formatPrecio(c.precio || c.servicio?.precio || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
