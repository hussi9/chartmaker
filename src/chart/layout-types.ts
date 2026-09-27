import type { FontRole } from './measure';

export interface Box { x: number; y: number; w: number; h: number }

export interface TextBox extends Box {
  id: string;
  text: string;
  size: number;
  role: FontRole;
  weight: number;
  fill: string;
  anchor: 'start' | 'middle' | 'end';
}

export interface Frame {
  w: number;
  h: number;
  pad: number;
  title?: TextBox[];
  subtitle?: TextBox;
  badge?: TextBox & { pill: Box };
  logo?: Box & { href: string };
  source?: TextBox;
  site: TextBox;
  remix?: TextBox;
  plot: Box;
}
