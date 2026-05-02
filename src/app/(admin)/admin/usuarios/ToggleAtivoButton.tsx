"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ToggleAtivoButton({ userId, active }: { userId: string; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (!confirm(active ? "Desativar este usuário?" : "Ativar este usuário?")) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, active: !active }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao atualizar usuário.");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
          active
            ? "border border-red-200 text-red-500 hover:bg-red-50"
            : "border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
        }`}
      >
        {loading ? "..." : active ? "Desativar" : "Ativar"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
