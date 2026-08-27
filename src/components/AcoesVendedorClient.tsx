"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Acao, AcaoComentario, AcaoStatus, Imobiliaria } from "@/types";
import Combobox from "@/components/Combobox";
import { ACAO_STATUS_COLOR, ACAO_STATUS_LABEL, formatDate, formatDateOnly, getEffectiveAcaoStatus } from "@/lib/utils";

interface Props {
  initialAcoes: Acao[];
  imobiliarias: Imobiliaria[];
  userId: string;
}

interface AcaoForm {
  title: string;
  description: string;
  due_date: string;
  imobiliaria_id: string;
  status: AcaoStatus;
}

const emptyForm = (imobiliaria_id = ""): AcaoForm => ({
  title: "",
  description: "",
  due_date: "",
  imobiliaria_id,
  status: "aberto",
});

export default function AcoesVendedorClient({ initialAcoes, imobiliarias, userId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [acoes, setAcoes] = useState<Acao[]>(initialAcoes);
  const [filtroImob, setFiltroImob] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [modal, setModal] = useState<null | "new" | Acao>(null);
  const [form, setForm] = useState<AcaoForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [comentarios, setComentarios] = useState<AcaoComentario[]>([]);
  const [comentariosLoading, setComentariosLoading] = useState(false);
  const [novoComentario, setNovoComentario] = useState("");
  const [comentando, setComentando] = useState(false);
  const [comentarioError, setComentarioError] = useState<string | null>(null);

  const filtered = acoes.filter((a) => {
    if (filtroImob && a.imobiliaria_id !== filtroImob) return false;
    if (filtroStatus && getEffectiveAcaoStatus(a) !== filtroStatus) return false;
    return true;
  });

  const imobMap = Object.fromEntries(imobiliarias.map((i) => [i.id, i.name]));
  const isLocked = modal !== "new";
  const lockedFieldCls = "w-full rounded-xl border-2 border-gray-100 bg-gray-100 px-4 py-3 text-sm text-gray-500 outline-none cursor-not-allowed";

  function openNew() {
    setForm(emptyForm(filtroImob));
    setFormError(null);
    setComentarios([]);
    setComentarioError(null);
    setNovoComentario("");
    setModal("new");
  }

  async function openEdit(a: Acao) {
    setForm({
      title: a.title,
      description: a.description,
      due_date: a.due_date,
      imobiliaria_id: a.imobiliaria_id ?? "",
      status: a.status,
    });
    setFormError(null);
    setComentarioError(null);
    setNovoComentario("");
    setModal(a);

    setComentariosLoading(true);
    const { data } = await supabase
      .from("acao_comentarios")
      .select("*, users(id, name, email)")
      .eq("acao_id", a.id)
      .order("created_at");
    setComentarios((data as AcaoComentario[]) ?? []);
    setComentariosLoading(false);
  }

  function closeModal() {
    setModal(null);
    setForm(emptyForm());
    setFormError(null);
    setComentarios([]);
  }

  async function handleSave() {
    setFormError(null);
    if (!form.title.trim()) { setFormError("O título é obrigatório."); return; }
    if (!form.description.trim()) { setFormError("A descrição é obrigatória."); return; }
    if (!form.due_date) { setFormError("A data de finalização é obrigatória."); return; }
    setSaving(true);

    if (modal === "new") {
      const { data, error } = await supabase
        .from("acoes")
        .insert({
          imobiliaria_id: form.imobiliaria_id || null,
          created_by: userId,
          title: form.title.trim(),
          description: form.description.trim(),
          due_date: form.due_date,
        })
        .select("*, imobiliarias(id, name), users(id, name, email)")
        .single();
      setSaving(false);
      if (error) { setFormError("Erro ao salvar. Tente novamente."); return; }
      setAcoes((prev) => [data as Acao, ...prev]);
    } else {
      const a = modal as Acao;
      const { data, error } = await supabase
        .from("acoes")
        .update({
          imobiliaria_id: form.imobiliaria_id || null,
          title: form.title.trim(),
          description: form.description.trim(),
          due_date: form.due_date,
          status: form.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", a.id)
        .select("*, imobiliarias(id, name), users(id, name, email)")
        .single();
      setSaving(false);
      if (error) { setFormError("Erro ao salvar. Tente novamente."); return; }
      setAcoes((prev) => prev.map((x) => (x.id === a.id ? (data as Acao) : x)));
    }
    closeModal();
  }

  async function handleComentar() {
    if (!novoComentario.trim() || modal === "new" || modal === null) return;
    setComentarioError(null);
    setComentando(true);
    const { data, error } = await supabase
      .from("acao_comentarios")
      .insert({ acao_id: (modal as Acao).id, created_by: userId, comment: novoComentario.trim() })
      .select("*, users(id, name, email)")
      .single();
    setComentando(false);
    if (error) { setComentarioError("Erro ao comentar. Tente novamente."); return; }
    setComentarios((prev) => [...prev, data as AcaoComentario]);
    setNovoComentario("");
  }

  return (
    <>
      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Imobiliária
          </label>
          <Combobox
            options={imobiliarias.map((i) => ({ value: i.id, label: i.name }))}
            value={filtroImob}
            onChange={setFiltroImob}
            placeholder="Todas as imobiliárias"
            emptyMessage="Nenhuma imobiliária encontrada."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Status
          </label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white transition"
          >
            <option value="">Todos</option>
            <option value="aberto">Aberto</option>
            <option value="em_andamento">Em andamento</option>
            <option value="atrasado">Atrasado</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Cabeçalho da seção + botão novo */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {filtered.length} ação{filtered.length !== 1 ? "ões" : ""}
        </p>
        <button
          onClick={openNew}
          className="bg-primary text-white text-xs font-semibold rounded-xl px-4 min-h-[44px] flex items-center gap-1.5 hover:bg-primary-dark active:scale-95 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova Ação
        </button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400 mb-2">Nenhuma ação cadastrada.</p>
          <button onClick={openNew} className="text-xs text-primary font-semibold hover:underline">
            Adicionar agora →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const effective = getEffectiveAcaoStatus(a);
            return (
              <button
                key={a.id}
                onClick={() => openEdit(a)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex hover:border-primary/30 transition"
              >
                <div className="w-[3px] flex-shrink-0 bg-primary" />
                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{a.title}</p>
                      <p className="text-xs text-primary font-medium mt-0.5">
                        {(a.imobiliarias as { name: string } | undefined)?.name ?? (a.imobiliaria_id ? imobMap[a.imobiliaria_id] : null) ?? "Sem imobiliária"}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${ACAO_STATUS_COLOR[effective]}`}>
                      {ACAO_STATUS_LABEL[effective]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{a.description}</p>
                  <p className="text-xs text-gray-400 mt-2">Finalizar até {formatDateOnly(a.due_date)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Formulário — tela cheia no mobile, modal no desktop */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 bg-brand-bg sm:bg-black/50 sm:flex sm:items-center sm:justify-center sm:p-4">
          <div className="bg-brand-bg sm:bg-white h-full sm:h-auto sm:rounded-2xl sm:max-w-md sm:w-full sm:shadow-2xl sm:max-h-[90vh] flex flex-col">

            <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex-shrink-0">
              <button
                onClick={closeModal}
                className="flex items-center gap-1.5 text-primary text-sm font-medium hover:text-primary-dark transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Voltar
              </button>
              <div className="w-px h-4 bg-gray-200" />
              <h2 className="text-sm font-semibold text-gray-900">
                {modal === "new" ? "Nova ação" : "Editar ação"}
              </h2>
            </header>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="h-[3px] bg-primary" />
                  <div className="p-5 space-y-5">

                    {isLocked && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                        <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Título, descrição e data de finalização só podem ser editados por um administrador.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Título <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        disabled={isLocked}
                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Ex: Enviar tabela de comissões atualizada"
                        className={isLocked ? lockedFieldCls : "w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white transition placeholder:text-gray-300"}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Descrição <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={form.description}
                        disabled={isLocked}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Detalhe o que precisa ser feito"
                        className={isLocked ? `${lockedFieldCls} resize-none` : "w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white transition resize-none placeholder:text-gray-300"}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Data de finalização <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        value={form.due_date}
                        disabled={isLocked}
                        onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                        className={isLocked ? lockedFieldCls : "w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white transition"}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Imobiliária
                      </label>
                      <Combobox
                        options={imobiliarias.map((i) => ({ value: i.id, label: i.name }))}
                        value={form.imobiliaria_id}
                        onChange={(v) => setForm((p) => ({ ...p, imobiliaria_id: v }))}
                        placeholder="Nenhuma (opcional)"
                        emptyMessage="Nenhuma imobiliária encontrada."
                      />
                    </div>

                    {modal !== "new" && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Status
                        </label>
                        <select
                          value={form.status}
                          onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as AcaoStatus }))}
                          className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white transition"
                        >
                          <option value="aberto">Aberto</option>
                          <option value="em_andamento">Em andamento</option>
                          <option value="concluido">Concluído</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>
                    )}

                  </div>
                </div>

                {formError && (
                  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: saving ? "#6ee7b7" : "linear-gradient(135deg, #0070b8 0%, #00AEEF 100%)" }}
                >
                  {saving ? "Salvando..." : "Salvar ação"}
                </button>

                {/* Comentários */}
                {modal !== "new" && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 space-y-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Comentários</p>

                      {comentariosLoading ? (
                        <p className="text-xs text-gray-400">Carregando comentários...</p>
                      ) : comentarios.length === 0 ? (
                        <p className="text-xs text-gray-400">Nenhum comentário ainda.</p>
                      ) : (
                        <ul className="space-y-3">
                          {comentarios.map((c) => (
                            <li key={c.id} className="bg-gray-50 rounded-xl px-3 py-2.5">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="text-xs font-semibold text-gray-700">
                                  {(c.users as { name: string } | undefined)?.name ?? "—"}
                                </p>
                                <p className="text-[10px] text-gray-400 flex-shrink-0">{formatDate(c.created_at)}</p>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.comment}</p>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={novoComentario}
                          onChange={(e) => setNovoComentario(e.target.value)}
                          placeholder="Adicionar um comentário..."
                          className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white transition resize-none placeholder:text-gray-300"
                        />
                        {comentarioError && <p className="text-xs text-red-600">{comentarioError}</p>}
                        <button
                          onClick={handleComentar}
                          disabled={comentando || !novoComentario.trim()}
                          className="text-xs font-semibold text-primary hover:text-primary-dark disabled:opacity-40 transition"
                        >
                          {comentando ? "Enviando..." : "Comentar"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
