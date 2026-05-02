"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/dashboard" className="text-[#00AEEF] text-sm">← Voltar</Link>
        <h1 className="text-sm font-semibold text-gray-900">Checkout</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {visita && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-900">{imob?.name}</p>
            {imob?.address && <p className="text-xs text-gray-400 mt-0.5">{imob.address}</p>}
            <p className="text-xs text-gray-400 mt-1">Check-in: {visita.checkin_at ? formatDate(visita.checkin_at) : "—"}</p>
          </div>
        )}

        <form onSubmit={handleCheckout} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Avaliação da visita <span className="text-red-500">*</span>
            </p>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentários <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva as principais atividades, assuntos discutidos e resultados da visita..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 transition resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-3 text-sm transition"
          >
            {loading ? "Finalizando visita..." : "Confirmar checkout"}
          </button>
        </form>
      </main>
    </div>
  );
}
