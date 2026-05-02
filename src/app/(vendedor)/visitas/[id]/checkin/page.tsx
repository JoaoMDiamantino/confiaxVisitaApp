"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Visita } from "@/types";
import { formatDate } from "@/lib/utils";

export default function CheckinPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [visita, setVisita] = useState<Visita | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("visitas")
        .select("*, imobiliarias(id, name, address)")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (!data || data.status !== "agendada") {
        router.push("/dashboard");
        return;
      }

      setVisita(data as Visita);
    }
    load();
  }, [id, supabase, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      setError("A foto não pode ultrapassar 10 MB.");
      return;
    }
    if (!selected.type.startsWith("image/")) {
      setError("Apenas imagens são permitidas.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setError(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleCheckin() {
    if (!file) return;
    setError(null);
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("visita-fotos")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setError("Erro ao enviar a foto. Tente novamente.");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("visita-fotos")
      .getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("visitas")
      .update({
        checkin_at: new Date().toISOString(),
        photo_url: urlData.publicUrl,
        status: "em_andamento",
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      setError("Erro ao registrar check-in. Tente novamente.");
      setUploading(false);
      return;
    }

    router.push("/dashboard");
  }

  const imob = visita?.imobiliarias as { name: string; address: string | null } | undefined;

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* App bar */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-[#00AEEF] text-sm font-medium hover:text-[#0084c7] transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Voltar
        </Link>
        <div className="w-px h-4 bg-gray-200" />
        <Image src="/logo-icon.svg" alt="" width={20} height={20} aria-hidden="true" />
        <h1 className="text-sm font-semibold text-gray-900">Check-in</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Visit info card */}
        {visita && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
            <div className="w-[3px] flex-shrink-0 bg-[#00AEEF]" />
            <div className="flex-1 p-4">
              <p className="text-sm font-semibold text-gray-900">{imob?.name}</p>
              {imob?.address && <p className="text-xs text-gray-400 mt-0.5">{imob.address}</p>}
              <p className="text-xs text-gray-400 mt-1">{formatDate(visita.scheduled_at)}</p>
            </div>
          </div>
        )}

        {/* Photo upload card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-[3px] bg-[#00AEEF]" />
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">Foto da visita</p>
              <span className="text-xs font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">Obrigatória</span>
            </div>

            {preview ? (
              <div className="relative rounded-xl overflow-hidden">
                <Image
                  src={preview}
                  alt="Preview"
                  width={400}
                  height={300}
                  className="w-full object-cover max-h-72"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <button
                  onClick={() => {
                    URL.revokeObjectURL(preview);
                    setPreview(null);
                    setFile(null);
                  }}
                  className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <p className="absolute bottom-3 left-3 text-white text-xs font-medium bg-black/40 px-2 py-1 rounded-lg">
                  Foto selecionada
                </p>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 hover:border-[#00AEEF] rounded-2xl py-10 flex flex-col items-center gap-3 text-gray-400 hover:text-[#00AEEF] transition group"
              >
                <div className="w-14 h-14 bg-gray-50 group-hover:bg-sky-50 rounded-2xl flex items-center justify-center transition">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Tirar foto ou abrir galeria</p>
                  <p className="text-xs mt-0.5 opacity-70">Máximo 10 MB · JPG, PNG, HEIC</p>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
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
          onClick={handleCheckin}
          disabled={!file || uploading}
          className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: (!file || uploading) ? "#7dd3f0" : "linear-gradient(135deg, #003d6b 0%, #00AEEF 100%)" }}
        >
          {uploading ? "Registrando check-in..." : "Confirmar check-in"}
        </button>
      </main>
    </div>
  );
}
