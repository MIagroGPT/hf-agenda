import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getNegocioId() {
  const session = await auth();
  if (!session?.user) return null;
  return (session.user as any).negocioId as string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const negocioId = await getNegocioId();
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const barbero = await prisma.barbero.update({ where: { id, negocioId }, data: body });
  return NextResponse.json(barbero);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const negocioId = await getNegocioId();
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  await prisma.barbero.update({ where: { id, negocioId }, data: { activo: false } });
  return NextResponse.json({ ok: true });
}
