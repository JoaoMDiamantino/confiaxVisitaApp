"use client";

import { useState } from "react";
import type { Visita } from "@/types";
import { formatDate, formatDuration } from "@/lib/utils";
import VisitaDetailModal from "@/components/VisitaDetailModal";

const STATUS_LABEL: Record<string, string> = {
  agendada: "Agendada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

const STATUS_COLOR: Record<string, string> = {
  agendada: "bg-blue-50 text-blue-600",
  em_andamento: "bg-amber-50 text-amber-600",
  concluida: "bg-emerald-50 text-emerald-600",
};

interface Props {
  visitas: Visita[];
}

export default function VisitasAdminTable({ visitas }: Props) {
  const [selected, setSelected] = useState<Visita | null>(null);

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              {["Gestor", "Imobiliária", "Agendado", "Check-in", "Duração", "Nota", "Status"].map((h) => (
                <th key={h} className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visitas.map((v) => (
              <tr
                key={v.id}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelected(v)}
              >
                <td className="px-5 py-3.5 font-medium text-gray-900">
                  {(v.users as { name: string } | undefined)?.name}
                </td>
                <td className="px-5 py-3.5 text-gray-600">
                  {(v.imobiliarias as { name: string } | undefined)?.name}
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(v.scheduled_at)}</td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">
                  {v.checkin_at ? formatDate(v.checkin_at) : "—"}
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">
                  {v.duration_minutes ? formatDuration(v.duration_minutes) : "—"}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-amber-400 text-xs tracking-tighter">
                    {v.rating ? "★".repeat(v.rating) : <span className="text-gray-300">—</span>}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[v.status]}`}>
                    {STATUS_LABEL[v.status]}
                  </span>
                </td>
              </tr>
            ))}
            {visitas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">
                  Nenhuma visita registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <VisitaDetailModal visita={selected} onClose={() => setSelected(null)} />
    </>
  );
}
