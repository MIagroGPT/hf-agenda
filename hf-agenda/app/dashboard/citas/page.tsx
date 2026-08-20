"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Plus } from "lucide-react";
import { CitaModal } from "@/components/calendar/cita-modal";
import { isBefore, startOfToday } from "date-fns";

export default function CitasPage() {
  const calendarRef = useRef<any>(null);
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCita, setSelectedCita] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rango, setRango] = useState({ inicio: "", fin: "" });

  const { data: citas = [] } = useQuery({
    queryKey: ["citas", rango],
    queryFn: () =>
      fetch(`/api/citas?inicio=${rango.inicio}&fin=${rango.fin}`).then((r) => r.json()),
    enabled: !!rango.inicio,
  });

  const { data: barberos = [] } = useQuery({
    queryKey: ["barberos"],
    queryFn: () => fetch("/api/barberos").then((r) => r.json()),
  });

  const events = citas.map((c: any) => ({
    id: c.id,
    title: `${c.cliente?.nombre} — ${c.servicio?.nombre}`,
    start: c.inicio,
    end: c.fin,
    backgroundColor: c.barbero?.color || "#6366f1",
    borderColor: c.barbero?.color || "#6366f1",
    extendedProps: { cita: c },
  }));

  function handleOpenNewModal(dateStr?: string) {
    if (dateStr) {
      const clicked = new Date(dateStr);
      // Si hizo clic en un día pasado, no permitir abrir o avanzar a hoy
      if (isBefore(clicked, startOfToday())) {
        setSelectedDate(new Date().toISOString());
      } else {
        setSelectedDate(dateStr);
      }
    } else {
      setSelectedDate(new Date().toISOString());
    }
    setSelectedCita(null);
    setModalOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Citas</h1>
          <p className="text-sm text-neutral-500 mt-1">Gestiona el calendario de tu barbería</p>
        </div>
        <button
          onClick={() => handleOpenNewModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c9a82e] text-black text-sm font-semibold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva Cita
        </button>
      </div>

      {/* Leyenda barberos */}
      {barberos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {barberos.map((b: any) => (
            <span key={b.id} className="flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
              {b.nombre} ({b.horaInicio || "09:00"} - {b.horaFin || "20:00"})
            </span>
          ))}
        </div>
      )}

      {/* Calendario */}
      <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 hf-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale="es"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          selectable
          selectMirror
          editable
          dayMaxEvents
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          height="auto"
          selectAllow={(selectInfo) => {
            // Bloquear selección en fechas pasadas
            return selectInfo.start >= new Date(Date.now() - 60 * 1000);
          }}
          datesSet={(info) => {
            setRango({
              inicio: info.startStr,
              fin: info.endStr,
            });
          }}
          select={(info) => {
            handleOpenNewModal(info.startStr);
          }}
          dateClick={(info) => {
            handleOpenNewModal(info.dateStr);
          }}
          eventClick={(info) => {
            setSelectedCita(info.event.extendedProps.cita);
            setModalOpen(true);
          }}
          eventDrop={async (info) => {
            if (info.event.start && info.event.start < new Date()) {
              alert("No puedes mover una cita al pasado.");
              info.revert();
              return;
            }
            await fetch("/api/citas", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: info.event.id,
                inicio: info.event.startStr,
                fin: info.event.endStr,
              }),
            });
            queryClient.invalidateQueries({ queryKey: ["citas"] });
          }}
        />
      </div>

      <CitaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        cita={selectedCita}
        defaultDate={selectedDate}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["citas"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          setModalOpen(false);
        }}
      />
    </div>
  );
}
