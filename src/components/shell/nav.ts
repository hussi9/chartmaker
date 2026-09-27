import type { ReactNode } from 'react';
import { Plus, LayoutGrid, Library, Clock, Palette } from 'lucide-react';
import { createElement } from 'react';

export interface NavItem { to: string; label: string; icon: () => ReactNode }

export const NAV: NavItem[] = [
  { to: '/new', label: 'New', icon: () => createElement(Plus, { size: 18, strokeWidth: 2 }) },
  { to: '/?templates=1', label: 'Templates', icon: () => createElement(LayoutGrid, { size: 18, strokeWidth: 2 }) },
  { to: '/charts', label: 'My charts', icon: () => createElement(Library, { size: 18, strokeWidth: 2 }) },
  { to: '/series', label: 'Series', icon: () => createElement(Clock, { size: 18, strokeWidth: 2 }) },
  { to: '/brand', label: 'Brand', icon: () => createElement(Palette, { size: 18, strokeWidth: 2 }) },
];
