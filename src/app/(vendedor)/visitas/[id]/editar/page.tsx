"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Imobiliaria } from "@/types";
import Combobox from "@/components/Combobox";

export default function EditarVisitaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imobiliarias, setImobiliarias] = useState<Imobiliaria[]>([]);
  const [imobiliariaId, setImobiliariaId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: visita }, { data: imobs }] = await Promise.all([
        supabase
          .from("visitas")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .eq("status", "agendada")
          .single(),
        supabase.from("imobiliarias").select("*").order("name"),
      ]);

      if (!visita) { router.push("/dashboard"); return; }

      setImobiliarias(imobs ?? []);
      setImobiliariaId(visita.imobiliaria_id);

      const scheduledDate = new Date(visita.scheduled_at);
      setData(new Intl.DateTimeFormat("sv-SE", {
        timeZone: "America/Sao_Paulo",
        year: "numeric", month: "2-digit", day: "2-digit",
      }).format(scheduledDate));
      setHora(new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(scheduledDate));

      setLoading(false);
    }
    load();
  }, [id, supabase, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!imobiliariaId) {
      setError("Selecione uma imobiliária.");
      return;
    }

    const scheduledAt = new Date(`${data}T${hora}`);
    if (scheduledAt < new Date()) {
      setError("A data da visita não pode ser no passado.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase
      .from("visitas")
      .update({ imobiliaria_id: imobiliariaId, scheduled_at: scheduledAt.toISOString() })
      .eq("id", id);

    if (updateError) {
      setError("Erro ao salvar. Tente novamente.");
      setSaving(false);
      return;
    }

    router.push("/dashboard?editado=1");
  }

  async function handleCancel() {
    if (!window.confirm("Tem certeza que deseja cancelar esta visita?")) return;
    setCancelling(true);
    await supabase.from("visitas").delete().eq("id", id);
    router.push("/dashboard?cancelado=1");
  }

  const minDate = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#00AEEF] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
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
        <h1 className="text-sm font-semibold text-gray-900">Editar Visita</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-[3px] bg-[#00AEEF]" />
          <form onSubmit={handleSave} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Imobiliária <span className="text-red-400">*</span>
              </label>
              <Combobox
                options={imobiliarias.map((imob) => ({ value: imob.id, label: imob.name }))}
                value={imobiliariaId}
                onChange={setImobiliariaId}
                placeholder="Buscar imobiliária..."
                emptyMessage="Nenhuma imobiliária encontrada."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Data <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={data}
                  min={minDate}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#00AEEF] focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Horário <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#00AEEF] focus:bg-white transition"
                />
              </div>
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
              disabled={saving || cancelling}
              className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: saving ? "#7dd3f0" : "linear-gradient(135deg, #003d6b 0%, #00AEEF 100%)" }}
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving || cancelling}
            className="w-full rounded-xl py-3 text-sm font-semibold text-red-600 border-2 border-red-200 hover:bg-red-50 active:scale-[0.98] transition disabled:opacity-60"
          >
            {cancelling ? "Cancelando..." : "Cancelar visita"}
          </button>
        </div>
      </main>
    </div>
  );
}
