"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Visita } from "@/types";
import { formatDate, formatDuration } from "@/lib/utils";

export default function RelatoriosClient() {
  const supabase = useMemo(() => createClient(), []);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchVisitas(): Promise<Visita[]> {
    if (!inicio || !fim) {
      setError("Selecione o período.");
      return [];
    }
    setError(null);
    setLoading(true);

    const { data, error: fetchError } = await supabase
      .from("visitas")
      .select("*, users(name, email), imobiliarias(name)")
      .eq("status", "concluida")
      .gte("scheduled_at", new Date(inicio).toISOString())
      .lte("scheduled_at", new Date(fim + "T23:59:59").toISOString())
      .order("scheduled_at", { ascending: true });

    setLoading(false);
    if (fetchError) { setError("Erro ao buscar dados."); return []; }
    return (data as Visita[]) ?? [];
  }

  async function exportCSV() {
    const visitas = await fetchVisitas();
    if (visitas.length === 0) { setError("Nenhuma visita no período selecionado."); return; }

    const header = ["Gestor", "E-mail", "Imobiliária", "Data agendada", "Check-in", "Checkout", "Duração (min)", "Nota", "Comentários"];
    const rows = visitas.map((v) => [
      (v.users as { name: string } | undefined)?.name ?? "",
      (v.users as { email: string } | undefined)?.email ?? "",
      (v.imobiliarias as { name: string } | undefined)?.name ?? "",
      formatDate(v.scheduled_at),
      v.checkin_at ? formatDate(v.checkin_at) : "",
      v.checkout_at ? formatDate(v.checkout_at) : "",
      v.duration_minutes ?? "",
      v.rating ?? "",
      v.notes?.replace(/\n/g, " ") ?? "",
    ]);

    const escapeCell = (cell: string | number) =>
      `"${String(cell).replace(/"/g, '""')}"`;

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visitas_${inicio}_${fim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    const visitas = await fetchVisitas();
    if (visitas.length === 0) { setError("Nenhuma visita no período selecionado."); return; }

    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`Relatório de Visitas — ${inicio} a ${fim}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [["Gestor", "Imobiliária", "Data agendada", "Duração", "Nota"]],
      body: visitas.map((v) => [
        (v.users as { name: string } | undefined)?.name ?? "",
        (v.imobiliarias as { name: string } | undefined)?.name ?? "",
        formatDate(v.scheduled_at),
        v.duration_minutes ? formatDuration(v.duration_minutes) : "—",
        v.rating ? "★".repeat(v.rating) : "—",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 174, 239] },
    });

    doc.save(`visitas_${inicio}_${fim}.pdf`);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Filtrar por período</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Data início</label>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Data fim</label>
            <input
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={exportCSV}
          disabled={loading}
          className="flex-1 border border-primary text-primary text-sm font-medium rounded-lg py-2.5 hover:bg-primary/5 disabled:opacity-60 transition"
        >
          {loading ? "Gerando..." : "Exportar CSV"}
        </button>
        <button
          onClick={exportPDF}
          disabled={loading}
          className="flex-1 bg-primary text-white text-sm font-medium rounded-lg py-2.5 hover:bg-[#0099d4] disabled:opacity-60 transition"
        >
          {loading ? "Gerando..." : "Exportar PDF"}
        </button>
      </div>
    </div>
  );
}
