const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creando datos iniciales...");

  // Negocio demo
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

  // Usuario admin (Hash precalculado para "admin123")
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

  // Barberos
  const barberos = await Promise.all([
    prisma.barbero.upsert({
      where: { id: "barb-1" },
      update: {},
      create: { id: "barb-1", nombre: "Carlos Ramírez", color: "#D4AF37", negocioId: negocio.id },
    }),
    prisma.barbero.upsert({
      where: { id: "barb-2" },
      update: {},
      create: { id: "barb-2", nombre: "Miguel Torres", color: "#6366f1", negocioId: negocio.id },
    }),
    prisma.barbero.upsert({
      where: { id: "barb-3" },
      update: {},
      create: { id: "barb-3", nombre: "Luis García", color: "#10b981", negocioId: negocio.id },
    }),
  ]);

  // Servicios
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

  // Clientes demo
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

  // Citas de hoy y mañana
  const hoy = new Date();
  const citas = [
    { clienteId: clientes[0].id, barberoId: barberos[0].id, servicioId: servicios[1].id, estado: "CONFIRMADA", inicio: 10, fin: 11, precio: 250 },
    { clienteId: clientes[1].id, barberoId: barberos[1].id, servicioId: servicios[0].id, estado: "PENDIENTE", inicio: 11, fin: 11.5, precio: 150 },
    { clienteId: clientes[2].id, barberoId: barberos[0].id, servicioId: servicios[3].id, estado: "PENDIENTE", inicio: 12, fin: 12.5, precio: 120 },
  ];

  for (const c of citas) {
    const inicio = new Date(hoy);
    inicio.setHours(c.inicio, 0, 0, 0);
    const fin = new Date(hoy);
    fin.setHours(Math.floor(c.fin), c.fin % 1 === 0.5 ? 30 : 0, 0, 0);

    await prisma.cita.create({
      data: {
        inicio,
        fin,
        estado: c.estado,
        precio: c.precio,
        clienteId: c.clienteId,
        barberoId: c.barberoId,
        servicioId: c.servicioId,
        negocioId: negocio.id,
      },
    });
  }

  console.log("✅ Seed completado con éxito!");
  console.log("   📧 Email: admin@hustleformulas.com");
  console.log("   🔑 Password: admin123");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
