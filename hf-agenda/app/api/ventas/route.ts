import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  format,
} from "date-fns";
import { es } from "date-fns/locale";

async function getNegocioId() {
  const session = await auth();
  if (!session?.user) return null;
  return (session.user as any).negocioId as string;
}

// GET /api/ventas?periodo=hoy|semana|mes|ano|todo
export async function GET(req: NextRequest) {
  const negocioId = await getNegocioId();
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const periodo = searchParams.get("periodo") || "mes";

  const ahora = new Date();
  let inicioRango: Date | undefined;
  let finRango: Date | undefined;

  if (periodo === "hoy") {
    inicioRango = startOfDay(ahora);
    finRango = endOfDay(ahora);
  } else if (periodo === "semana") {
    inicioRango = startOfWeek(ahora, { weekStartsOn: 1 });
    finRango = endOfWeek(ahora, { weekStartsOn: 1 });
  } else if (periodo === "mes") {
    inicioRango = startOfMonth(ahora);
    finRango = endOfMonth(ahora);
  } else if (periodo === "ano") {
    inicioRango = startOfYear(ahora);
    finRango = endOfYear(ahora);
  }

  const whereBase: any = { negocioId };
  if (inicioRango && finRango) {
    whereBase.inicio = { gte: inicioRango, lte: finRango };
  }

  // 1. Obtener todas las citas del período con relaciones
  const citasPeriodo = await prisma.cita.findMany({
    where: whereBase,
    include: {
      cliente: true,
      barbero: true,
      servicio: true,
    },
    orderBy: { inicio: "desc" },
  });

  // Filtrar completadas (pagadas) y pendientes
  const citasCompletadas = citasPeriodo.filter((c) => c.estado === "COMPLETADA");
  const citasPendientes = citasPeriodo.filter((c) => ["PENDIENTE", "CONFIRMADA"].includes(c.estado));

  // 2. Totales financieros
  const totalIngresos = citasCompletadas.reduce((acc, c) => acc + (c.precio || c.servicio?.precio || 0), 0);
  const totalServicios = citasCompletadas.length;
  const ticketPromedio = totalServicios > 0 ? totalIngresos / totalServicios : 0;
  const ingresosPendientes = citasPendientes.reduce((acc, c) => acc + (c.precio || c.servicio?.precio || 0), 0);

  // 3. Desglose por Barbero
  const barberosMap: Record<string, { id: string; nombre: string; color: string; totalVentas: number; totalServicios: number }> = {};

  citasCompletadas.forEach((c) => {
    const bId = c.barberoId;
    const precio = c.precio || c.servicio?.precio || 0;
    if (!barberosMap[bId]) {
      barberosMap[bId] = {
        id: bId,
        nombre: c.barbero?.nombre || "Sin asignar",
        color: c.barbero?.color || "#6366f1",
        totalVentas: 0,
        totalServicios: 0,
      };
    }
    barberosMap[bId].totalVentas += precio;
    barberosMap[bId].totalServicios += 1;
  });

  const ventasPorBarbero = Object.values(barberosMap).map((b) => ({
    ...b,
    ticketPromedio: b.totalServicios > 0 ? b.totalVentas / b.totalServicios : 0,
    porcentaje: totalIngresos > 0 ? Math.round((b.totalVentas / totalIngresos) * 100) : 0,
  })).sort((a, b) => b.totalVentas - a.totalVentas);

  // 4. Desglose por Servicio
  const serviciosMap: Record<string, { id: string; nombre: string; color: string; totalVentas: number; cantidad: number; duracionPromedio: number }> = {};

  citasCompletadas.forEach((c) => {
    const sId = c.servicioId;
    const precio = c.precio || c.servicio?.precio || 0;
    if (!serviciosMap[sId]) {
      serviciosMap[sId] = {
        id: sId,
        nombre: c.servicio?.nombre || "Sin servicio",
        color: c.servicio?.color || "#D4AF37",
        totalVentas: 0,
        cantidad: 0,
        duracionPromedio: c.servicio?.duracion || 30,
      };
    }
    serviciosMap[sId].totalVentas += precio;
    serviciosMap[sId].cantidad += 1;
  });

  const ventasPorServicio = Object.values(serviciosMap).map((s) => ({
    ...s,
    porcentaje: totalIngresos > 0 ? Math.round((s.totalVentas / totalIngresos) * 100) : 0,
  })).sort((a, b) => b.totalVentas - a.totalVentas);

  // 5. Gráfica de evolución temporal
  let evolucion: { fecha: string; label: string; ventas: number; servicios: number }[] = [];

  if (inicioRango && finRango) {
    const dias = eachDayOfInterval({ start: inicioRango, end: finRango });
    evolucion = dias.map((dia) => {
      const diaInicio = startOfDay(dia);
      const diaFin = endOfDay(dia);

      const citasDia = citasCompletadas.filter((c) => {
        const d = new Date(c.inicio);
        return d >= diaInicio && d <= diaFin;
      });

      const ventasDia = citasDia.reduce((acc, c) => acc + (c.precio || c.servicio?.precio || 0), 0);

      return {
        fecha: dia.toISOString(),
        label: format(dia, periodo === "mes" ? "d MMM" : "eee d", { locale: es }),
        ventas: ventasDia,
        servicios: citasDia.length,
      };
    });
  }

  return NextResponse.json({
    periodo,
    resumen: {
      totalIngresos,
      totalServicios,
      ticketPromedio,
      ingresosPendientes,
      citasPendientesCount: citasPendientes.length,
    },
    ventasPorBarbero,
    ventasPorServicio,
    evolucion,
    ultimasVentas: citasCompletadas.slice(0, 15),
  });
}
