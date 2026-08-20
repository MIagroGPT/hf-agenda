import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function getAuthData() {
  const session = await auth();
  if (!session?.user) return null;
  return {
    userId: (session.user as any).id as string,
    negocioId: (session.user as any).negocioId as string,
  };
}

// GET /api/configuracion — Obtener datos del negocio y del usuario admin
export async function GET() {
  const authData = await getAuthData();
  if (!authData) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [negocio, usuario] = await Promise.all([
    prisma.negocio.findUnique({
      where: { id: authData.negocioId },
    }),
    prisma.usuario.findUnique({
      where: { id: authData.userId },
      select: { id: true, nombre: true, email: true, rol: true },
    }),
  ]);

  return NextResponse.json({
    negocio,
    usuario,
    webhookUrl: `/api/webhooks/n8n`,
    n8nSecret: process.env.N8N_WEBHOOK_SECRET || "hf-n8n-agenda-secret-key-2026",
  });
}

// PATCH /api/configuracion — Actualizar negocio o usuario/contraseña
export async function PATCH(req: NextRequest) {
  const authData = await getAuthData();
  if (!authData) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { tipo, datos } = body;

  try {
    if (tipo === "negocio") {
      const { nombre, telefono, email, direccion } = datos;
      const negocioActualizado = await prisma.negocio.update({
        where: { id: authData.negocioId },
        data: {
          nombre: nombre || undefined,
          telefono: telefono || null,
          email: email || null,
          direccion: direccion || null,
        },
      });
      return NextResponse.json({ ok: true, negocio: negocioActualizado });
    }

    if (tipo === "usuario") {
      const { nombre, email, password } = datos;
      const updateData: any = {};
      if (nombre) updateData.nombre = nombre;
      if (email) updateData.email = email;
      if (password && password.trim().length >= 6) {
        updateData.password = await bcrypt.hash(password.trim(), 12);
      }

      const usuarioActualizado = await prisma.usuario.update({
        where: { id: authData.userId },
        data: updateData,
        select: { id: true, nombre: true, email: true, rol: true },
      });
      return NextResponse.json({ ok: true, usuario: usuarioActualizado });
    }

    return NextResponse.json({ error: "Tipo de configuración no válido" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al actualizar" }, { status: 500 });
  }
}
