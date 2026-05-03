"use client";

import { useState, useMemo } from "react";
import type { Visita, Imobiliaria } from "@/types";
import { formatDate } from "@/lib/utils";
import Combobox from "@/components/Combobox";

interface Props {
  visitas: Visita[];
  imobiliarias: Imobiliaria[];
}

export default function HistoricoFiltros({ visitas, imobiliarias }: Props) {
  const [imobiliariaId, setImobiliariaId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const hasFilters = Boolean(imobiliariaId || startDate || endDate);

  const filtered = useMemo(() => {
    return visitas.filter((v) => {
      if (imobiliariaId && v.imobiliaria_id !== imobiliariaId) return false;
      if (startDate) {
        const d = new Date(startDate);
        d.setHours(0, 0, 0, 0);
        if (new Date(v.scheduled_at) < d) return false;
      }
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        if (new Date(v.scheduled_at) > d) return false;
      }
      return true;
    });
  }, [visitas, imobiliariaId, startDate, endDate]);

  function clearFilters() {
    setImobiliariaId("");
    setStartDate("");
    setEndDate("");
  }

  return (
    <div className="space-y-4">
      {/* Filter card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Imobiliária
          </label>
          <Combobox
            options={imobiliarias.map((imob) => ({ value: imob.id, label: imob.name }))}
            value={imobiliariaId}
            onChange={setImobiliariaId}
            placeholder="Todas as imobiliárias"
            emptyMessage="Nenhuma imobiliária encontrada."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">De</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#00AEEF] focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Até</label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#00AEEF] focus:bg-white transition"
            />
          </div>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-medium text-gray-400 hover:text-red-500 transition"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 px-1">
        {filtered.length} visita{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
        {hasFilters ? " com esses filtros" : ""}
      </p>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <p className="text-sm text-gray-400">
            {hasFilters
              ? "Nenhuma visita encontrada com esses filtros."
              : "Nenhuma visita concluída."}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#00AEEF] font-semibold mt-2 hover:underline"
            >
              Limpar filtros →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((visita) => {
            const imob = visita.imobiliarias as { name: string } | undefined;
            return (
              <div key={visita.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
                <div className="w-[3px] flex-shrink-0 bg-emerald-400" />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900 flex-1 min-w-0 pr-2 truncate">
                      {imob?.name}
                    </p>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-xs ${i < (visita.rating ?? 0) ? "text-amber-400" : "text-gray-200"}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(visita.scheduled_at)}</p>
                  {visita.notes && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{visita.notes}</p>
                  )}
                  {visita.duration_minutes && (
                    <p className="text-xs text-gray-400 mt-2">
                      <span className="bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
                        {visita.duration_minutes} min
                      </span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
