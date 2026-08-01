import type { ReactNode } from 'react';
import type { SourcedValue as SourcedValueData } from '../types/polymer';

interface SourcedValueProps {
  /**
   * Normally a `SourcedValue` from the dataset. Callers also pass plain
   * strings/numbers and `undefined` for fields that were never wrapped, so
   * those pass through untouched rather than being coerced.
   */
  value: SourcedValueData | string | number | null | undefined;
  variant?: 'inline' | 'block';
}

/**
 * Renders a `{ value, unit, note }` field, formatting the number/unit and
 * (if present) an RTL note line underneath. `variant="block"` is used where
 * the caller previously rendered its own div-based layout (App.tsx's table
 * cells); `"inline"` (default) matches the span-based layout used everywhere
 * else. This is the single place Phase 1's citation marker/popover will plug
 * into once `value.sourceId` resolves to a real source.
 */
export function SourcedValue({ value: v, variant = 'inline' }: SourcedValueProps): ReactNode {
  // Not a SourcedValue-shaped object (plain string, number, null, undefined):
  // render it as-is, matching the behaviour of the formatVal helpers this
  // component replaced.
  if (v === null || typeof v !== 'object' || v.value === undefined) {
    return v ?? null;
  }
  const text = `${v.value} ${v.unit}`.trim();

  if (variant === 'block') {
    return v.note ? (
      <div className="flex flex-col w-full text-right" dir="rtl">
        <div
          dir="ltr"
          className="en-mono font-mono tabular-nums text-left sm:text-right font-black"
        >
          {text}
        </div>
        <div
          dir="rtl"
          className="!font-sans font-medium text-xs mt-1 text-text-secondary whitespace-normal text-right leading-relaxed block"
        >
          {v.note}
        </div>
      </div>
    ) : (
      <div dir="ltr" className="en-mono font-mono tabular-nums inline-block font-black">
        {text}
      </div>
    );
  }

  return v.note ? (
    <span className="flex flex-col">
      <span dir="ltr">{text}</span>
      <span
        className="!font-sans font-medium text-[11px] sm:text-xs mt-0.5 text-text-secondary whitespace-normal text-right leading-tight"
        dir="rtl"
      >
        {v.note}
      </span>
    </span>
  ) : (
    <span dir="ltr">{text}</span>
  );
}
