"use client";

import { useState, useMemo, useEffect } from "react";
import type { Visita } from "@/types";
import { formatDate, formatDuration, getEffectiveStatus } from "@/lib/utils";
import VisitaDetailModal from "@/components/VisitaDetailModal";
import Combobox from "@/components/Combobox";

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

type SortKey = "gestor" | "imobiliaria" | "scheduled_at" | "checkin_at" | "duration_minutes" | "rating" | "status";
type SortDir = "asc" | "desc";

const COLS: { label: string; key: SortKey }[] = [
  { label: "Gestor",      key: "gestor" },
  { label: "Imobiliária", key: "imobiliaria" },
  { label: "Agendado",    key: "scheduled_at" },
  { label: "Check-in",    key: "checkin_at" },
  { label: "Duração",     key: "duration_minutes" },
  { label: "Nota",        key: "rating" },
  { label: "Status",      key: "status" },
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

interface Props {
  visitas: Visita[];
}

export default function VisitasAdminTable({ visitas }: Props) {
  const [selected, setSelected] = useState<Visita | null>(null);
  const [page, setPage] = useState(1);
  const [filterGestor, setFilterGestor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterImob, setFilterImob] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("scheduled_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const gestores = useMemo(() => {
    const map = new Map<string, string>();
    visitas.forEach((v) => {
      const name = (v.users as { name: string } | undefined)?.name;
      if (name) map.set(v.user_id, name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [visitas]);

  const imobs = useMemo(() => {
    const map = new Map<string, string>();
    visitas.forEach((v) => {
      const name = (v.imobiliarias as { name: string } | undefined)?.name;
      if (name && v.imobiliaria_id) map.set(v.imobiliaria_id, name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [visitas]);

  const displayed = useMemo(() => {
    let result = visitas;

    if (filterGestor) result = result.filter((v) => v.user_id === filterGestor);
    if (filterStatus) result = result.filter((v) => getEffectiveStatus(v) === filterStatus);
    if (filterImob)   result = result.filter((v) => v.imobiliaria_id === filterImob);
    if (filterDateFrom) {
      const from = new Date(filterDateFrom + "T00:00:00");
      result = result.filter((v) => new Date(v.scheduled_at) >= from);
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo + "T23:59:59");
      result = result.filter((v) => new Date(v.scheduled_at) <= to);
    }

    return [...result].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      switch (sortKey) {
        case "gestor":
          valA = (a.users as { name: string } | undefined)?.name ?? "";
          valB = (b.users as { name: string } | undefined)?.name ?? "";
          break;
        case "imobiliaria":
          valA = (a.imobiliarias as { name: string } | undefined)?.name ?? (a.prospectos as { name: string } | undefined)?.name ?? "";
          valB = (b.imobiliarias as { name: string } | undefined)?.name ?? (b.prospectos as { name: string } | undefined)?.name ?? "";
          break;
        case "scheduled_at": valA = a.scheduled_at; valB = b.scheduled_at; break;
        case "checkin_at":   valA = a.checkin_at ?? ""; valB = b.checkin_at ?? ""; break;
        case "duration_minutes": valA = a.duration_minutes ?? -1; valB = b.duration_minutes ?? -1; break;
        case "rating":  valA = a.rating ?? -1; valB = b.rating ?? -1; break;
        case "status":  valA = a.status; valB = b.status; break;
      }

      const cmp =
        typeof valA === "string" && typeof valB === "string"
          ? valA.localeCompare(valB, "pt-BR")
          : (valA as number) - (valB as number);

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [visitas, filterGestor, filterStatus, filterImob, filterDateFrom, filterDateTo, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(["gestor", "imobiliaria", "status"].includes(key) ? "asc" : "desc");
    }
  }

  const PAGE_SIZE = 50;
  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const paged = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filterGestor, filterStatus, filterImob, filterDateFrom, filterDateTo, sortKey, sortDir]);

  const hasFilter = filterGestor || filterStatus || filterImob || filterDateFrom || filterDateTo;

  function clearFilters() {
    setFilterGestor("");
    setFilterStatus("");
    setFilterImob("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(1);
  }

  const selectCls = "w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <>
      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Gestor</label>
            <select value={filterGestor} onChange={(e) => setFilterGestor(e.target.value)} className={selectCls}>
              <option value="">Todos</option>
              {gestores.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls}>
              <option value="">Todos</option>
              <option value="agendada">Agendada</option>
              <option value="atrasada">Atrasada</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Imobiliária</label>
            <Combobox
              value={filterImob}
              onChange={setFilterImob}
              options={imobs.map(([id, name]) => ({ value: id, label: name }))}
              placeholder="Todas"
              emptyMessage="Nenhuma imobiliária encontrada."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">De</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className={selectCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Até</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className={selectCls}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-gray-600">{displayed.length}</span> de {visitas.length} visitas
            {totalPages > 1 && ` · pág. ${page}/${totalPages}`}
          </p>
          {hasFilter && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-primary hover:text-primary-dark transition"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
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
            {paged.map((v) => (
              <tr
                key={v.id}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelected(v)}
              >
                <td className="px-5 py-3.5 font-medium text-gray-900">
                  {(v.users as { name: string } | undefined)?.name}
                </td>
                <td className="px-5 py-3.5 text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span>{(v.imobiliarias as { name: string } | undefined)?.name ?? (v.prospectos as { name: string } | undefined)?.name}</span>
                    {v.prospecto_id && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Captação</span>
                    )}
                  </div>
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
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[getEffectiveStatus(v)]}`}>
                    {STATUS_LABEL[getEffectiveStatus(v)]}
                  </span>
                </td>
              </tr>
            ))}
            {displayed.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">
                  Nenhuma visita encontrada para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg border border-gray-200 bg-white transition"
          >
            ← Anterior
          </button>
          <span className="text-xs text-gray-500">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg border border-gray-200 bg-white transition"
          >
            Próxima →
          </button>
        </div>
      )}

      <VisitaDetailModal visita={selected} onClose={() => setSelected(null)} />
    </>
  );
}
