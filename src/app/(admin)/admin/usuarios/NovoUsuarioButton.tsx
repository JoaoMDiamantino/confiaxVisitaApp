"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NovoUsuarioButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"vendedor" | "admin">("vendedor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao criar usuário.");
      setLoading(false);
      return;
    }

    setOpen(false);
    setName(""); setEmail(""); setPassword(""); setRole("vendedor");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#00AEEF] text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-[#0099d4] transition"
      >
        + Novo usuário
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Novo usuário</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha temporária</label>
                <input
                  type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                <select
                  value={role} onChange={(e) => setRole(e.target.value as "vendedor" | "admin")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20"
                >
                  <option value="vendedor">Gestor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button" onClick={() => setOpen(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg py-2.5 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex-1 bg-[#00AEEF] text-white text-sm font-medium rounded-lg py-2.5 hover:bg-[#0099d4] disabled:opacity-60 transition"
                >
                  {loading ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
