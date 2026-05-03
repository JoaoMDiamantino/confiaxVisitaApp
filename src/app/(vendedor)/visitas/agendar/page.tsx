"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Imobiliaria } from "@/types";
import Combobox from "@/components/Combobox";

export default function AgendarVisitaPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [imobiliarias, setImobiliarias] = useState<Imobiliaria[]>([]);
  const [imobiliariaId, setImobiliariaId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("imobiliarias")
      .select("*")
      .order("name")
      .then(({ data }) => setImobiliarias(data ?? []));
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
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

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error: insertError } = await supabase.from("visitas").insert({
      user_id: user.id,
      imobiliaria_id: imobiliariaId,
      scheduled_at: scheduledAt.toISOString(),
      status: "agendada",
    });

    if (insertError) {
      setError("Erro ao agendar visita. Tente novamente.");
      setLoading(false);
      return;
    }

    router.push("/dashboard?agendado=1");
  }

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
        <h1 className="text-sm font-semibold text-gray-900">Agendar Visita</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-[3px] bg-[#00AEEF]" />
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

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
                  min={new Date().toISOString().split("T")[0]}
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
              disabled={loading}
              className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: loading ? "#7dd3f0" : "linear-gradient(135deg, #003d6b 0%, #00AEEF 100%)" }}
            >
              {loading ? "Agendando..." : "Agendar visita"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
