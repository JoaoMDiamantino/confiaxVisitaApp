import { redirect } from "next/navigation";
import Link from "next/link";
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-[#00AEEF] text-sm">← Painel</Link>
          <h1 className="text-sm font-semibold text-gray-900">Usuários</h1>
        </div>
        <NovoUsuarioButton />
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {["Nome", "E-mail", "Perfil", "Status", "Ação"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-medium text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(usuarios as User[])?.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      u.role === "admin" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {u.role === "admin" ? "Admin" : "Gestor"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      u.active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                    }`}>
                      {u.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
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
