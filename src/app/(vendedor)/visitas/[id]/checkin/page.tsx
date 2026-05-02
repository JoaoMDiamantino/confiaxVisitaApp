"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Visita } from "@/types";
import { formatDate } from "@/lib/utils";

export default function CheckinPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [visita, setVisita] = useState<Visita | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("visitas")
      .select("*, imobiliarias(id, name, address)")
      .eq("id", id)
      .single()
      .then(({ data }) => setVisita(data as Visita));
  }, [id, supabase]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
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
      .eq("id", id);

    if (updateError) {
      setError("Erro ao registrar check-in. Tente novamente.");
      setUploading(false);
      return;
    }

    router.push("/dashboard");
  }

  const imob = visita?.imobiliarias as { name: string; address: string | null } | undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/dashboard" className="text-[#00AEEF] text-sm">← Voltar</Link>
        <h1 className="text-sm font-semibold text-gray-900">Check-in</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {visita && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-900">{imob?.name}</p>
            {imob?.address && <p className="text-xs text-gray-400 mt-0.5">{imob.address}</p>}
            <p className="text-xs text-gray-400 mt-1">{formatDate(visita.scheduled_at)}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Foto da visita <span className="text-red-500">*</span></p>

          {preview ? (
            <div className="relative">
              <Image
                src={preview}
                alt="Preview"
                width={400}
                height={300}
                className="w-full rounded-lg object-cover max-h-64"
              />
              <button
                onClick={() => { setPreview(null); setFile(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center gap-2 text-gray-400 hover:border-[#00AEEF] hover:text-[#00AEEF] transition"
            >
              <span className="text-3xl">📷</span>
              <span className="text-sm">Tirar foto ou selecionar galeria</span>
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

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleCheckin}
          disabled={!file || uploading}
          className="w-full bg-[#00AEEF] hover:bg-[#0099d4] disabled:opacity-40 text-white font-medium rounded-lg px-4 py-3 text-sm transition"
        >
          {uploading ? "Registrando check-in..." : "Confirmar check-in"}
        </button>
      </main>
    </div>
  );
}
