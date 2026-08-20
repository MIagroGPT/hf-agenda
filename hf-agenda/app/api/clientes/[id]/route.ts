import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getNegocioId() {
  const session = await auth();
  if (!session?.user) return null;
  return (session.user as any).negocioId as string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const negocioId = await getNegocioId();
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({
    where: { id, negocioId },
    include: {
      citas: {
        include: { barbero: true, servicio: true },
        orderBy: { inicio: "desc" },
        take: 20,
      },
    },
  });

  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  return NextResponse.json(cliente);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const negocioId = await getNegocioId();
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const cliente = await prisma.cliente.update({
    where: { id, negocioId },
    data: body,
  });
  return NextResponse.json(cliente);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const negocioId = await getNegocioId();
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  await prisma.cliente.delete({ where: { id, negocioId } });
  return NextResponse.json({ ok: true });
}
