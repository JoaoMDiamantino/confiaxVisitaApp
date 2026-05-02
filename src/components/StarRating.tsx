"use client";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function StarRating({ value, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-3xl transition ${star <= value ? "text-amber-400" : "text-gray-200 hover:text-amber-200"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
