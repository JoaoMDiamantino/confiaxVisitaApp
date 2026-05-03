"use client";

const LABELS = ["Muito ruim", "Ruim", "Regular", "Boa", "Excelente"];

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function StarRating({ value, onChange }: Props) {
  return (
    <div className="flex gap-2" role="group" aria-label="Avaliação da visita">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} estrela${star > 1 ? "s" : ""} — ${LABELS[star - 1]}`}
          aria-pressed={star <= value}
          className={`text-4xl leading-none transition-all active:scale-90 ${
            star <= value ? "text-amber-400 drop-shadow-sm" : "text-gray-200 hover:text-amber-200"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
