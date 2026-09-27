import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm' | 'lg';
  icon?: ReactNode;
}

export function Button({ variant = 'secondary', size = 'md', icon, className = '', children, type = 'button', ...rest }: ButtonProps): React.JSX.Element {
  return (
    <button type={type} className={`cg-btn cg-btn-${variant} cg-btn-${size} ${className}`} {...rest}>
      {icon && <span className="cg-btn-icon" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
