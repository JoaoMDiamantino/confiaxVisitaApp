import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import type { Visita } from "@/types";
import { formatDate, formatDuration } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  agendada: "Agendada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

const STATUS_COLOR: Record<string, string> = {
  agendada: "bg-blue-50 text-blue-600",
  em_andamento: "bg-amber-50 text-amber-600",
  concluida: "bg-emerald-50 text-emerald-600",
};

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
    .select("*, users(name, email), imobiliarias(name)")
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

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {["Gestor", "Imobiliária", "Agendado", "Check-in", "Duração", "Nota", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(visitas as Visita[])?.map((v) => (
                <tr key={v.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    {(v.users as { name: string } | undefined)?.name}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {(v.imobiliarias as { name: string } | undefined)?.name}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(v.scheduled_at)}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {v.checkin_at ? formatDate(v.checkin_at) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {v.duration_minutes ? formatDuration(v.duration_minutes) : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-amber-400 text-xs tracking-tighter">
                      {v.rating ? "★".repeat(v.rating) : <span className="text-gray-300">—</span>}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[v.status]}`}>
                      {STATUS_LABEL[v.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {(!visitas || visitas.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">
                    Nenhuma visita registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
