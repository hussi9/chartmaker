export interface SegOption<T extends string> { value: T; label: string; title?: string }

export interface SegProps<T extends string> {
  value: T;
  options: SegOption<T>[];
  onChange: (v: T) => void;
  label: string;
  size?: 'sm' | 'md';
}

// A segmented control on real buttons (radiogroup semantics).
export function Seg<T extends string>({ value, options, onChange, label, size = 'md' }: SegProps<T>): React.JSX.Element {
  return (
    <div className={`cg-seg cg-seg-${size}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} title={o.title} className="cg-seg-opt" data-on={o.value === value ? 'true' : undefined} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
