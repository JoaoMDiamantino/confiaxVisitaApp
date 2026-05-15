import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import type { Visita, Imobiliaria } from "@/types";
import HistoricoFiltros from "@/components/HistoricoFiltros";
import VendedorBottomNav from "@/components/VendedorBottomNav";

export default async function HistoricoPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [visitasResult, imobiliariasResult] = await Promise.all([
    supabase
      .from("visitas")
      .select("*, imobiliarias(id, name, address), prospectos(id, name)")
      .eq("user_id", user.id)
      .eq("status", "concluida")
      .order("scheduled_at", { ascending: false }),
    supabase.from("imobiliarias").select("id, name").order("name").limit(5000),
  ]);

  if (!visitasResult.data) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <p className="text-sm text-red-600">Erro ao carregar histórico. Tente novamente.</p>
      </div>
    );
  }

  const visitasData = visitasResult.data;
  const imobiliariasData = imobiliariasResult.data ?? [];

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-primary text-sm font-medium hover:text-primary-dark transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Dashboard
        </Link>
        <div className="w-px h-4 bg-gray-200" />
        <Image src="/logo-icon.svg" alt="" width={20} height={20} aria-hidden="true" />
        <h1 className="text-sm font-semibold text-gray-900">Histórico completo</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-28">
        <HistoricoFiltros
          visitas={(visitasData as Visita[]) ?? []}
          imobiliarias={(imobiliariasData as Imobiliaria[]) ?? []}
        />
      </main>

      <VendedorBottomNav />
    </div>
  );
}
