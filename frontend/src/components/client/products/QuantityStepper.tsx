"use client";

import { Minus, Plus } from "lucide-react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  max?: number | null;
  disabled?: boolean;
}

export default function QuantityStepper({ value, onChange, max, disabled }: Props) {
  const dec = () => onChange(Math.max(1, value - 1));
  const inc = () => {
    const next = value + 1;
    if (max != null && next > max) return;
    onChange(next);
  };
  const atMax = max != null && value >= max;

  return (
    <div
      className={`inline-flex items-center overflow-hidden rounded-xl border border-zinc-200 bg-white ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= 1}
        className="flex h-11 w-11 items-center justify-center text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        min="1"
        max={max ?? undefined}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const n = Math.max(1, parseInt(e.target.value) || 1);
          onChange(max != null ? Math.min(n, max) : n);
        }}
        className="h-11 w-14 border-x border-zinc-200 bg-white text-center text-base font-semibold text-zinc-900 focus:outline-none disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={inc}
        disabled={disabled || atMax}
        className="flex h-11 w-11 items-center justify-center text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
