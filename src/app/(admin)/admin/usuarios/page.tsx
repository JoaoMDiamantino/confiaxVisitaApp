import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import type { User } from "@/types";
import NovoUsuarioButton from "./NovoUsuarioButton";
import ToggleAtivoButton from "./ToggleAtivoButton";

export default async function AdminUsuariosPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (currentProfile?.role !== "admin") redirect("/dashboard");

  const { data: usuarios } = await supabase
    .from("users")
    .select("id, name, email, role, active, created_at")
    .order("name");

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3">
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
          <h1 className="text-sm font-bold text-gray-900">Usuários</h1>
        </div>
        <NovoUsuarioButton />
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {["Nome", "E-mail", "Perfil", "Status", "Ação"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(usuarios as User[])?.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#00AEEF]/10 flex items-center justify-center text-[#00AEEF] text-xs font-bold flex-shrink-0">
                        {u.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      u.role === "admin" ? "bg-violet-50 text-violet-700" : "bg-sky-50 text-sky-700"
                    }`}>
                      {u.role === "admin" ? "Admin" : "Gestor"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      u.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"
                    }`}>
                      {u.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <ToggleAtivoButton userId={u.id} active={u.active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
