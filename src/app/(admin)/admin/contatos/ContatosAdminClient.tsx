"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Contato, Imobiliaria, User } from "@/types";
import { formatPhone } from "@/lib/utils";
import Combobox from "@/components/Combobox";

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

const emptyForm = (imob = ""): ContatoForm => ({ name: "", email: "", role: "", phone: "", imobiliaria_id: imob });

export default function ContatosAdminClient({ initialContatos, imobiliarias, userId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [contatos, setContatos] = useState<Contato[]>(initialContatos);
  const [filtroImob, setFiltroImob] = useState("");
  const [modal, setModal] = useState<null | "new" | Contato>(null);
  const [confirmDelete, setConfirmDelete] = useState<Contato | null>(null);
  const [form, setForm] = useState<ContatoForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = contatos.filter((c) => {
    if (filtroImob && c.imobiliaria_id !== filtroImob) return false;
    return true;
  });

  const imobMap = Object.fromEntries(imobiliarias.map((i) => [i.id, i.name]));

  function openNew() { setForm(emptyForm(filtroImob)); setFormError(null); setModal("new"); }
  function openEdit(c: Contato) {
    setForm({ name: c.name, email: c.email ?? "", role: c.role ?? "", phone: c.phone ?? "", imobiliaria_id: c.imobiliaria_id });
    setFormError(null);
    setModal(c);
  }
  function closeModal() { setModal(null); setForm(emptyForm()); setFormError(null); }

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
      if (error) { setFormError("Erro ao salvar."); return; }
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
      if (error) { setFormError("Erro ao salvar."); return; }
      setContatos((prev) => prev.map((x) => x.id === c.id ? data as Contato : x));
    }
    closeModal();
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("contatos").delete().eq("id", confirmDelete.id);
    setDeleting(false);
    if (!error) setContatos((prev) => prev.filter((c) => c.id !== confirmDelete.id));
    setConfirmDelete(null);
  }

  return (
    <>
      {/* Filtros + botão novo */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Combobox
            options={imobiliarias.map((i) => ({ value: i.id, label: i.name }))}
            value={filtroImob}
            onChange={setFiltroImob}
            placeholder="Todas as imobiliárias"
            emptyMessage="Nenhuma imobiliária encontrada."
          />
        </div>
        <button
          onClick={openNew}
          className="bg-primary text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-primary-dark transition flex items-center gap-2 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo contato
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Função</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">E-mail</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Celular</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Imobiliária</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Cadastrado por</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    Nenhum contato encontrado.
                  </td>
                </tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{c.role ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatPhone(c.phone) || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {(c.imobiliarias as { name: string } | undefined)?.name ?? imobMap[c.imobiliaria_id] ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                    {(c.users as { name: string } | undefined)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-primary transition" aria-label="Editar">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button onClick={() => setConfirmDelete(c)} className="text-gray-400 hover:text-red-500 transition" aria-label="Excluir">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-50 text-xs text-gray-400">
            {filtered.length} contato{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Modal criar / editar */}
      {modal !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="h-[3px] bg-primary" />
            <div className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-900">{modal === "new" ? "Novo contato" : "Editar contato"}</h2>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Imobiliária <span className="text-red-400">*</span></label>
                <select value={form.imobiliaria_id} onChange={(e) => setForm((p) => ({ ...p, imobiliaria_id: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition">
                  <option value="">Selecione...</option>
                  {imobiliarias.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nome <span className="text-red-400">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nome completo"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Função / Cargo</label>
                  <input type="text" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} placeholder="Ex: Gerente"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Celular</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: formatPhone(e.target.value) }))} placeholder="(11) 99999-9999"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">E-mail</label>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@imobiliaria.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
              </div>

              {formError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-primary text-white text-sm font-medium rounded-lg py-2.5 hover:bg-primary-dark disabled:opacity-60 transition">
                  {saving ? "Salvando..." : "Salvar"}
                </button>
                <button onClick={closeModal} className="px-5 text-sm text-gray-400 hover:text-gray-600 transition">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Excluir contato</h2>
            <p className="text-sm text-gray-600">
              Tem certeza que deseja excluir <strong>{confirmDelete.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-500 text-white text-sm font-medium rounded-lg py-2.5 hover:bg-red-600 disabled:opacity-60 transition">
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-gray-200 text-sm text-gray-600 rounded-lg py-2.5 hover:bg-gray-50 transition">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
