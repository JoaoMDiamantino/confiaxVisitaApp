"use client";

import { useState, useMemo } from "react";
import { formatDuration } from "@/lib/utils";

type SortKey = "name" | "total" | "notaMedia" | "tempoMedio" | "tempoTotal";
type SortDir = "asc" | "desc";

export type GestorRow = {
  id: string;
  name: string;
  total: number;
  somaNotas: number;
  somaDuracao: number;
};

interface Props {
  rows: GestorRow[];
}

const COLS: { label: string; key: SortKey }[] = [
  { label: "Gestor",      key: "name" },
  { label: "Visitas",     key: "total" },
  { label: "Nota média",  key: "notaMedia" },
  { label: "Tempo médio", key: "tempoMedio" },
  { label: "Tempo total", key: "tempoTotal" },
];

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return (
      <svg className="w-3 h-3 ml-1 text-gray-300 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
      </svg>
    );
  }
  if (dir === "asc") {
    return (
      <svg className="w-3 h-3 ml-1 inline-block text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3 ml-1 inline-block text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}

export default function ResumoGestorTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      switch (sortKey) {
        case "name":      valA = a.name; valB = b.name; break;
        case "total":     valA = a.total; valB = b.total; break;
        case "notaMedia": valA = a.total > 0 ? a.somaNotas / a.total : -1; valB = b.total > 0 ? b.somaNotas / b.total : -1; break;
        case "tempoMedio":  valA = a.total > 0 ? a.somaDuracao / a.total : -1; valB = b.total > 0 ? b.somaDuracao / b.total : -1; break;
        case "tempoTotal":  valA = a.somaDuracao; valB = b.somaDuracao; break;
      }

      const cmp =
        typeof valA === "string" && typeof valB === "string"
          ? valA.localeCompare(valB, "pt-BR")
          : (valA as number) - (valB as number);

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            {COLS.map((col) => (
              <th key={col.key} className="px-5 py-3.5">
                <button
                  onClick={() => handleSort(col.key)}
                  className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-gray-600 transition whitespace-nowrap"
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((v) => {
            const notaMedia = v.total > 0 ? (v.somaNotas / v.total).toFixed(1) : "—";
            const tempoMedio = v.total > 0 ? formatDuration(Math.round(v.somaDuracao / v.total)) : "—";
            const tempoTotal = v.somaDuracao > 0 ? formatDuration(v.somaDuracao) : "—";
            return (
              <tr key={v.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00AEEF]/10 flex items-center justify-center text-[#00AEEF] text-xs font-bold flex-shrink-0">
                      {v.name[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{v.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="font-semibold text-gray-900 tabular-nums">{v.total}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 text-xs">★</span>
                    <span className="font-medium text-gray-700 tabular-nums">{notaMedia}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-gray-700 tabular-nums">{tempoMedio}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-gray-700 tabular-nums">{tempoTotal}</span>
                  </div>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                Nenhuma visita concluída este mês.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
