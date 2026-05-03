"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Props {
  param: string;
  message: string;
}

export default function SuccessToast({ param, message }: Props) {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get(param) === "1") {
      setVisible(true);
      const url = new URL(window.location.href);
      url.searchParams.delete(param);
      window.history.replaceState({}, "", url.toString());

      const timer = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, param]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none">
      <div className="bg-emerald-500 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg pointer-events-auto">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-medium flex-1">{message}</span>
        <button
          onClick={() => setVisible(false)}
          aria-label="Fechar notificação"
          className="text-white/70 hover:text-white transition p-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
