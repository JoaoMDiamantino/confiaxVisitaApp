"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Visita } from "@/types";
import { formatDate, formatPhone } from "@/lib/utils";
import StarRating from "@/components/StarRating";

interface ContatoForm {
  name: string;
  email: string;
  role: string;
  phone: string;
}

const emptyContato = (): ContatoForm => ({ name: "", email: "", role: "", phone: "" });

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [visita, setVisita] = useState<Visita | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Contatos
  const [contatos, setContatos] = useState<ContatoForm[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [contatoAtual, setContatoAtual] = useState<ContatoForm>(emptyContato());
  const [contatoError, setContatoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { router.push("/login"); return; }

      const { data, error: loadError } = await supabase
        .from("visitas")
        .select("*, imobiliarias(id, name, address)")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (cancelled) return;
      if (loadError) { setFetchError("Erro ao carregar a visita."); return; }
      if (!data || data.status !== "em_andamento") {
        router.push("/dashboard");
        return;
      }

      setVisita(data as Visita);
    }
    load();
    return () => { cancelled = true; };
  }, [id, supabase, router]);

  function adicionarContato() {
    setContatoError(null);
    if (!contatoAtual.name.trim()) {
      setContatoError("O nome do contato é obrigatório.");
      return;
    }
    setContatos((prev) => [...prev, { ...contatoAtual, name: contatoAtual.name.trim() }]);
    setContatoAtual(emptyContato());
    setFormAberto(false);
  }

  function removerContato(idx: number) {
    setContatos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Selecione uma nota para a visita.");
      return;
    }
    if (notes.trim().length < 3) {
      setError("Descreva brevemente a visita no campo de comentários.");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const now = new Date();
    const checkinAt = visita?.checkin_at ? new Date(visita.checkin_at) : now;
    const durationMinutes = Math.round((now.getTime() - checkinAt.getTime()) / 60000);

    const { error: updateError } = await supabase
      .from("visitas")
      .update({
        checkout_at: now.toISOString(),
        duration_minutes: durationMinutes,
        rating,
        notes: notes.trim(),
        status: "concluida",
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      setError("Erro ao registrar checkout. Tente novamente.");
      setLoading(false);
      return;
    }

    // Salvar contatos (se houver)
    if (contatos.length > 0 && visita?.imobiliaria_id) {
      const rows = contatos.map((c) => ({
        imobiliaria_id: visita.imobiliaria_id,
        visita_id: id,
        created_by: user.id,
        name: c.name,
        email: c.email || null,
        role: c.role || null,
        phone: c.phone || null,
      }));
      await supabase.from("contatos").insert(rows);
      // Erros de contatos são silenciosos para não bloquear o checkout
    }

    router.push("/dashboard");
  }

  const imob = visita?.imobiliarias as { name: string; address: string | null } | undefined;

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-10">
      {/* App bar */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-[#00AEEF] text-sm font-medium hover:text-[#0084c7] transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Voltar
        </Link>
        <div className="w-px h-4 bg-gray-200" />
        <Image src="/logo-icon.svg" alt="" width={20} height={20} aria-hidden="true" />
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 leading-tight">Checkout</h1>
          {visita && (
            <p className="text-xs text-gray-400 truncate">{imob?.name}</p>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Visit info card */}
        {fetchError ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-700">
            {fetchError}
          </div>
        ) : visita ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
            <div className="w-[3px] flex-shrink-0 bg-amber-400" />
            <div className="flex-1 p-4">
              <p className="text-sm font-semibold text-gray-900">{imob?.name}</p>
              {imob?.address && <p className="text-xs text-gray-400 mt-0.5">{imob.address}</p>}
              <p className="text-xs text-gray-400 mt-1">
                Check-in: {visita.checkin_at ? formatDate(visita.checkin_at) : "—"}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex animate-pulse">
            <div className="w-[3px] flex-shrink-0 bg-gray-100" />
            <div className="flex-1 p-4 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
        )}

        {/* Evaluation form card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-[3px] bg-emerald-400" />
          <form onSubmit={handleCheckout} className="p-5 space-y-6">

            {/* Star rating */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Avaliação da visita
                <span className="text-red-400 ml-1">*</span>
              </p>
              <StarRating value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  {["", "Muito ruim", "Ruim", "Regular", "Boa", "Excelente"][rating]}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Comentários
                <span className="text-red-400 ml-1">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">Descreva as principais atividades, assuntos discutidos e resultados da visita.</p>
              <textarea
                required
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Apresentei os produtos ao gerente, discutimos parceria para lançamentos..."
                className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#00AEEF] focus:bg-white transition resize-none placeholder:text-gray-300 leading-relaxed"
              />
              <p className={`text-xs mt-1.5 text-right transition-colors ${notes.length > 0 && notes.trim().length < 3 ? "text-amber-500" : "text-gray-400"}`}>
                {notes.trim().length < 3
                  ? `${notes.trim().length}/3 caracteres mínimos`
                  : `${notes.length} caracteres`}
              </p>
            </div>

            {/* ── Contatos da visita ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Contatos da visita
                  <span className="ml-1.5 text-[10px] font-normal text-gray-400 normal-case">(opcional)</span>
                </p>
              </div>

              {/* Lista de contatos adicionados */}
              {contatos.length > 0 && (
                <ul className="space-y-2 mb-3">
                  {contatos.map((c, i) => (
                    <li key={i} className="flex items-start gap-3 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {[c.role, formatPhone(c.phone), c.email].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerContato(i)}
                        className="text-gray-300 hover:text-red-400 transition mt-0.5 flex-shrink-0"
                        aria-label="Remover contato"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Formulário inline de novo contato */}
              {formAberto ? (
                <div className="border-2 border-[#00AEEF]/30 rounded-xl p-4 space-y-3 bg-sky-50/40">
                  <p className="text-xs font-semibold text-[#00AEEF]">Novo contato</p>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Nome <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={contatoAtual.name}
                      onChange={(e) => setContatoAtual((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Nome completo"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#00AEEF] transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Função / Cargo</label>
                      <input
                        type="text"
                        value={contatoAtual.role}
                        onChange={(e) => setContatoAtual((p) => ({ ...p, role: e.target.value }))}
                        placeholder="Ex: Gerente"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#00AEEF] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Celular</label>
                      <input
                        type="tel"
                        value={contatoAtual.phone}
                        onChange={(e) => setContatoAtual((p) => ({ ...p, phone: formatPhone(e.target.value) }))}
                        placeholder="(11) 99999-9999"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#00AEEF] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={contatoAtual.email}
                      onChange={(e) => setContatoAtual((p) => ({ ...p, email: e.target.value }))}
                      placeholder="email@imobiliaria.com"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#00AEEF] transition"
                    />
                  </div>

                  {contatoError && (
                    <p className="text-xs text-red-600">{contatoError}</p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={adicionarContato}
                      className="flex-1 bg-[#00AEEF] text-white text-sm font-semibold rounded-lg py-2 hover:bg-[#0099d4] active:scale-[0.98] transition"
                    >
                      Salvar contato
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFormAberto(false); setContatoAtual(emptyContato()); setContatoError(null); }}
                      className="px-4 text-sm text-gray-400 hover:text-gray-600 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setFormAberto(true)}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-[#00AEEF] hover:text-[#00AEEF] transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {contatos.length === 0 ? "Cadastrar contato" : "Cadastrar outro"}
                </button>
              )}
            </div>
            {/* ── fim contatos ── */}

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: loading ? "#6ee7b7" : "linear-gradient(135deg, #065f46 0%, #059669 100%)" }}
            >
              {loading ? "Finalizando visita..." : "Confirmar checkout"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
