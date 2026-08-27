import { redirect } from "next/navigation";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import type { Acao, Imobiliaria } from "@/types";
import VendedorBottomNav from "@/components/VendedorBottomNav";
import AcoesVendedorClient from "@/components/AcoesVendedorClient";

export default async function AcoesPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [acoesResult, imobiliariasResult] = await Promise.all([
    supabase
      .from("acoes")
      .select("*, imobiliarias(id, name), users(id, name, email)")
      .order("due_date"),
    supabase.from("imobiliarias").select("id, name").order("name").limit(5000),
  ]);

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <Image src="/logo-icon.svg" alt="" width={20} height={20} aria-hidden="true" />
        <h1 className="text-sm font-semibold text-gray-900">Ações</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-28">
        <AcoesVendedorClient
          initialAcoes={(acoesResult.data as Acao[]) ?? []}
          imobiliarias={(imobiliariasResult.data as Imobiliaria[]) ?? []}
          userId={user.id}
        />
      </main>

      <VendedorBottomNav />
    </div>
  );
}
