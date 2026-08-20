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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cita = await prisma.$transaction(async (tx) => {
    const nueva = await tx.cita.create({
      data: { ...parsed.data, negocioId },
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

// PATCH /api/citas/[id]
export async function PATCH(req: NextRequest) {
  const negocioId = await getNegocioId(req);
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const cita = await prisma.cita.update({
    where: { id, negocioId },
    data,
    include: { cliente: true, barbero: true, servicio: true },
  });

  return NextResponse.json(cita);
}
