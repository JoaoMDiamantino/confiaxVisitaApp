import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import type { Visita } from "@/types";
import { formatDate } from "@/lib/utils";
import LogoutButton from "@/components/LogoutButton";
import VisitaCard from "@/components/VisitaCard";

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();

  const { data: visitas } = await supabase
    .from("visitas")
    .select("*, imobiliarias(id, name, address)")
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: false });

  const agendadas = (visitas as Visita[])?.filter(
    (v) => v.status === "agendada" || v.status === "em_andamento"
  ) ?? [];

  const historico = (visitas as Visita[])?.filter(
    (v) => v.status === "concluida"
  ) ?? [];

  const initial = profile?.name?.[0]?.toUpperCase() ?? "V";

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Gradient hero header */}
      <div
        className="relative overflow-hidden px-4 pb-8 pt-12"
        style={{ background: "linear-gradient(135deg, #002952 0%, #0070b8 60%, #00AEEF 100%)" }}
      >
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(0,41,82,0.08))" }}
        />

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-base font-bold">
              {initial}
            </div>
            <div>
              <p className="text-white/60 text-xs">Olá,</p>
              <p className="text-white font-semibold text-sm leading-tight">{profile?.name}</p>
            </div>
          </div>
          <LogoutButton className="text-white/50 hover:text-white text-xs transition" />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-2xl p-4 border border-white/20 backdrop-blur-sm">
            <p className="text-white/60 text-xs mb-1">Agendadas</p>
            <p className="text-white text-3xl font-extrabold tabular-nums">{agendadas.length}</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-4 border border-white/20 backdrop-blur-sm">
            <p className="text-white/60 text-xs mb-1">Concluídas</p>
            <p className="text-white text-3xl font-extrabold tabular-nums">{historico.length}</p>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* Próximas visitas */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Próximas visitas</h2>
            <Link
              href="/visitas/agendar"
              className="bg-[#00AEEF] text-white text-xs font-semibold rounded-xl px-4 py-2 hover:bg-[#0084c7] active:scale-95 transition"
            >
              + Agendar
            </Link>
          </div>

          {agendadas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#00AEEF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 mb-2">Nenhuma visita agendada.</p>
              <Link href="/visitas/agendar" className="text-xs text-[#00AEEF] font-semibold hover:underline">
                Agendar agora →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {agendadas.map((visita) => (
                <VisitaCard key={visita.id} visita={visita} />
              ))}
            </div>
          )}
        </section>

        {/* Histórico */}
        <section>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Histórico</h2>

          {historico.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <p className="text-sm text-gray-400">Nenhuma visita concluída.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historico.map((visita) => (
                <div key={visita.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
                  <div className="w-[3px] flex-shrink-0 bg-emerald-400" />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900 flex-1 min-w-0 pr-2 truncate">
                        {(visita.imobiliarias as { name: string } | undefined)?.name}
                      </p>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-xs ${i < (visita.rating ?? 0) ? "text-amber-400" : "text-gray-200"}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{formatDate(visita.scheduled_at)}</p>
                    {visita.notes && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{visita.notes}</p>
                    )}
                    {visita.duration_minutes && (
                      <p className="text-xs text-gray-400 mt-2">
                        <span className="bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
                          {visita.duration_minutes} min
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
