import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { barberoSchema } from "@/lib/validations";

async function getNegocioId() {
  const session = await auth();
  if (!session?.user) return null;
  return (session.user as any).negocioId as string;
}

// Asegura que las columnas de disponibilidad existan en PostgreSQL
async function asegurarColumnasBarbero() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Barbero" ADD COLUMN IF NOT EXISTS "horaInicio" TEXT NOT NULL DEFAULT '09:00';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Barbero" ADD COLUMN IF NOT EXISTS "horaFin" TEXT NOT NULL DEFAULT '20:00';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Barbero" ADD COLUMN IF NOT EXISTS "diasTrabajo" TEXT NOT NULL DEFAULT '1,2,3,4,5,6';`);
  } catch (e) {
    console.error("Error asegurando columnas:", e);
  }
}

export async function GET(req: NextRequest) {
  const negocioId = await getNegocioId();
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const barberos = await prisma.barbero.findMany({
      where: { negocioId, activo: true },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(barberos);
  } catch (err) {
    // Si la tabla no tenía las nuevas columnas, las crea automáticamente y reintenta
    await asegurarColumnasBarbero();
    const barberos = await prisma.barbero.findMany({
      where: { negocioId, activo: true },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(barberos);
  }
}

export async function POST(req: NextRequest) {
  const negocioId = await getNegocioId();
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = barberoSchema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues?.[0]?.message || "Datos inválidos";
    return NextResponse.json({ error: { message: errorMsg } }, { status: 400 });
  }

  try {
    const barbero = await prisma.barbero.create({
      data: {
        nombre: parsed.data.nombre,
        telefono: parsed.data.telefono || null,
        color: parsed.data.color,
        horaInicio: parsed.data.horaInicio || "09:00",
        horaFin: parsed.data.horaFin || "20:00",
        diasTrabajo: parsed.data.diasTrabajo || "1,2,3,4,5,6",
        negocioId,
      },
    });
    return NextResponse.json(barbero, { status: 201 });
  } catch (err) {
    await asegurarColumnasBarbero();
    const barbero = await prisma.barbero.create({
      data: {
        nombre: parsed.data.nombre,
        telefono: parsed.data.telefono || null,
        color: parsed.data.color,
        horaInicio: parsed.data.horaInicio || "09:00",
        horaFin: parsed.data.horaFin || "20:00",
        diasTrabajo: parsed.data.diasTrabajo || "1,2,3,4,5,6",
        negocioId,
      },
    });
    return NextResponse.json(barbero, { status: 201 });
  }
}
