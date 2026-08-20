import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { servicioSchema } from "@/lib/validations";

async function getNegocioId() {
  const session = await auth();
  if (!session?.user) return null;
  return (session.user as any).negocioId as string;
}

export async function GET(req: NextRequest) {
  const negocioId = await getNegocioId();
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const servicios = await prisma.servicio.findMany({
    where: { negocioId, activo: true },
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(servicios);
}

export async function POST(req: NextRequest) {
  const negocioId = await getNegocioId();
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = servicioSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const servicio = await prisma.servicio.create({ data: { ...parsed.data, negocioId } });
  return NextResponse.json(servicio, { status: 201 });
}
