"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Visita, Contato } from "@/types";
import { formatDate, formatDuration, formatPhone } from "@/lib/utils";

export default function RelatoriosClient() {
  const supabase = useMemo(() => createClient(), []);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contatos
  const [imobiliarias, setImobiliarias] = useState<Array<{ id: string; name: string }>>([]);
  const [filtroImobContatos, setFiltroImobContatos] = useState("");
  const [loadingContatos, setLoadingContatos] = useState(false);
  const [errorContatos, setErrorContatos] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("imobiliarias").select("id, name").order("name").limit(5000).then(({ data }) => {
      if (data) setImobiliarias(data);
    });
  }, [supabase]);

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

  async function fetchContatos(): Promise<Contato[]> {
    setErrorContatos(null);
    setLoadingContatos(true);
    let query = supabase
      .from("contatos")
      .select("*, imobiliarias(name), users(name)")
      .order("name");
    if (filtroImobContatos) query = query.eq("imobiliaria_id", filtroImobContatos);
    const { data, error: fetchError } = await query;
    setLoadingContatos(false);
    if (fetchError) { setErrorContatos("Erro ao buscar contatos."); return []; }
    return (data as Contato[]) ?? [];
  }

  async function exportContatosCSV() {
    const contatos = await fetchContatos();
    if (contatos.length === 0) { setErrorContatos("Nenhum contato encontrado."); return; }

    const header = ["Nome", "Função", "E-mail", "Celular", "Imobiliária", "Cadastrado por", "Data"];
    const rows = contatos.map((c) => [
      c.name,
      c.role ?? "",
      c.email ?? "",
      formatPhone(c.phone),
      (c.imobiliarias as { name: string } | undefined)?.name ?? "",
      (c.users as { name: string } | undefined)?.name ?? "",
      formatDate(c.created_at),
    ]);

    const escapeCell = (cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contatos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportContatosPDF() {
    const contatos = await fetchContatos();
    if (contatos.length === 0) { setErrorContatos("Nenhum contato encontrado."); return; }

    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Relatório de Contatos", 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [["Nome", "Função", "E-mail", "Celular", "Imobiliária", "Cadastrado por", "Data"]],
      body: contatos.map((c) => [
        c.name,
        c.role ?? "—",
        c.email ?? "—",
        formatPhone(c.phone) || "—",
        (c.imobiliarias as { name: string } | undefined)?.name ?? "—",
        (c.users as { name: string } | undefined)?.name ?? "—",
        formatDate(c.created_at),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 174, 239] },
    });

    doc.save(`contatos_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className="space-y-6">
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

    {/* Bloco de contatos */}
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Exportar Contatos</h2>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Filtrar por imobiliária (opcional)</label>
          <select
            value={filtroImobContatos}
            onChange={(e) => setFiltroImobContatos(e.target.value)}
            className="w-full sm:w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
          >
            <option value="">Todas as imobiliárias</option>
            {imobiliarias.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
      </div>

      {errorContatos && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errorContatos}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={exportContatosCSV}
          disabled={loadingContatos}
          className="flex-1 border border-primary text-primary text-sm font-medium rounded-lg py-2.5 hover:bg-primary/5 disabled:opacity-60 transition"
        >
          {loadingContatos ? "Gerando..." : "Exportar CSV"}
        </button>
        <button
          onClick={exportContatosPDF}
          disabled={loadingContatos}
          className="flex-1 bg-primary text-white text-sm font-medium rounded-lg py-2.5 hover:bg-[#0099d4] disabled:opacity-60 transition"
        >
          {loadingContatos ? "Gerando..." : "Exportar PDF"}
        </button>
      </div>
    </div>
    </div>
  );
}
