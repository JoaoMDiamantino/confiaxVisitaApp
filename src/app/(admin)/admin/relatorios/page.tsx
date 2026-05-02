import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import RelatoriosClient from "./RelatoriosClient";

export default async function RelatoriosPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/admin" className="text-[#00AEEF] text-sm">← Painel</Link>
        <h1 className="text-sm font-semibold text-gray-900">Relatórios</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <RelatoriosClient />
      </main>
    </div>
  );
}
