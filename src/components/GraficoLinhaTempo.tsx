"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatDuration } from "@/lib/utils";

export type VisitaParaGrafico = {
  id: string;
  user_id: string;
  checkout_at: string;
  duration_minutes: number | null;
  rating: number | null;
};

export type GestorParaGrafico = { id: string; name: string };

type Granularidade = "diaria" | "semanal" | "mensal";
type Parametro = "visitas" | "tempo_medio" | "tempo_total" | "nota";

const MESES_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function periodoKey(dateStr: string, gran: Granularidade): string {
  const d = new Date(dateStr);
  if (gran === "diaria") return d.toISOString().slice(0, 10);
  if (gran === "semanal") {
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    return monday.toISOString().slice(0, 10);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatLabel(key: string, gran: Granularidade): string {
  if (gran === "mensal") {
    const [y, m] = key.split("-");
    return `${MESES_PT[parseInt(m) - 1]}/${y.slice(2)}`;
  }
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

function gerarPeriodos(gran: Granularidade, hoje: Date): string[] {
  const list: string[] = [];
  if (gran === "diaria") {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - i);
      list.push(d.toISOString().slice(0, 10));
    }
  } else if (gran === "semanal") {
    const day = hoje.getDay();
    const currentMonday = new Date(hoje);
    currentMonday.setDate(hoje.getDate() + (day === 0 ? -6 : 1 - day));
    for (let i = 7; i >= 0; i--) {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() - i * 7);
      list.push(d.toISOString().slice(0, 10));
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
  }
  return list;
}

export default function GraficoLinhaTempo({
  visitas,
  gestores,
}: {
  visitas: VisitaParaGrafico[];
  gestores: GestorParaGrafico[];
}) {
  const [gran, setGran] = useState<Granularidade>("diaria");
  const [param, setParam] = useState<Parametro>("visitas");
  const [gestorId, setGestorId] = useState<string>("todos");

  const dados = useMemo(() => {
    const hoje = new Date();
    let cutoff: Date;
    if (gran === "diaria") {
      cutoff = new Date(hoje);
      cutoff.setDate(hoje.getDate() - 29);
    } else if (gran === "semanal") {
      cutoff = new Date(hoje);
      cutoff.setDate(hoje.getDate() - 56);
    } else {
      cutoff = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1);
    }

    type Bucket = { count: number; sumDur: number; sumRat: number; cntRat: number };
    const buckets: Record<string, Bucket> = {};
    for (const v of visitas) {
      if (!v.checkout_at) continue;
      if (gestorId !== "todos" && v.user_id !== gestorId) continue;
      if (new Date(v.checkout_at) < cutoff) continue;
      const key = periodoKey(v.checkout_at, gran);
      if (!buckets[key]) buckets[key] = { count: 0, sumDur: 0, sumRat: 0, cntRat: 0 };
      buckets[key].count++;
      if (v.duration_minutes != null) buckets[key].sumDur += v.duration_minutes;
      if (v.rating != null) { buckets[key].sumRat += v.rating; buckets[key].cntRat++; }
    }

    return gerarPeriodos(gran, hoje).map((key) => {
      const b = buckets[key];
      let valor: number | null = 0;
      if (b) {
        if (param === "visitas") valor = b.count;
        else if (param === "tempo_medio") valor = b.count > 0 ? Math.round(b.sumDur / b.count) : 0;
        else if (param === "tempo_total") valor = b.sumDur;
        else valor = b.cntRat > 0 ? Math.round((b.sumRat / b.cntRat) * 10) / 10 : null;
      } else {
        valor = param === "nota" ? null : 0;
      }
      return { label: formatLabel(key, gran), valor };
    });
  }, [visitas, gran, param, gestorId]);

  function fmtY(v: number): string {
    if (param === "tempo_medio" || param === "tempo_total") return formatDuration(v);
    if (param === "nota") return v.toFixed(1);
    return String(v);
  }

  function fmtTooltip(v: number | string | readonly (number | string)[] | undefined): [string, string] {
    const nomes: Record<Parametro, string> = {
      visitas: "Visitas",
      tempo_medio: "Tempo médio",
      tempo_total: "Tempo total",
      nota: "Nota média",
    };
    const num = typeof v === "number" ? v : 0;
    if (param === "tempo_medio" || param === "tempo_total") return [formatDuration(num), nomes[param]];
    if (param === "nota") return [`${num.toFixed(1)} ★`, nomes[param]];
    return [String(num), nomes[param]];
  }

  const pill = "px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer";
  const on = "bg-[#00AEEF] text-white";
  const off = "bg-gray-100 text-gray-600 hover:bg-gray-200";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["diaria", "semanal", "mensal"] as Granularidade[]).map((v) => (
            <button key={v} onClick={() => setGran(v)} className={`${pill} ${gran === v ? on : off}`}>
              {v === "diaria" ? "Diário" : v === "semanal" ? "Semanal" : "Mensal"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            ["visitas", "Qtd. Visitas"],
            ["tempo_medio", "Tempo Médio"],
            ["tempo_total", "Tempo Total"],
            ["nota", "Nota"],
          ] as [Parametro, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setParam(v)} className={`${pill} ${param === v ? on : off}`}>
              {label}
            </button>
          ))}
        </div>
        {gestores.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setGestorId("todos")} className={`${pill} ${gestorId === "todos" ? on : off}`}>
              Todos
            </button>
            {gestores.map((g) => (
              <button key={g.id} onClick={() => setGestorId(g.id)} className={`${pill} ${gestorId === g.id ? on : off}`}>
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={dados} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={fmtY}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            width={param === "tempo_medio" || param === "tempo_total" ? 72 : 44}
            domain={param === "nota" ? ["auto", (dataMax: number) => Math.min(dataMax, 5)] : undefined}
          />
          <Tooltip
            formatter={fmtTooltip}
            contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12, padding: "6px 10px" }}
            labelStyle={{ color: "#374151", fontWeight: 600, marginBottom: 2 }}
            cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="valor"
            stroke="#00AEEF"
            strokeWidth={2}
            dot={{ r: 3, fill: "#00AEEF", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
