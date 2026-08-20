import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { citaSchema } from "@/lib/validations";

async function getNegocioId(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return null;
  return (session.user as any).negocioId as string;
}

// GET /api/citas?inicio=...&fin=...&barberoId=...
export async function GET(req: NextRequest) {
  const negocioId = await getNegocioId(req);
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const inicio = searchParams.get("inicio");
  const fin = searchParams.get("fin");
  const barberoId = searchParams.get("barberoId");

  const where: any = { negocioId };
  if (inicio && fin) {
    where.inicio = { gte: new Date(inicio) };
    where.fin = { lte: new Date(fin) };
  }
  if (barberoId) where.barberoId = barberoId;

  const citas = await prisma.cita.findMany({
    where,
    include: {
      cliente: true,
      barbero: true,
      servicio: true,
    },
    orderBy: { inicio: "asc" },
  });

  return NextResponse.json(citas);
}

// POST /api/citas
export async function POST(req: NextRequest) {
  const negocioId = await getNegocioId(req);
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = citaSchema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues?.[0]?.message || "Datos de cita inválidos";
    return NextResponse.json(
      { error: { message: errorMsg } },
      { status: 400 }
    );
  }

  const inicioDate = new Date(parsed.data.inicio);
  const finDate = new Date(parsed.data.fin);

  // Validación: No permitir citas en el pasado (margen de 5 min)
  const ahoraMenos5Min = new Date(Date.now() - 5 * 60 * 1000);
  if (inicioDate < ahoraMenos5Min) {
    return NextResponse.json(
      { error: { message: "No se pueden agendar citas en fechas u horas pasadas" } },
      { status: 400 }
    );
  }

  // Validación: Verificar que fin sea mayor que inicio
  if (finDate <= inicioDate) {
    return NextResponse.json(
      { error: { message: "La hora de fin debe ser posterior a la de inicio" } },
      { status: 400 }
    );
  }

  // Validación: Verificar que el barbero no tenga cita solapada
  const conflicto = await prisma.cita.findFirst({
    where: {
      negocioId,
      barberoId: parsed.data.barberoId,
      estado: { notIn: ["CANCELADA"] },
      OR: [
        {
          inicio: { lt: finDate },
          fin: { gt: inicioDate },
        },
      ],
    },
    include: { cliente: true },
  });

  if (conflicto) {
    return NextResponse.json(
      {
        error: {
          message: `El barbero ya tiene una cita reservada con ${conflicto.cliente?.nombre || "otro cliente"} en ese horario.`,
        },
      },
      { status: 400 }
    );
  }

  const cita = await prisma.$transaction(async (tx) => {
    const nueva = await tx.cita.create({
      data: {
        inicio: inicioDate,
        fin: finDate,
        clienteId: parsed.data.clienteId,
        barberoId: parsed.data.barberoId,
        servicioId: parsed.data.servicioId,
        notas: parsed.data.notas,
        precio: parsed.data.precio,
        estado: parsed.data.estado || "PENDIENTE",
        negocioId,
      },
      include: { cliente: true, barbero: true, servicio: true },
    });

    // Actualizar visitas del cliente
    await tx.cliente.update({
      where: { id: parsed.data.clienteId },
      data: { visitas: { increment: 1 }, ultimaVisita: new Date() },
    });

    return nueva;
  });

  return NextResponse.json(cita, { status: 201 });
}

// PATCH /api/citas
export async function PATCH(req: NextRequest) {
  const negocioId = await getNegocioId(req);
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  if (data.inicio) data.inicio = new Date(data.inicio);
  if (data.fin) data.fin = new Date(data.fin);

  const cita = await prisma.cita.update({
    where: { id, negocioId },
    data,
    include: { cliente: true, barbero: true, servicio: true },
  });

  return NextResponse.json(cita);
}
