import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Asegurar columnas en la base de datos PostgreSQL
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Barbero" ADD COLUMN IF NOT EXISTS "horaInicio" TEXT NOT NULL DEFAULT '09:00';`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Barbero" ADD COLUMN IF NOT EXISTS "horaFin" TEXT NOT NULL DEFAULT '20:00';`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Barbero" ADD COLUMN IF NOT EXISTS "diasTrabajo" TEXT NOT NULL DEFAULT '1,2,3,4,5,6';`);
    } catch (e) {
      console.log("Columnas ya existentes o error ignorado:", e);
    }

    // 2. Negocio demo
    const negocio = await prisma.negocio.upsert({
      where: { slug: "hustle-formulas" },
      update: {},
      create: {
        nombre: "Hustle Formulas Barbershop",
        slug: "hustle-formulas",
        telefono: "+52 55 1234 5678",
        email: "admin@hustleformulas.com",
      },
    });

    // 3. Usuario admin (Password: admin123)
    const passwordHash = "$2b$12$UtrIgd/Ic.Swm8KUEiWJ9ONfx1pAdrQzihY4tyhJcaH8Cjd94q5a.";
    await prisma.usuario.upsert({
      where: { email: "admin@hustleformulas.com" },
      update: { password: passwordHash },
      create: {
        nombre: "Admin Hustle",
        email: "admin@hustleformulas.com",
        password: passwordHash,
        rol: "ADMIN",
        negocioId: negocio.id,
      },
    });

    // 4. Barberos con horarios
    const barberos = await Promise.all([
      prisma.barbero.upsert({
        where: { id: "barb-1" },
        update: {
          horaInicio: "09:00",
          horaFin: "20:00",
          diasTrabajo: "1,2,3,4,5,6",
        },
        create: {
          id: "barb-1",
          nombre: "Carlos Ramírez",
          color: "#D4AF37",
          horaInicio: "09:00",
          horaFin: "20:00",
          diasTrabajo: "1,2,3,4,5,6",
          negocioId: negocio.id,
        },
      }),
      prisma.barbero.upsert({
        where: { id: "barb-2" },
        update: {
          horaInicio: "10:00",
          horaFin: "19:00",
          diasTrabajo: "1,2,3,4,5",
        },
        create: {
          id: "barb-2",
          nombre: "Miguel Torres",
          color: "#6366f1",
          horaInicio: "10:00",
          horaFin: "19:00",
          diasTrabajo: "1,2,3,4,5",
          negocioId: negocio.id,
        },
      }),
      prisma.barbero.upsert({
        where: { id: "barb-3" },
        update: {
          horaInicio: "11:00",
          horaFin: "21:00",
          diasTrabajo: "2,3,4,5,6",
        },
        create: {
          id: "barb-3",
          nombre: "Luis García",
          color: "#10b981",
          horaInicio: "11:00",
          horaFin: "21:00",
          diasTrabajo: "2,3,4,5,6",
          negocioId: negocio.id,
        },
      }),
    ]);

    // 5. Servicios
    const servicios = await Promise.all([
      prisma.servicio.upsert({
        where: { id: "serv-1" },
        update: {},
        create: { id: "serv-1", nombre: "Corte clásico", precio: 150, duracion: 30, color: "#D4AF37", negocioId: negocio.id },
      }),
      prisma.servicio.upsert({
        where: { id: "serv-2" },
        update: {},
        create: { id: "serv-2", nombre: "Corte + Barba", precio: 250, duracion: 60, color: "#6366f1", negocioId: negocio.id },
      }),
      prisma.servicio.upsert({
        where: { id: "serv-3" },
        update: {},
        create: { id: "serv-3", nombre: "Coloración", precio: 400, duracion: 90, color: "#f59e0b", negocioId: negocio.id },
      }),
      prisma.servicio.upsert({
        where: { id: "serv-4" },
        update: {},
        create: { id: "serv-4", nombre: "Afeitado navaja", precio: 120, duracion: 25, color: "#10b981", negocioId: negocio.id },
      }),
    ]);

    // 6. Clientes demo
    const clientes = await Promise.all([
      prisma.cliente.upsert({
        where: { id: "cli-1" },
        update: {},
        create: { id: "cli-1", nombre: "Juan Pérez", telefono: "+52 55 1111 2222", email: "juan@email.com", etiqueta: "VIP", visitas: 12, negocioId: negocio.id },
      }),
      prisma.cliente.upsert({
        where: { id: "cli-2" },
        update: {},
        create: { id: "cli-2", nombre: "Roberto Sánchez", telefono: "+52 55 3333 4444", etiqueta: "REGULAR", visitas: 5, negocioId: negocio.id },
      }),
      prisma.cliente.upsert({
        where: { id: "cli-3" },
        update: {},
        create: { id: "cli-3", nombre: "Fernando López", telefono: "+52 55 5555 6666", etiqueta: "NUEVO", visitas: 1, negocioId: negocio.id },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      mensaje: "✅ Base de datos y Barberos actualizados con éxito!",
      barberos: barberos.map((b) => ({ nombre: b.nombre, horario: `${b.horaInicio} - ${b.horaFin}` })),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
