"use client";

import { useEffect, useState } from "react";
import type { Visita } from "@/types";
import { formatDate, formatDuration, getEffectiveStatus } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  agendada: "Agendada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  atrasada: "Atrasada",
};

const STATUS_COLOR: Record<string, string> = {
  agendada: "bg-blue-50 text-blue-600",
  em_andamento: "bg-amber-50 text-amber-600",
  concluida: "bg-emerald-50 text-emerald-600",
  atrasada: "bg-red-50 text-red-600",
};

interface Props {
  visita: Visita | null;
  onClose: () => void;
}

export default function VisitaDetailModal({ visita, onClose }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!visita) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visita, onClose]);

  useEffect(() => {
    if (!visita?.photo_url) { setPhotoUrl(null); return; }
    const path = visita.photo_url.split("/visita-fotos/")[1];
    if (!path) { setPhotoUrl(visita.photo_url); return; }
    fetch(`/api/admin/storage/signed-url?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then(({ signedUrl }) => setPhotoUrl(signedUrl ?? visita.photo_url))
      .catch(() => setPhotoUrl(visita.photo_url));
  }, [visita?.photo_url]);

  if (!visita) return null;

  const gestorName = (visita.users as { name: string } | undefined)?.name ?? "—";
  const imobName = (visita.imobiliarias as { name: string } | undefined)?.name ?? "—";
  const effectiveStatus = getEffectiveStatus(visita);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{imobName}</p>
            <h2 className="text-base font-bold text-gray-900">{gestorName}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[effectiveStatus]}`}>
              {STATUS_LABEL[effectiveStatus]}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label="Fechar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Agendado</p>
              <p className="text-sm text-gray-700">{formatDate(visita.scheduled_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Check-in</p>
              <p className="text-sm text-gray-700">{visita.checkin_at ? formatDate(visita.checkin_at) : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Check-out</p>
              <p className="text-sm text-gray-700">{visita.checkout_at ? formatDate(visita.checkout_at) : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Duração</p>
              <p className="text-sm text-gray-700">{visita.duration_minutes ? formatDuration(visita.duration_minutes) : "—"}</p>
            </div>
          </div>

          {/* Nota */}
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Nota</p>
            {visita.rating ? (
              <span className="text-amber-400 text-lg tracking-tighter">{"★".repeat(visita.rating)}<span className="text-gray-200">{"★".repeat(5 - visita.rating)}</span></span>
            ) : (
              <p className="text-sm text-gray-400">Sem avaliação</p>
            )}
          </div>

          {/* Observações */}
          {visita.notes && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Observações</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{visita.notes}</p>
            </div>
          )}

          {/* Foto do check-in */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Foto do check-in</p>
            {visita.photo_url ? (
              photoUrl ? (
                <a href={photoUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt="Foto do check-in"
                    className="w-full max-h-72 object-cover rounded-xl border border-gray-100 hover:opacity-90 transition"
                  />
                </a>
              ) : (
                <div className="w-full h-28 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center text-sm text-gray-400 animate-pulse">
                  Carregando foto...
                </div>
              )
            ) : (
              <div className="w-full h-28 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-400">
                Sem foto
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
