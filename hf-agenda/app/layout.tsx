import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HF Agenda — Hustle Formulas",
  description: "Sistema de reservas y CRM para barberías",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-[#0F0F0F] text-[#F5F5F5] antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
