import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import type { Contato, Imobiliaria } from "@/types";
import { AdminBottomNav } from "@/components/AdminNav";
import ContatosAdminClient from "./ContatosAdminClient";

export default async function AdminContatosPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (currentProfile?.role !== "admin") redirect("/dashboard");

  const [contatosResult, imobiliariasResult] = await Promise.all([
    supabase
      .from("contatos")
      .select("*, imobiliarias(id, name), users(id, name, email)")
      .order("name")
      .limit(1000),
    supabase.from("imobiliarias").select("id, name").order("name").limit(5000),
  ]);

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-primary text-sm font-medium hover:text-primary-dark transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Painel
        </Link>
        <div className="w-px h-4 bg-gray-200" />
        <Image src="/logo-icon.svg" alt="" width={20} height={20} aria-hidden="true" />
        <h1 className="text-sm font-bold text-gray-900">Contatos</h1>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
        <ContatosAdminClient
          initialContatos={(contatosResult.data as Contato[]) ?? []}
          imobiliarias={(imobiliariasResult.data as Imobiliaria[]) ?? []}
          userId={user.id}
        />
      </main>

      <AdminBottomNav />
    </div>
  );
}
