import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const usuario = await prisma.usuario.findUnique({
          where: { email },
          include: { negocio: true },
        });

        if (!usuario || !usuario.activo) return null;

        const passwordOk = await bcrypt.compare(password, usuario.password);
        if (!passwordOk) return null;

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nombre,
          rol: usuario.rol,
          negocioId: usuario.negocioId,
          negocioNombre: usuario.negocio.nombre,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.rol = (user as any).rol;
        token.negocioId = (user as any).negocioId;
        token.negocioNombre = (user as any).negocioNombre;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).rol = token.rol;
        (session.user as any).negocioId = token.negocioId;
        (session.user as any).negocioNombre = token.negocioNombre;
      }
      return session;
    },
  },
});
