"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Contato, Imobiliaria } from "@/types";
import Combobox from "@/components/Combobox";
import { formatPhone } from "@/lib/utils";

interface Props {
  initialContatos: Contato[];
  imobiliarias: Imobiliaria[];
  userId: string;
}

interface ContatoForm {
  name: string;
  email: string;
  role: string;
  phone: string;
  imobiliaria_id: string;
}

const emptyForm = (imobiliaria_id = ""): ContatoForm => ({
  name: "",
  email: "",
  role: "",
  phone: "",
  imobiliaria_id,
});

export default function ContatosVendedorClient({ initialContatos, imobiliarias, userId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [contatos, setContatos] = useState<Contato[]>(initialContatos);
  const [filtroImob, setFiltroImob] = useState("");
  const [modal, setModal] = useState<null | "new" | Contato>(null);
  const [form, setForm] = useState<ContatoForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = filtroImob ? contatos.filter((c) => c.imobiliaria_id === filtroImob) : contatos;
  const imobMap = Object.fromEntries(imobiliarias.map((i) => [i.id, i.name]));

  function openNew() {
    setForm(emptyForm(filtroImob));
    setFormError(null);
    setModal("new");
  }

  function openEdit(c: Contato) {
    setForm({ name: c.name, email: c.email ?? "", role: c.role ?? "", phone: c.phone ?? "", imobiliaria_id: c.imobiliaria_id });
    setFormError(null);
    setModal(c);
  }

  function closeModal() {
    setModal(null);
    setForm(emptyForm());
    setFormError(null);
  }

  async function handleSave() {
    setFormError(null);
    if (!form.name.trim()) { setFormError("O nome é obrigatório."); return; }
    if (!form.imobiliaria_id) { setFormError("Selecione uma imobiliária."); return; }
    setSaving(true);

    if (modal === "new") {
      const { data, error } = await supabase
        .from("contatos")
        .insert({
          imobiliaria_id: form.imobiliaria_id,
          created_by: userId,
          name: form.name.trim(),
          email: form.email || null,
          role: form.role || null,
          phone: form.phone || null,
        })
        .select("*, imobiliarias(id, name), users(id, name, email)")
        .single();
      setSaving(false);
      if (error) { setFormError("Erro ao salvar. Tente novamente."); return; }
      setContatos((prev) => [data as Contato, ...prev]);
    } else {
      const c = modal as Contato;
      const { data, error } = await supabase
        .from("contatos")
        .update({
          imobiliaria_id: form.imobiliaria_id,
          name: form.name.trim(),
          email: form.email || null,
          role: form.role || null,
          phone: form.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", c.id)
        .select("*, imobiliarias(id, name), users(id, name, email)")
        .single();
      setSaving(false);
      if (error) { setFormError("Erro ao salvar. Tente novamente."); return; }
      setContatos((prev) => prev.map((x) => x.id === c.id ? data as Contato : x));
    }
    closeModal();
  }

  return (
    <>
      {/* Filtro — combobox com busca */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Imobiliária
        </label>
        <Combobox
          options={imobiliarias.map((i) => ({ value: i.id, label: i.name }))}
          value={filtroImob}
          onChange={setFiltroImob}
          placeholder="Todas as imobiliárias"
          emptyMessage="Nenhuma imobiliária encontrada."
        />
      </div>

      {/* Cabeçalho da seção + botão novo */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {filtered.length} contato{filtered.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={openNew}
          className="bg-primary text-white text-xs font-semibold rounded-xl px-4 min-h-[44px] flex items-center gap-1.5 hover:bg-primary-dark active:scale-95 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo
        </button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400 mb-2">Nenhum contato cadastrado.</p>
          <button onClick={openNew} className="text-xs text-primary font-semibold hover:underline">
            Adicionar agora →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
              <div className="w-[3px] flex-shrink-0 bg-primary" />
              <div className="flex-1 p-4 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{c.name}</p>
                    <p className="text-xs text-primary font-medium mt-0.5">
                      {(c.imobiliarias as { name: string } | undefined)?.name ?? imobMap[c.imobiliaria_id] ?? "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => openEdit(c)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-primary hover:bg-sky-50 transition flex-shrink-0"
                    aria-label="Editar contato"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </button>
                </div>
                {(c.role || c.phone || c.email) && (
                  <div className="mt-2 space-y-0.5">
                    {c.role && <p className="text-xs text-gray-500">{c.role}</p>}
                    {c.phone && <p className="text-xs text-gray-500">{formatPhone(c.phone)}</p>}
                    {c.email && <p className="text-xs text-gray-500 break-all">{c.email}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulário — tela cheia no mobile, modal no desktop */}
      {modal !== null && (
        <div
          className="fixed inset-0 z-50 bg-brand-bg sm:bg-black/50 sm:flex sm:items-center sm:justify-center sm:p-4"
        >
          <div className="bg-brand-bg sm:bg-white h-full sm:h-auto sm:rounded-2xl sm:max-w-md sm:w-full sm:shadow-2xl flex flex-col">

            {/* App bar — igual ao checkout */}
            <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex-shrink-0">
              <button
                onClick={closeModal}
                className="flex items-center gap-1.5 text-primary text-sm font-medium hover:text-primary-dark transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Voltar
              </button>
              <div className="w-px h-4 bg-gray-200" />
              <h2 className="text-sm font-semibold text-gray-900">
                {modal === "new" ? "Novo contato" : "Editar contato"}
              </h2>
            </header>

            {/* Campos — scroll independente */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="h-[3px] bg-primary" />
                  <div className="p-5 space-y-5">

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Imobiliária <span className="text-red-400">*</span>
                      </label>
                      <Combobox
                        options={imobiliarias.map((i) => ({ value: i.id, label: i.name }))}
                        value={form.imobiliaria_id}
                        onChange={(v) => setForm((p) => ({ ...p, imobiliaria_id: v }))}
                        placeholder="Buscar imobiliária..."
                        emptyMessage="Nenhuma imobiliária encontrada."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Nome <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Nome completo"
                        className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white transition placeholder:text-gray-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Função / Cargo
                      </label>
                      <input
                        type="text"
                        value={form.role}
                        onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                        placeholder="Ex: Gerente"
                        className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white transition placeholder:text-gray-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Celular
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: formatPhone(e.target.value) }))}
                        placeholder="(11) 99999-9999"
                        className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white transition placeholder:text-gray-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="email@imobiliaria.com"
                        className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white transition placeholder:text-gray-300"
                      />
                    </div>

                  </div>
                </div>

                {formError && (
                  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: saving ? "#6ee7b7" : "linear-gradient(135deg, #0070b8 0%, #00AEEF 100%)" }}
                >
                  {saving ? "Salvando..." : "Salvar contato"}
                </button>

              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
