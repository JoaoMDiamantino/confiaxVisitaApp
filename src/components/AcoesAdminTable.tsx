"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Acao, Imobiliaria, User } from "@/types";
import { ACAO_STATUS_COLOR, ACAO_STATUS_LABEL, formatDate, formatDateOnly, getEffectiveAcaoStatus } from "@/lib/utils";
import AcaoDetailModal from "@/components/AcaoDetailModal";
import Combobox from "@/components/Combobox";

interface NovaAcaoForm {
  title: string;
  description: string;
  due_date: string;
  imobiliaria_id: string;
  colaborador_id: string;
}

type SortKey = "title" | "imobiliaria" | "due_date" | "status" | "criado_por" | "created_at";
type SortDir = "asc" | "desc";

const COLS: { label: string; key: SortKey }[] = [
  { label: "Título",           key: "title" },
  { label: "Imobiliária",      key: "imobiliaria" },
  { label: "Finalizar até",    key: "due_date" },
  { label: "Status",           key: "status" },
  { label: "Criado por",       key: "criado_por" },
  { label: "Criado em",        key: "created_at" },
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
  acoes: Acao[];
  imobiliarias: Imobiliaria[];
  colaboradores: Pick<User, "id" | "name">[];
  userId: string;
}

export default function AcoesAdminTable({ acoes: initialAcoes, imobiliarias, colaboradores, userId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [acoes, setAcoes] = useState<Acao[]>(initialAcoes);
  const [selected, setSelected] = useState<Acao | null>(null);
  const [page, setPage] = useState(1);
  const [novaAcaoOpen, setNovaAcaoOpen] = useState(false);
  const [novaAcaoForm, setNovaAcaoForm] = useState<NovaAcaoForm>({
    title: "", description: "", due_date: "", imobiliaria_id: "", colaborador_id: userId,
  });
  const [novaAcaoSaving, setNovaAcaoSaving] = useState(false);
  const [novaAcaoError, setNovaAcaoError] = useState<string | null>(null);
  const [filterImob, setFilterImob] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCriador, setFilterCriador] = useState("");
  const [filterDueFrom, setFilterDueFrom] = useState("");
  const [filterDueTo, setFilterDueTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("due_date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const imobs = useMemo(() => {
    const map = new Map<string, string>();
    acoes.forEach((a) => {
      const name = (a.imobiliarias as { name: string } | undefined)?.name;
      if (name && a.imobiliaria_id) map.set(a.imobiliaria_id, name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [acoes]);

  const criadores = useMemo(() => {
    const map = new Map<string, string>();
    acoes.forEach((a) => {
      const name = (a.users as { name: string } | undefined)?.name;
      if (name) map.set(a.created_by, name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [acoes]);

  const displayed = useMemo(() => {
    let result = acoes;

    if (filterImob) result = result.filter((a) => a.imobiliaria_id === filterImob);
    if (filterStatus) result = result.filter((a) => getEffectiveAcaoStatus(a) === filterStatus);
    if (filterCriador) result = result.filter((a) => a.created_by === filterCriador);
    if (filterDueFrom) {
      const from = new Date(filterDueFrom + "T00:00:00");
      result = result.filter((a) => new Date(a.due_date + "T00:00:00") >= from);
    }
    if (filterDueTo) {
      const to = new Date(filterDueTo + "T23:59:59");
      result = result.filter((a) => new Date(a.due_date + "T00:00:00") <= to);
    }

    return [...result].sort((a, b) => {
      let valA = "";
      let valB = "";

      switch (sortKey) {
        case "title": valA = a.title; valB = b.title; break;
        case "imobiliaria":
          valA = (a.imobiliarias as { name: string } | undefined)?.name ?? "";
          valB = (b.imobiliarias as { name: string } | undefined)?.name ?? "";
          break;
        case "due_date": valA = a.due_date; valB = b.due_date; break;
        case "status": valA = getEffectiveAcaoStatus(a); valB = getEffectiveAcaoStatus(b); break;
        case "criado_por":
          valA = (a.users as { name: string } | undefined)?.name ?? "";
          valB = (b.users as { name: string } | undefined)?.name ?? "";
          break;
        case "created_at": valA = a.created_at; valB = b.created_at; break;
      }

      const cmp = valA.localeCompare(valB, "pt-BR");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [acoes, filterImob, filterStatus, filterCriador, filterDueFrom, filterDueTo, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(["title", "imobiliaria", "status", "criado_por"].includes(key) ? "asc" : "desc");
    }
  }

  const PAGE_SIZE = 50;
  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const paged = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filterImob, filterStatus, filterCriador, filterDueFrom, filterDueTo, sortKey, sortDir]);

  const hasFilter = filterImob || filterStatus || filterCriador || filterDueFrom || filterDueTo;

  function clearFilters() {
    setFilterImob("");
    setFilterStatus("");
    setFilterCriador("");
    setFilterDueFrom("");
    setFilterDueTo("");
    setPage(1);
  }

  function handleUpdated(updated: Acao) {
    setAcoes((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelected(updated);
  }

  function openNovaAcao() {
    setNovaAcaoForm({ title: "", description: "", due_date: "", imobiliaria_id: "", colaborador_id: userId });
    setNovaAcaoError(null);
    setNovaAcaoOpen(true);
  }

  function closeNovaAcao() {
    setNovaAcaoOpen(false);
    setNovaAcaoError(null);
  }

  async function handleCriarAcao() {
    setNovaAcaoError(null);
    if (!novaAcaoForm.title.trim()) { setNovaAcaoError("O título é obrigatório."); return; }
    if (!novaAcaoForm.description.trim()) { setNovaAcaoError("A descrição é obrigatória."); return; }
    if (!novaAcaoForm.due_date) { setNovaAcaoError("A data de finalização é obrigatória."); return; }
    if (!novaAcaoForm.colaborador_id) { setNovaAcaoError("Selecione o colaborador."); return; }
    setNovaAcaoSaving(true);
    const { data, error } = await supabase
      .from("acoes")
      .insert({
        imobiliaria_id: novaAcaoForm.imobiliaria_id || null,
        created_by: novaAcaoForm.colaborador_id,
        title: novaAcaoForm.title.trim(),
        description: novaAcaoForm.description.trim(),
        due_date: novaAcaoForm.due_date,
      })
      .select("*, imobiliarias(id, name), users(id, name, email)")
      .single();
    setNovaAcaoSaving(false);
    if (error) { setNovaAcaoError("Erro ao criar a ação. Tente novamente."); return; }
    setAcoes((prev) => [data as Acao, ...prev]);
    closeNovaAcao();
  }

  const selectCls = "w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={openNovaAcao}
          className="bg-primary text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-primary-dark transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova Ação
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
            <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls}>
              <option value="">Todos</option>
              <option value="aberto">Aberto</option>
              <option value="em_andamento">Em andamento</option>
              <option value="atrasado">Atrasado</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Criado por</label>
            <select value={filterCriador} onChange={(e) => setFilterCriador(e.target.value)} className={selectCls}>
              <option value="">Todos</option>
              {criadores.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">De</label>
            <input type="date" value={filterDueFrom} onChange={(e) => setFilterDueFrom(e.target.value)} className={selectCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Até</label>
            <input type="date" value={filterDueTo} onChange={(e) => setFilterDueTo(e.target.value)} className={selectCls} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-gray-600">{displayed.length}</span> de {acoes.length} ações
            {totalPages > 1 && ` · pág. ${page}/${totalPages}`}
          </p>
          {hasFilter && (
            <button onClick={clearFilters} className="text-xs font-medium text-primary hover:text-primary-dark transition">
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
            {paged.map((a) => {
              const effective = getEffectiveAcaoStatus(a);
              return (
                <tr
                  key={a.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelected(a)}
                >
                  <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[220px] truncate">{a.title}</td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {(a.imobiliarias as { name: string } | undefined)?.name ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDateOnly(a.due_date)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ACAO_STATUS_COLOR[effective]}`}>
                      {ACAO_STATUS_LABEL[effective]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {(a.users as { name: string } | undefined)?.name}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(a.created_at)}</td>
                </tr>
              );
            })}
            {displayed.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">
                  Nenhuma ação encontrada para os filtros selecionados.
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

      <AcaoDetailModal acao={selected} userId={userId} onClose={() => setSelected(null)} onUpdated={handleUpdated} />

      {/* Modal criar nova ação */}
      {novaAcaoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => e.target === e.currentTarget && closeNovaAcao()}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="h-[3px] bg-primary" />
            <div className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900">Nova ação</h2>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Colaborador <span className="text-red-400">*</span></label>
                <select
                  value={novaAcaoForm.colaborador_id}
                  onChange={(e) => setNovaAcaoForm((p) => ({ ...p, colaborador_id: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                >
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Título <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={novaAcaoForm.title}
                  onChange={(e) => setNovaAcaoForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ex: Enviar tabela de comissões atualizada"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Descrição <span className="text-red-400">*</span></label>
                <textarea
                  rows={3}
                  value={novaAcaoForm.description}
                  onChange={(e) => setNovaAcaoForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Detalhe o que precisa ser feito"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Finalizar até <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    value={novaAcaoForm.due_date}
                    onChange={(e) => setNovaAcaoForm((p) => ({ ...p, due_date: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Imobiliária</label>
                  <Combobox
                    options={imobiliarias.map((i) => ({ value: i.id, label: i.name }))}
                    value={novaAcaoForm.imobiliaria_id}
                    onChange={(v) => setNovaAcaoForm((p) => ({ ...p, imobiliaria_id: v }))}
                    placeholder="Nenhuma"
                    emptyMessage="Nenhuma imobiliária encontrada."
                  />
                </div>
              </div>

              {novaAcaoError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{novaAcaoError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={handleCriarAcao} disabled={novaAcaoSaving}
                  className="flex-1 bg-primary text-white text-sm font-medium rounded-lg py-2.5 hover:bg-primary-dark disabled:opacity-60 transition">
                  {novaAcaoSaving ? "Salvando..." : "Salvar"}
                </button>
                <button onClick={closeNovaAcao} className="px-5 text-sm text-gray-400 hover:text-gray-600 transition">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
