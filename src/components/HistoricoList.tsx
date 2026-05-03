import Link from "next/link";
import type { Visita } from "@/types";
import { formatDate } from "@/lib/utils";

const LIMIT = 5;

interface Props {
  visitas: Visita[];
}

export default function HistoricoList({ visitas }: Props) {
  if (visitas.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
        <p className="text-sm text-gray-400">Nenhuma visita concluída.</p>
      </div>
    );
  }

  const shown = visitas.slice(0, LIMIT);
  const hasMore = visitas.length > LIMIT;

  return (
    <div className="space-y-3">
      {shown.map((visita) => {
        const imob = visita.imobiliarias as { name: string } | undefined;
        return (
          <div key={visita.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
            <div className="w-[3px] flex-shrink-0 bg-emerald-400" />
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-semibold text-gray-900 flex-1 min-w-0 pr-2 truncate">
                  {imob?.name}
                </p>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-xs ${i < (visita.rating ?? 0) ? "text-amber-400" : "text-gray-200"}`}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400">{formatDate(visita.scheduled_at)}</p>
              {visita.notes && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{visita.notes}</p>
              )}
              {visita.duration_minutes && (
                <p className="text-xs text-gray-400 mt-2">
                  <span className="bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
                    {visita.duration_minutes} min
                  </span>
                </p>
              )}
            </div>
          </div>
        );
      })}

      <Link
        href="/historico"
        className="block w-full py-3 text-center text-sm font-medium text-[#00AEEF] hover:text-[#0084c7] bg-white rounded-2xl border border-gray-100 shadow-sm transition hover:border-[#00AEEF]/30 active:scale-[0.99]"
      >
        {hasMore
          ? `Ver histórico completo (${visitas.length} visitas) →`
          : "Ver histórico com filtros →"}
      </Link>
    </div>
  );
}
