import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import type { Visita } from "@/types";
import { AdminBottomNav } from "@/components/AdminNav";
import VisitasAdminTable from "@/components/VisitasAdminTable";

export default async function AdminVisitasPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (currentProfile?.role !== "admin") redirect("/dashboard");

  const { data: visitas } = await supabase
    .from("visitas")
    .select("*, users(name, email), imobiliarias(name), prospectos(name)")
    .order("scheduled_at", { ascending: false })
    .limit(500);

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-[#00AEEF] text-sm font-medium hover:text-[#0084c7] transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Painel
        </Link>
        <div className="w-px h-4 bg-gray-200" />
        <Image src="/logo-icon.svg" alt="" width={20} height={20} aria-hidden="true" />
        <h1 className="text-sm font-bold text-gray-900">Todas as visitas</h1>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
        <VisitasAdminTable visitas={(visitas as Visita[]) ?? []} />
      </main>

      <AdminBottomNav />
    </div>
  );
}
