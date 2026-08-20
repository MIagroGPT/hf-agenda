import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Webhook para N8N — permite crear/actualizar citas desde automaciones
// Protegido por API Key simple en header X-N8N-Secret
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-n8n-secret");
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { accion, ...datos } = body;

  switch (accion) {
    case "crear_cita": {
      const cita = await prisma.cita.create({
        data: {
          inicio: new Date(datos.inicio),
          fin: new Date(datos.fin),
          clienteId: datos.clienteId,
          barberoId: datos.barberoId,
          servicioId: datos.servicioId,
          negocioId: datos.negocioId,
          notas: datos.notas,
        },
        include: { cliente: true, barbero: true, servicio: true },
      });
      return NextResponse.json({ ok: true, cita });
    }

    case "actualizar_estado": {
      const cita = await prisma.cita.update({
        where: { id: datos.citaId },
        data: { estado: datos.estado },
      });
      return NextResponse.json({ ok: true, cita });
    }

    case "buscar_cliente": {
      const cliente = await prisma.cliente.findFirst({
        where: {
          negocioId: datos.negocioId,
          OR: [
            { telefono: datos.telefono },
            { email: datos.email },
          ],
        },
      });
      return NextResponse.json({ ok: true, cliente });
    }

    case "crear_cliente": {
      const cliente = await prisma.cliente.create({
        data: {
          nombre: datos.nombre,
          telefono: datos.telefono,
          email: datos.email,
          negocioId: datos.negocioId,
        },
      });
      return NextResponse.json({ ok: true, cliente });
    }

    default:
      return NextResponse.json({ error: `Acción desconocida: ${accion}` }, { status: 400 });
  }
}
