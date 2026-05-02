"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("E-mail ou senha inválidos.");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Erro ao obter usuário.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role, active")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setError("Erro ao acessar o sistema. Contate o administrador.");
        return;
      }

      if (!profile.active) {
        await supabase.auth.signOut();
        setError("Usuário inativo. Entre em contato com o administrador.");
        return;
      }

      router.push(profile.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #001e3c 0%, #002d58 35%, #006ba8 75%, #00AEEF 100%)" }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,174,239,0.35) 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,174,239,0.2) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 60%)" }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Card */}
        <div className="bg-white rounded-3xl p-8" style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
          <div className="flex justify-center mb-8">
            <Image src="/logo.png" alt="ConFiaX Seguros" width={160} height={48} priority />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Bem-vindo</h1>
          <p className="text-sm text-gray-400 mb-7">
            Acesse o sistema de gestão de visitas.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#00AEEF] focus:bg-white transition placeholder:text-gray-300"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#00AEEF] focus:bg-white transition placeholder:text-gray-300"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
              style={{ background: loading ? "#7dd3f0" : "linear-gradient(135deg, #003d6b 0%, #00AEEF 100%)" }}
            >
              {loading ? "Entrando..." : "Entrar →"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-5">
          ConFiaX Seguros © 2026
        </p>
      </div>
    </div>
  );
}
