import { z } from "zod";

export const citaSchema = z.object({
  inicio: z.string().datetime(),
  fin: z.string().datetime(),
  clienteId: z.string().cuid(),
  barberoId: z.string().cuid(),
  servicioId: z.string().cuid(),
  notas: z.string().optional(),
  precio: z.number().positive().optional(),
});

export const clienteSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  telefono: z.string().min(8, "Teléfono inválido"),
  email: z.string().email().optional().or(z.literal("")),
  notas: z.string().optional(),
  fechaNac: z.string().optional(),
  etiqueta: z.enum(["NUEVO", "REGULAR", "VIP", "INACTIVO"]).optional(),
});

export const barberoSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  telefono: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
});

export const servicioSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  descripcion: z.string().optional(),
  precio: z.number().positive("El precio debe ser mayor a 0"),
  duracion: z.number().int().positive("La duración debe ser mayor a 0"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
});

export type CitaInput = z.infer<typeof citaSchema>;
export type ClienteInput = z.infer<typeof clienteSchema>;
export type BarberoInput = z.infer<typeof barberoSchema>;
export type ServicioInput = z.infer<typeof servicioSchema>;
