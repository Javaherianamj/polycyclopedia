interface SourcedValueProps {
  value: any;
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
export const SourcedValue: React.FC<SourcedValueProps> = ({ value: v, variant = 'inline' }) => {
  if (v?.value === undefined) return v;
  const text = `${v.value} ${v.unit}`.trim();

  if (variant === 'block') {
    return v.note ? (
      <div className="flex flex-col w-full text-right" dir="rtl">
        <div dir="ltr" className="en-mono font-mono tabular-nums text-left sm:text-right font-black">
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
};
