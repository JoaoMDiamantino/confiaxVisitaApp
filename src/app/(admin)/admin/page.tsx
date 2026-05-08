import { redirect } from "next/navigation";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/utils";
import LogoutButton from "@/components/LogoutButton";
import { AdminDesktopNav, AdminBottomNav } from "@/components/AdminNav";
import ResumoGestorTable from "@/components/ResumoGestorTable";
import GraficoLinhaTempo, { type VisitaParaGrafico, type GestorParaGrafico } from "@/components/GraficoLinhaTempo";

export default async function AdminPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (currentProfile?.role !== "admin") redirect("/dashboard");

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const dozemesesAtras = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();

  const { data: visitasMes } = await supabase
    .from("visitas")
    .select("id, duration_minutes, rating, user_id, users(name)")
    .eq("status", "concluida")
    .gte("checkout_at", firstOfMonth);

  const [{ data: visitasHistorico }, { data: gestores }] = await Promise.all([
    supabase
      .from("visitas")
      .select("id, user_id, checkout_at, duration_minutes, rating")
      .eq("status", "concluida")
      .gte("checkout_at", dozemesesAtras)
      .order("checkout_at", { ascending: true }),
    supabase
      .from("users")
      .select("id, name")
      .eq("role", "vendedor")
      .eq("active", true)
      .order("name"),
  ]);

  const totalVisitas = visitasMes?.length ?? 0;
  const notaMedia = totalVisitas > 0
    ? (visitasMes!.reduce((acc, v) => acc + (v.rating ?? 0), 0) / totalVisitas).toFixed(1)
    : "—";
  const duracaoMedia = totalVisitas > 0
    ? Math.round(visitasMes!.reduce((acc, v) => acc + (v.duration_minutes ?? 0), 0) / totalVisitas)
    : null;

  const porVendedor = visitasMes?.reduce<Record<string, { id: string; name: string; total: number; somaNotas: number; somaDuracao: number }>>((acc, v) => {
    const nome = (v.users as unknown as { name: string } | null)?.name ?? "—";
    if (!acc[v.user_id]) acc[v.user_id] = { id: v.user_id, name: nome, total: 0, somaNotas: 0, somaDuracao: 0 };
    acc[v.user_id].total++;
    acc[v.user_id].somaNotas += v.rating ?? 0;
    acc[v.user_id].somaDuracao += v.duration_minutes ?? 0;
    return acc;
  }, {});

  const kpis = [
    {
      label: "Visitas no mês",
      value: totalVisitas,
      accent: "bg-sky-400",
      icon: (
        <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
    {
      label: "Nota média",
      value: notaMedia,
      accent: "bg-amber-400",
      icon: (
        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
    {
      label: "Duração média",
      value: duracaoMedia ? formatDuration(duracaoMedia) : "—",
      accent: "bg-emerald-400",
      icon: (
        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Gestores ativos",
      value: Object.keys(porVendedor ?? {}).length,
      accent: "bg-violet-400",
      icon: (
        <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3">
          <Image src="/logo-icon.svg" alt="ConFiaX" width={32} height={32} className="flex-shrink-0" />
          <h1 className="text-sm font-bold text-gray-900">Painel Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <AdminDesktopNav />
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8 pb-24 md:pb-8">
        {/* KPIs */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
            KPIs — {now.toLocaleString("pt-BR", { month: "long", year: "numeric" })}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`h-[3px] ${kpi.accent}`} />
                <div className="p-5">
                  <div className="mb-3">{kpi.icon}</div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{kpi.label}</p>
                  <p className="text-3xl font-extrabold text-gray-900 tabular-nums">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo por gestor */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Resumo por gestor</p>
          <ResumoGestorTable rows={Object.values(porVendedor ?? {})} />
        </div>

        {/* Linha do tempo */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Linha do tempo</p>
          <GraficoLinhaTempo
            visitas={(visitasHistorico ?? []) as VisitaParaGrafico[]}
            gestores={(gestores ?? []) as GestorParaGrafico[]}
          />
        </div>

      </main>

      <AdminBottomNav />
    </div>
  );
}
