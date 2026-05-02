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
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-900">{imob?.name}</p>
          {imob?.address && (
            <p className="text-xs text-gray-400 mt-0.5">{imob.address}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">{formatDate(visita.scheduled_at)}</p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isEmAndamento
              ? "bg-amber-50 text-amber-600"
              : "bg-blue-50 text-blue-600"
          }`}
        >
          {isEmAndamento ? "Em andamento" : "Agendada"}
        </span>
      </div>

      <div className="flex gap-2">
        {!isEmAndamento && (
          <Link
            href={`/visitas/${visita.id}/checkin`}
            className="flex-1 text-center bg-[#00AEEF] text-white text-sm font-medium rounded-lg py-2.5 hover:bg-[#0099d4] transition"
          >
            Check-in
          </Link>
        )}
        {isEmAndamento && (
          <Link
            href={`/visitas/${visita.id}/checkout`}
            className="flex-1 text-center bg-emerald-500 text-white text-sm font-medium rounded-lg py-2.5 hover:bg-emerald-600 transition"
          >
            Checkout
          </Link>
        )}
      </div>
    </div>
  );
}
