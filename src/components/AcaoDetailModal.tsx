"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Acao, AcaoComentario, AcaoStatus } from "@/types";
import { ACAO_STATUS_COLOR, ACAO_STATUS_LABEL, formatDate, formatDateOnly, getEffectiveAcaoStatus } from "@/lib/utils";

interface Props {
  acao: Acao | null;
  userId: string;
  onClose: () => void;
  onUpdated: (acao: Acao) => void;
}

interface EditForm {
  title: string;
  description: string;
  due_date: string;
}

export default function AcaoDetailModal({ acao, userId, onClose, onUpdated }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [comentarios, setComentarios] = useState<AcaoComentario[]>([]);
  const [comentariosLoading, setComentariosLoading] = useState(false);
  const [novoComentario, setNovoComentario] = useState("");
  const [comentando, setComentando] = useState(false);
  const [comentarioError, setComentarioError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ title: "", description: "", due_date: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!acao) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [acao, onClose]);

  useEffect(() => {
    if (!acao) { setComentarios([]); return; }
    let cancelled = false;
    setComentariosLoading(true);
    setNovoComentario("");
    setComentarioError(null);
    setEditing(false);
    setEditError(null);
    setEditForm({ title: acao.title, description: acao.description, due_date: acao.due_date });
    supabase
      .from("acao_comentarios")
      .select("*, users(id, name, email)")
      .eq("acao_id", acao.id)
      .order("created_at")
      .then(({ data }) => {
        if (cancelled) return;
        setComentarios((data as AcaoComentario[]) ?? []);
        setComentariosLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acao?.id]);

  if (!acao) return null;

  const imobName = (acao.imobiliarias as { name: string } | undefined)?.name ?? null;
  const criadorNome = (acao.users as { name: string } | undefined)?.name ?? "—";
  const effectiveStatus = getEffectiveAcaoStatus(acao);

  function openEdit() {
    setEditForm({ title: acao!.title, description: acao!.description, due_date: acao!.due_date });
    setEditError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditError(null);
  }

  async function handleSaveEdit() {
    setEditError(null);
    if (!editForm.title.trim()) { setEditError("O título é obrigatório."); return; }
    if (!editForm.description.trim()) { setEditError("A descrição é obrigatória."); return; }
    if (!editForm.due_date) { setEditError("A data de finalização é obrigatória."); return; }
    setEditSaving(true);
    const { data, error } = await supabase
      .from("acoes")
      .update({
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        due_date: editForm.due_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", acao!.id)
      .select("*, imobiliarias(id, name), users(id, name, email)")
      .single();
    setEditSaving(false);
    if (error) { setEditError("Erro ao salvar. Tente novamente."); return; }
    onUpdated(data as Acao);
    setEditing(false);
  }

  async function handleStatusChange(status: AcaoStatus) {
    setStatusSaving(true);
    const { data, error } = await supabase
      .from("acoes")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", acao!.id)
      .select("*, imobiliarias(id, name), users(id, name, email)")
      .single();
    setStatusSaving(false);
    if (!error && data) onUpdated(data as Acao);
  }

  async function handleComentar() {
    if (!novoComentario.trim()) return;
    setComentarioError(null);
    setComentando(true);
    const { data, error } = await supabase
      .from("acao_comentarios")
      .insert({ acao_id: acao!.id, created_by: userId, comment: novoComentario.trim() })
      .select("*, users(id, name, email)")
      .single();
    setComentando(false);
    if (error) { setComentarioError("Erro ao comentar. Tente novamente."); return; }
    setComentarios((prev) => [...prev, data as AcaoComentario]);
    setNovoComentario("");
  }

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
            {imobName && <p className="text-xs text-gray-400">{imobName}</p>}
            <h2 className="text-base font-bold text-gray-900">{acao.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ACAO_STATUS_COLOR[effectiveStatus]}`}>
              {ACAO_STATUS_LABEL[effectiveStatus]}
            </span>
            {!editing && (
              <button onClick={openEdit} className="text-gray-400 hover:text-primary transition" aria-label="Editar ação">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition" aria-label="Fechar">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Título</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Descrição</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Finalizar até</label>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm((p) => ({ ...p, due_date: e.target.value }))}
                  className="w-full sm:w-auto rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              {editError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{editError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  className="flex-1 bg-primary text-white text-sm font-medium rounded-lg py-2.5 hover:bg-primary-dark disabled:opacity-60 transition"
                >
                  {editSaving ? "Salvando..." : "Salvar alterações"}
                </button>
                <button onClick={cancelEdit} className="px-5 text-sm text-gray-400 hover:text-gray-600 transition">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Descrição</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{acao.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Finalizar até</p>
                  <p className="text-sm text-gray-700">{formatDateOnly(acao.due_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Criado por</p>
                  <p className="text-sm text-gray-700">{criadorNome}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Criado em</p>
                  <p className="text-sm text-gray-700">{formatDate(acao.created_at)}</p>
                </div>
              </div>
            </>
          )}

          <div>
            <p className="text-xs text-gray-400 mb-1.5">Status</p>
            <select
              value={acao.status}
              disabled={statusSaving}
              onChange={(e) => handleStatusChange(e.target.value as AcaoStatus)}
              className="w-full sm:w-auto rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition disabled:opacity-60"
            >
              <option value="aberto">Aberto</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Comentários */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Comentários</p>

            {comentariosLoading ? (
              <p className="text-xs text-gray-400">Carregando comentários...</p>
            ) : comentarios.length === 0 ? (
              <p className="text-xs text-gray-400 mb-3">Nenhum comentário ainda.</p>
            ) : (
              <ul className="space-y-3 mb-3">
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
      </div>
    </div>
  );
}
