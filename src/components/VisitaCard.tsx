import Link from "next/link";
import type { Visita } from "@/types";
import { formatDate } from "@/lib/utils";

interface Props {
  visita: Visita;
}

export default function VisitaCard({ visita }: Props) {
  const imob = visita.imobiliarias as { name: string; address: string | null } | undefined;
  const isEmAndamento = visita.status === "em_andamento";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
      <div className={`w-[3px] flex-shrink-0 ${isEmAndamento ? "bg-amber-400" : "bg-[#00AEEF]"}`} />
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between mb-1">
          <p className="text-sm font-semibold text-gray-900 leading-tight flex-1 min-w-0 pr-2 truncate">
            {imob?.name}
          </p>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${
              isEmAndamento
                ? "bg-amber-50 text-amber-700"
                : "bg-sky-50 text-sky-700"
            }`}
          >
            {isEmAndamento ? "Em andamento" : "Agendada"}
          </span>
        </div>

        {imob?.address && (
          <p className="text-xs text-gray-400 mb-0.5 truncate">{imob.address}</p>
        )}
        <p className="text-xs text-gray-400 mb-3">{formatDate(visita.scheduled_at)}</p>

        {!isEmAndamento && (
          <>
            <Link
              href={`/visitas/${visita.id}/checkin`}
              className="block text-center bg-[#00AEEF] hover:bg-[#0084c7] active:scale-[0.98] text-white text-sm font-medium rounded-xl py-2.5 transition"
            >
              Fazer check-in
            </Link>
            <Link
              href={`/visitas/${visita.id}/editar`}
              className="block text-center text-[#00AEEF] text-xs font-medium rounded-xl py-2 mt-2 hover:bg-sky-50 transition"
            >
              Editar visita
            </Link>
          </>
        )}
        {isEmAndamento && (
          <Link
            href={`/visitas/${visita.id}/checkout`}
            className="block text-center bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white text-sm font-medium rounded-xl py-2.5 transition"
          >
            Confirmar checkout
          </Link>
        )}
      </div>
    </div>
  );
}
