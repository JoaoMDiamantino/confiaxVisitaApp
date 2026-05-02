import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(dateStr: string) {
  return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
