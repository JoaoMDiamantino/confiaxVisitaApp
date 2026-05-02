"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  className?: string;
}

export default function LogoutButton({ className }: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className={className ?? "text-xs text-gray-400 hover:text-gray-600 transition"}
    >
      Sair
    </button>
  );
}
