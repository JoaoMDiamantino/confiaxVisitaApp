export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const datePart = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${datePart} às ${timePart}`;
}

export function getEffectiveStatus(visita: { status: string; scheduled_at: string }): string {
  if (visita.status !== "agendada") return visita.status;
  const now = new Date();
  const scheduled = new Date(visita.scheduled_at);
  const nowSP       = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const scheduledSP = new Date(scheduled.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const nowDay       = new Date(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate());
  const scheduledDay = new Date(scheduledSP.getFullYear(), scheduledSP.getMonth(), scheduledSP.getDate());
  return scheduledDay < nowDay ? "atrasada" : "agendada";
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
