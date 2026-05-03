"use client";

import { useState, useRef, useEffect } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface Props {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
}

export default function Combobox({
  options,
  value,
  onChange,
  placeholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
}: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";
  const displayValue = isOpen ? query : selectedLabel;

  const filtered =
    query.length === 0
      ? options
      : options.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase())
        );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleFocus() {
    setQuery("");
    setIsOpen(true);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setIsOpen(true);
    if (!e.target.value) onChange("");
  }

  function handleSelect(option: ComboboxOption) {
    onChange(option.value);
    setQuery("");
    setIsOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={isOpen ? "Digite para filtrar..." : placeholder}
          autoComplete="off"
          className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 pr-10 text-sm text-gray-900 outline-none focus:border-[#00AEEF] focus:bg-white transition placeholder:text-gray-300"
        />
        {value ? (
          <button
            type="button"
            onMouseDown={handleClear}
            aria-label="Limpar seleção"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-0.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </div>

      {isOpen && (
        <ul className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-gray-100 shadow-lg max-h-56 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(option)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    option.value === value
                      ? "text-[#00AEEF] font-medium bg-sky-50"
                      : "text-gray-900 hover:bg-sky-50 hover:text-[#00AEEF]"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-sm text-gray-400">{emptyMessage}</li>
          )}
        </ul>
      )}
    </div>
  );
}
