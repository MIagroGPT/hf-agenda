import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek } from "date-fns";

// GET /api/dashboard — KPIs para el dashboard overview
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const negocioId = (session.user as any).negocioId as string;

  const hoy = new Date();
  const inicioDia = startOfDay(hoy);
  const finDia = endOfDay(hoy);
  const inicioSemana = startOfWeek(hoy, { weekStartsOn: 1 });
  const finSemana = endOfWeek(hoy, { weekStartsOn: 1 });

  const [
    citasHoy,
    citasSemana,
    clientesTotal,
    clientesNuevosSemana,
    proximasCitas,
    ingresosSemana,
    citasPorDia,
  ] = await Promise.all([
    // Citas de hoy
    prisma.cita.count({
      where: { negocioId, inicio: { gte: inicioDia, lte: finDia } },
    }),
    // Citas esta semana
    prisma.cita.count({
      where: { negocioId, inicio: { gte: inicioSemana, lte: finSemana } },
    }),
    // Total clientes
    prisma.cliente.count({ where: { negocioId } }),
    // Clientes nuevos esta semana
    prisma.cliente.count({
      where: { negocioId, createdAt: { gte: inicioSemana, lte: finSemana } },
    }),
    // Próximas 5 citas del día
    prisma.cita.findMany({
      where: {
        negocioId,
        inicio: { gte: new Date() },
        estado: { in: ["PENDIENTE", "CONFIRMADA"] },
      },
      include: { cliente: true, barbero: true, servicio: true },
      orderBy: { inicio: "asc" },
      take: 5,
    }),
    // Ingresos esperados esta semana (citas completadas)
    prisma.cita.aggregate({
      where: {
        negocioId,
        estado: "COMPLETADA",
        inicio: { gte: inicioSemana, lte: finSemana },
      },
      _sum: { precio: true },
    }),
    // Citas de los últimos 7 días para gráfica
    Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const dia = subDays(hoy, 6 - i);
        return prisma.cita.count({
          where: {
            negocioId,
            inicio: { gte: startOfDay(dia), lte: endOfDay(dia) },
          },
        }).then((count) => ({ dia: dia.toISOString(), count }));
      })
    ),
  ]);

  return NextResponse.json({
    citasHoy,
    citasSemana,
    clientesTotal,
    clientesNuevosSemana,
    proximasCitas,
    ingresosSemana: ingresosSemana._sum.precio || 0,
    citasPorDia,
  });
}
