import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clienteSchema } from "@/lib/validations";

async function getNegocioId() {
  const session = await auth();
  if (!session?.user) return null;
  return (session.user as any).negocioId as string;
}

// GET /api/clientes?search=...&etiqueta=...&page=...
export async function GET(req: NextRequest) {
  const negocioId = await getNegocioId();
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const etiqueta = searchParams.get("etiqueta");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {
    negocioId,
    ...(search && {
      OR: [
        { nombre: { contains: search, mode: "insensitive" } },
        { telefono: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(etiqueta && { etiqueta }),
  };

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      include: {
        _count: { select: { citas: true } },
      },
      orderBy: { ultimaVisita: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.cliente.count({ where }),
  ]);

  return NextResponse.json({ clientes, total, page, limit });
}

// POST /api/clientes
export async function POST(req: NextRequest) {
  const negocioId = await getNegocioId();
  if (!negocioId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = clienteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, fechaNac, ...rest } = parsed.data;
  const cliente = await prisma.cliente.create({
    data: {
      ...rest,
      ...(email && { email }),
      ...(fechaNac && { fechaNac: new Date(fechaNac) }),
      negocioId,
    },
  });

  return NextResponse.json(cliente, { status: 201 });
}
