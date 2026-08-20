"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays, Users, TrendingUp, Clock,
  Scissors, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { formatHora, formatPrecio, ESTADO_COLORES } from "@/lib/utils";
import { formatFecha } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface DashboardData {
  citasHoy: number;
  citasSemana: number;
  clientesTotal: number;
  clientesNuevosSemana: number;
  ingresosSemana: number;
  proximasCitas: any[];
  citasPorDia: { dia: string; count: number }[];
}

function StatCard({
  title, value, sub, icon: Icon, color,
}: {
  title: string; value: string | number; sub?: string;
  icon: any; color: string;
}) {
  return (
    <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const ESTADO_ICONS: Record<string, any> = {
  PENDIENTE: AlertCircle,
  CONFIRMADA: CheckCircle2,
  COMPLETADA: CheckCircle2,
  CANCELADA: XCircle,
  NO_SHOW: XCircle,
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
    refetchInterval: 1000 * 60 * 2, // refresca cada 2 min
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
      </div>
    );
  }

  const chartData = (data?.citasPorDia || []).map((d) => ({
    dia: format(parseISO(d.dia), "EEE", { locale: es }),
    citas: d.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {formatFecha(new Date(), "EEEE, d 'de' MMMM yyyy")}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Citas Hoy"
          value={data?.citasHoy ?? 0}
          icon={CalendarDays}
          color="bg-[#D4AF37]/10 text-[#D4AF37]"
        />
        <StatCard
          title="Citas Esta Semana"
          value={data?.citasSemana ?? 0}
          icon={Clock}
          color="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          title="Total Clientes"
          value={data?.clientesTotal ?? 0}
          sub={`+${data?.clientesNuevosSemana ?? 0} esta semana`}
          icon={Users}
          color="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          title="Ingresos Semana"
          value={formatPrecio(data?.ingresosSemana ?? 0)}
          icon={TrendingUp}
          color="bg-purple-500/10 text-purple-400"
        />
      </div>

      {/* Gráfica + Próximas citas */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Gráfica de citas por día */}
        <div className="xl:col-span-3 bg-[#1A1A1A] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Citas — Últimos 7 días</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={28}>
              <XAxis
                dataKey="dia"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0F0F0F",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar dataKey="citas" fill="#D4AF37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Próximas citas */}
        <div className="xl:col-span-2 bg-[#1A1A1A] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Próximas Citas</h2>
          <div className="space-y-3">
            {(data?.proximasCitas || []).length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-6">No hay citas próximas</p>
            )}
            {(data?.proximasCitas || []).map((cita: any) => {
              const StatusIcon = ESTADO_ICONS[cita.estado] || AlertCircle;
              return (
                <div
                  key={cita.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cita.barbero?.color + "20", borderColor: cita.barbero?.color + "40" }}
                  >
                    <Scissors className="w-3.5 h-3.5" style={{ color: cita.barbero?.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{cita.cliente?.nombre}</p>
                    <p className="text-xs text-neutral-500 truncate">
                      {cita.servicio?.nombre} · {cita.barbero?.nombre}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-[#D4AF37]">{formatHora(cita.inicio)}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md border ${ESTADO_COLORES[cita.estado]}`}>
                      {cita.estado}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
