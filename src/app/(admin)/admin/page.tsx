import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/utils";
import LogoutButton from "@/components/LogoutButton";

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

  // KPIs do mês atual
  const { data: visitasMes } = await supabase
    .from("visitas")
    .select("id, duration_minutes, rating, user_id, users(name)")
    .eq("status", "concluida")
    .gte("checkout_at", firstOfMonth);

  const totalVisitas = visitasMes?.length ?? 0;
  const notaMedia = totalVisitas > 0
    ? (visitasMes!.reduce((acc, v) => acc + (v.rating ?? 0), 0) / totalVisitas).toFixed(1)
    : "—";
  const duracaoMedia = totalVisitas > 0
    ? Math.round(visitasMes!.reduce((acc, v) => acc + (v.duration_minutes ?? 0), 0) / totalVisitas)
    : null;

  // Resumo por vendedor
  const porVendedor = visitasMes?.reduce<Record<string, { id: string; name: string; total: number; somaNotas: number }>>((acc, v) => {
    const nome = (v.users as unknown as { name: string } | null)?.name ?? "—";
    if (!acc[v.user_id]) acc[v.user_id] = { id: v.user_id, name: nome, total: 0, somaNotas: 0 };
    acc[v.user_id].total++;
    acc[v.user_id].somaNotas += v.rating ?? 0;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-base font-semibold text-gray-900">Painel Admin</h1>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-4 text-sm text-gray-500">
            <Link href="/admin" className="text-[#00AEEF] font-medium">KPIs</Link>
            <Link href="/admin/visitas" className="hover:text-gray-900 transition">Visitas</Link>
            <Link href="/admin/usuarios" className="hover:text-gray-900 transition">Usuários</Link>
            <Link href="/admin/relatorios" className="hover:text-gray-900 transition">Relatórios</Link>
          </nav>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-4">KPIs — {now.toLocaleString("pt-BR", { month: "long", year: "numeric" })}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Visitas no mês", value: totalVisitas },
              { label: "Nota média", value: notaMedia },
              { label: "Duração média", value: duracaoMedia ? formatDuration(duracaoMedia) : "—" },
              { label: "Vendedores ativos", value: Object.keys(porVendedor ?? {}).length },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-4">Resumo por vendedor</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-400">Vendedor</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400">Visitas</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400">Nota média</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(porVendedor ?? {}).map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-900">{v.name}</td>
                    <td className="px-4 py-3 text-gray-600">{v.total}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {v.total > 0 ? (v.somaNotas / v.total).toFixed(1) : "—"}
                    </td>
                  </tr>
                ))}
                {Object.keys(porVendedor ?? {}).length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">
                      Nenhuma visita concluída este mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nav mobile */}
        <div className="md:hidden grid grid-cols-2 gap-3">
          {[
            { href: "/admin/visitas", label: "Ver todas as visitas" },
            { href: "/admin/usuarios", label: "Gerenciar usuários" },
            { href: "/admin/relatorios", label: "Exportar relatórios" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white border border-gray-100 rounded-xl p-4 text-sm font-medium text-gray-700 hover:border-[#00AEEF] hover:text-[#00AEEF] transition shadow-sm"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
