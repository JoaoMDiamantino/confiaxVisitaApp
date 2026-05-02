"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ToggleAtivoButton({ userId, active }: { userId: string; active: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!confirm(active ? "Desativar este usuário?" : "Ativar este usuário?")) return;
    setLoading(true);
    await supabase.from("users").update({ active: !active }).eq("id", userId);
    router.refresh();
    setLoading(false);
  }

  return (
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
  );
}
