"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Store,
  User,
  Key,
  Webhook,
  Copy,
  Check,
  Save,
  Server,
  ShieldCheck,
} from "lucide-react";

export default function ConfiguracionPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"negocio" | "seguridad" | "n8n">("negocio");
  const [copiado, setCopiado] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Formulario Negocio
  const [formNegocio, setFormNegocio] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
  });

  // Formulario Usuario / Contraseña
  const [formUsuario, setFormUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["configuracion"],
    queryFn: () => fetch("/api/configuracion").then((r) => r.json()),
  });

  useEffect(() => {
    if (data?.negocio) {
      setFormNegocio({
        nombre: data.negocio.nombre || "",
        telefono: data.negocio.telefono || "",
        email: data.negocio.email || "",
        direccion: data.negocio.direccion || "",
      });
    }
    if (data?.usuario) {
      setFormUsuario((u) => ({
        ...u,
        nombre: data.usuario.nombre || "",
        email: data.usuario.email || "",
      }));
    }
  }, [data]);

  async function handleGuardarNegocio(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      const res = await fetch("/api/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "negocio", datos: formNegocio }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al actualizar negocio");

      queryClient.invalidateQueries({ queryKey: ["configuracion"] });
      setMensaje({ tipo: "exito", texto: "¡Datos del negocio actualizados correctamente!" });
    } catch (err: any) {
      setMensaje({ tipo: "error", texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  async function handleGuardarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    if (formUsuario.password && formUsuario.password !== formUsuario.confirmPassword) {
      setMensaje({ tipo: "error", texto: "Las contraseñas no coinciden." });
      setGuardando(false);
      return;
    }

    if (formUsuario.password && formUsuario.password.length < 6) {
      setMensaje({ tipo: "error", texto: "La contraseña debe tener al menos 6 caracteres." });
      setGuardando(false);
      return;
    }

    try {
      const res = await fetch("/api/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "usuario",
          datos: {
            nombre: formUsuario.nombre,
            email: formUsuario.email,
            password: formUsuario.password || undefined,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al actualizar perfil");

      queryClient.invalidateQueries({ queryKey: ["configuracion"] });
      setFormUsuario((u) => ({ ...u, password: "", confirmPassword: "" }));
      setMensaje({ tipo: "exito", texto: "¡Perfil de administrador actualizado correctamente!" });
    } catch (err: any) {
      setMensaje({ tipo: "error", texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  const webhookHost = typeof window !== "undefined" ? window.location.origin : "";
  const fullWebhookUrl = `${webhookHost}/api/webhooks/n8n`;

  function copiarAlPortapapeles(texto: string) {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#D4AF37]" />
          Configuración del Sistema
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Administra la información de tu barbería, credenciales de acceso e integraciones con N8N
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => { setTab("negocio"); setMensaje(null); }}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
            tab === "negocio"
              ? "border-[#D4AF37] text-[#D4AF37]"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Store className="w-4 h-4" />
          Datos del Negocio
        </button>

        <button
          onClick={() => { setTab("seguridad"); setMensaje(null); }}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
            tab === "seguridad"
              ? "border-[#D4AF37] text-[#D4AF37]"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Key className="w-4 h-4" />
          Cuenta & Contraseña
        </button>

        <button
          onClick={() => { setTab("n8n"); setMensaje(null); }}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
            tab === "n8n"
              ? "border-[#D4AF37] text-[#D4AF37]"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Webhook className="w-4 h-4" />
          Integración N8N (WhatsApp IA)
        </button>
      </div>

      {/* Alertas */}
      {mensaje && (
        <div
          className={`p-4 rounded-xl text-sm border flex items-center justify-between ${
            mensaje.tipo === "exito"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          <span>{mensaje.texto}</span>
          <button onClick={() => setMensaje(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: DATOS DEL NEGOCIO */}
      {tab === "negocio" && (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#D4AF37]" />
            Información General de la Barbería
          </h2>

          <form onSubmit={handleGuardarNegocio} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Nombre Comercial *
                </label>
                <input
                  type="text"
                  value={formNegocio.nombre}
                  onChange={(e) => setFormNegocio((f) => ({ ...f, nombre: e.target.value }))}
                  required
                  placeholder="Hustle Formulas Barbershop"
                  className="w-full px-3.5 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Teléfono / WhatsApp de Contacto
                </label>
                <input
                  type="tel"
                  value={formNegocio.telefono}
                  onChange={(e) => setFormNegocio((f) => ({ ...f, telefono: e.target.value }))}
                  placeholder="+52 55 1234 5678"
                  className="w-full px-3.5 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Email de Notificaciones
                </label>
                <input
                  type="email"
                  value={formNegocio.email}
                  onChange={(e) => setFormNegocio((f) => ({ ...f, email: e.target.value }))}
                  placeholder="contacto@hustleformulas.com"
                  className="w-full px-3.5 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Dirección Física
                </label>
                <input
                  type="text"
                  value={formNegocio.direccion}
                  onChange={(e) => setFormNegocio((f) => ({ ...f, direccion: e.target.value }))}
                  placeholder="Av. Principal #123, Col. Centro"
                  className="w-full px-3.5 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={guardando}
                className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#c9a82e] disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {guardando ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SEGURIDAD Y CUENTA */}
      {tab === "seguridad" && (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-[#D4AF37]" />
            Perfil del Administrador & Contraseña
          </h2>

          <form onSubmit={handleGuardarUsuario} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formUsuario.nombre}
                  onChange={(e) => setFormUsuario((u) => ({ ...u, nombre: e.target.value }))}
                  required
                  placeholder="Admin Hustle"
                  className="w-full px-3.5 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Correo Electrónico (Login) *
                </label>
                <input
                  type="email"
                  value={formUsuario.email}
                  onChange={(e) => setFormUsuario((u) => ({ ...u, email: e.target.value }))}
                  required
                  placeholder="admin@hustleformulas.com"
                  className="w-full px-3.5 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/5">
              <p className="text-xs font-semibold text-neutral-300 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                Cambiar Contraseña (opcional)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={formUsuario.password}
                    onChange={(e) => setFormUsuario((u) => ({ ...u, password: e.target.value }))}
                    placeholder="Dejar en blanco para no cambiar"
                    className="w-full px-3.5 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={formUsuario.confirmPassword}
                    onChange={(e) => setFormUsuario((u) => ({ ...u, confirmPassword: e.target.value }))}
                    placeholder="Repite la nueva contraseña"
                    className="w-full px-3.5 py-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={guardando}
                className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#c9a82e] disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {guardando ? "Guardando..." : "Actualizar Cuenta"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: INTEGRACIÓN N8N */}
      {tab === "n8n" && (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Webhook className="w-4 h-4 text-[#D4AF37]" />
              Conectar con N8N / Bot de WhatsApp
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Usa estos datos en tu nodo HTTP Request de N8N para agendar y consultar citas desde tu bot.
            </p>
          </div>

          {/* Webhook Endpoint */}
          <div className="p-4 rounded-xl bg-[#0F0F0F] border border-white/10 space-y-2">
            <label className="block text-xs font-medium text-neutral-400">
              URL del Webhook (Método POST)
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={fullWebhookUrl}
                className="flex-1 px-3 py-2 bg-transparent text-white text-xs font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => copiarAlPortapapeles(fullWebhookUrl)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiado ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>

          {/* Header de Seguridad */}
          <div className="p-4 rounded-xl bg-[#0F0F0F] border border-white/10 space-y-2">
            <label className="block text-xs font-medium text-neutral-400">
              Header de Autenticación Requerido
            </label>
            <div className="text-xs font-mono bg-black/40 p-3 rounded-lg text-[#D4AF37] space-y-1">
              <p><span className="text-neutral-400">Header:</span> X-N8N-Secret</p>
              <p><span className="text-neutral-400">Valor:</span> {data?.n8nSecret || "hf-n8n-agenda-secret-key-2026"}</p>
            </div>
          </div>

          {/* Documentación de Acciones N8N */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-white">Ejemplo de Payload en N8N (Crear Cita desde WhatsApp):</p>
            <pre className="p-4 rounded-xl bg-black/60 border border-white/5 text-xs text-neutral-300 font-mono overflow-x-auto">
{`{
  "accion": "crear_cita",
  "clienteNombre": "Juan Pérez",
  "clienteTelefono": "+52 55 1234 5678",
  "servicioId": "serv-1",
  "barberoId": "barb-1",
  "inicio": "2026-08-21T10:00:00.000Z",
  "fin": "2026-08-21T10:45:00.000Z"
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
