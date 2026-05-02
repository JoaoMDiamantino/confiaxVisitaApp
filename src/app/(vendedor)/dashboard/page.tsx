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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#00AEEF] flex items-center justify-center text-white text-sm font-bold">
            {profile?.name?.[0]?.toUpperCase() ?? "V"}
          </div>
          <span className="text-sm font-medium text-gray-900">{profile?.name}</span>
        </div>
        <LogoutButton />
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* Próximas visitas */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Próximas visitas</h2>
            <Link
              href="/visitas/agendar"
              className="bg-[#00AEEF] text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-[#0099d4] transition"
            >
              + Agendar
            </Link>
          </div>

          {agendadas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma visita agendada.</p>
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
          <h2 className="text-base font-semibold text-gray-900 mb-4">Histórico</h2>

          {historico.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma visita concluída.</p>
          ) : (
            <div className="space-y-3">
              {historico.map((visita) => (
                <div
                  key={visita.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {(visita.imobiliarias as { name: string } | undefined)?.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(visita.scheduled_at)}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-sm ${i < (visita.rating ?? 0) ? "text-amber-400" : "text-gray-200"}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {visita.notes && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{visita.notes}</p>
                  )}
                  {visita.duration_minutes && (
                    <p className="text-xs text-gray-400 mt-1">Duração: {visita.duration_minutes} min</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
