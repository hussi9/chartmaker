import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  on?: boolean;
  tint?: boolean;
  icon?: ReactNode;
}

// A pill that is either a filter/option (aria-pressed) or a plain action.
export function Chip({ on, tint, icon, className = '', children, type = 'button', ...rest }: ChipProps): React.JSX.Element {
  return (
    <button type={type} className={`cg-chip ${tint ? 'cg-chip-tint' : ''} ${className}`} data-on={on ? 'true' : undefined} aria-pressed={on === undefined ? undefined : on} {...rest}>
      {icon && <span className="cg-chip-icon" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
