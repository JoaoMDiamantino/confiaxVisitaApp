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

function isPastDate(dateStr: string): boolean {
  const now = new Date();
  const target = new Date(dateStr);
  const nowSP    = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const targetSP = new Date(target.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const nowDay    = new Date(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate());
  const targetDay = new Date(targetSP.getFullYear(), targetSP.getMonth(), targetSP.getDate());
  return targetDay < nowDay;
}

export function getEffectiveStatus(visita: { status: string; scheduled_at: string }): string {
  if (visita.status !== "agendada") return visita.status;
  return isPastDate(visita.scheduled_at) ? "atrasada" : "agendada";
}

export function formatDateOnly(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function getEffectiveAcaoStatus(acao: { status: string; due_date: string }): string {
  if (acao.status !== "aberto" && acao.status !== "em_andamento") return acao.status;
  // due_date é uma data pura (YYYY-MM-DD, sem timezone) — comparar por calendário,
  // não por instante, para não deslocar um dia ao converter para America/Sao_Paulo.
  const [y, m, d] = acao.due_date.split("-").map(Number);
  const dueDay = new Date(y, m - 1, d);
  const nowSP = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const todaySP = new Date(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate());
  return dueDay < todaySP ? "atrasado" : acao.status;
}

export const ACAO_STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  atrasado: "Atrasado",
};

export const ACAO_STATUS_COLOR: Record<string, string> = {
  aberto: "bg-blue-50 text-blue-600",
  em_andamento: "bg-amber-50 text-amber-600",
  concluido: "bg-emerald-50 text-emerald-600",
  cancelado: "bg-gray-100 text-gray-500",
  atrasado: "bg-red-50 text-red-600",
};

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.replace(/(\d{1,2})/, "($1");
  if (digits.length <= 6) return digits.replace(/(\d{2})(\d{1,4})/, "($1) $2");
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d{1,4})/, "($1) $2-$3");
  return digits.replace(/(\d{2})(\d{5})(\d{1,4})/, "($1) $2-$3");
}

export async function compressImage(file: File, maxDimension = 1600, quality = 0.8): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
