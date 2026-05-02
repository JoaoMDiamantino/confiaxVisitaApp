"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Imobiliaria } from "@/types";

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

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/dashboard" className="text-[#00AEEF] text-sm">← Voltar</Link>
        <h1 className="text-sm font-semibold text-gray-900">Agendar Visita</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imobiliária</label>
            <select
              required
              value={imobiliariaId}
              onChange={(e) => setImobiliariaId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 transition"
            >
              <option value="">Selecione...</option>
              {imobiliarias.map((imob) => (
                <option key={imob.id} value={imob.id}>{imob.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              type="date"
              required
              value={data}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setData(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
            <input
              type="time"
              required
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 transition"
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
            className="w-full bg-[#00AEEF] hover:bg-[#0099d4] disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition"
          >
            {loading ? "Agendando..." : "Agendar visita"}
          </button>
        </form>
      </main>
    </div>
  );
}
