import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import type { Visita } from "@/types";
import LogoutButton from "@/components/LogoutButton";
import VisitaCard from "@/components/VisitaCard";
import SuccessToast from "@/components/SuccessToast";
import HistoricoList from "@/components/HistoricoList";
import VendedorBottomNav from "@/components/VendedorBottomNav";

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();

  const [{ data: agendadasData }, { data: historicoData }] = await Promise.all([
    supabase
      .from("visitas")
      .select("*, imobiliarias(id, name, address), prospectos(id, name)")
      .eq("user_id", user.id)
      .in("status", ["agendada", "em_andamento"])
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("visitas")
      .select("*, imobiliarias(id, name, address), prospectos(id, name)")
      .eq("user_id", user.id)
      .eq("status", "concluida")
      .order("scheduled_at", { ascending: false }),
  ]);

  const agendadas = (agendadasData as Visita[]) ?? [];
  const historico = (historicoData as Visita[]) ?? [];

  const initial = profile?.name?.[0]?.toUpperCase() ?? "V";

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <Suspense>
        <SuccessToast param="agendado" message="Visita agendada com sucesso!" />
        <SuccessToast param="editado" message="Visita atualizada com sucesso!" />
        <SuccessToast param="cancelado" message="Visita cancelada." />
      </Suspense>

      {/* Gradient hero header */}
      <div
        className="relative overflow-hidden px-4 pb-10 pt-10"
        style={{ background: "linear-gradient(160deg, #002952 0%, #0070b8 60%, #00AEEF 100%)" }}
      >
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,174,239,0.2) 0%, transparent 70%)" }}
        />

        {/* Top bar: logo esquerda, sair direita */}
        <div className="flex items-center justify-between mb-8">
          <Image src="/logo.svg" alt="ConFiaX Seguros" width={140} height={42} priority unoptimized />
          <LogoutButton className="text-white/40 hover:text-white text-xs transition" />
        </div>

        {/* Identidade e stats centralizados */}
        <div className="flex flex-col items-center text-center gap-5">
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-lg font-bold">
              {initial}
            </div>
            <p className="text-white font-semibold text-sm">{profile?.name}</p>
            <p className="text-white/50 text-xs">Bem-vindo de volta</p>
          </div>

          <div className="flex gap-3 w-full max-w-xs">
            <div className="flex-1 bg-white/15 rounded-2xl p-4 border border-white/20 backdrop-blur-sm text-center">
              <p className="text-white/60 text-xs mb-1">Agendadas</p>
              <p className="text-white text-3xl font-extrabold tabular-nums">{agendadas.length}</p>
            </div>
            <div className="flex-1 bg-white/15 rounded-2xl p-4 border border-white/20 backdrop-blur-sm text-center">
              <p className="text-white/60 text-xs mb-1">Concluídas</p>
              <p className="text-white text-3xl font-extrabold tabular-nums">{historico.length}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6 pb-28 space-y-8">
        {/* Próximas visitas */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Próximas visitas</h2>
            <Link
              href="/visitas/agendar"
              className="bg-[#00AEEF] text-white text-xs font-semibold rounded-xl px-4 min-h-[44px] flex items-center hover:bg-[#0084c7] active:scale-95 transition"
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
          <HistoricoList visitas={historico} />
        </section>
      </main>

      <VendedorBottomNav />
    </div>
  );
}
