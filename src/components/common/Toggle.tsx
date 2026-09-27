export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  id?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, id, disabled }: ToggleProps): React.JSX.Element {
  return (
    <label className="cg-toggle-row" htmlFor={id}>
      <span className="cg-toggle-label">{label}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className="cg-toggle"
        data-on={checked ? 'true' : undefined}
        onClick={() => onChange(!checked)}
      >
        <span className="cg-toggle-knob" aria-hidden="true" />
      </button>
    </label>
  );
}
