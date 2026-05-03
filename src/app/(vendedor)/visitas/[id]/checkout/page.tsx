"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Visita } from "@/types";
import { formatDate } from "@/lib/utils";
import StarRating from "@/components/StarRating";

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [visita, setVisita] = useState<Visita | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("visitas")
        .select("*, imobiliarias(id, name, address)")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (!data || data.status !== "em_andamento") {
        router.push("/dashboard");
        return;
      }

      setVisita(data as Visita);
    }
    load();
  }, [id, supabase, router]);

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

    router.push("/dashboard");
  }

  const imob = visita?.imobiliarias as { name: string; address: string | null } | undefined;

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
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
        {visita ? (
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
