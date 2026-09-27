// Cross-screen UI state: storage health, layout width, panel tabs, toasts.
import { create } from 'zustand';
import type { StorageState } from '../db';
import type { PostSizeId, Tone } from '../chart/types';
import type { Platform } from '../chart/safezones';

export interface ToastAction { label: string; run: () => void }
export interface Toast { id: number; message: string; action?: ToastAction }

export interface UiState {
  storage: StorageState;
  narrow: boolean;
  handle?: string;
  rightTab: 'insights' | 'caption' | 'style';
  safeZones: Platform[];
  exportSizes: PostSizeId[];
  tone: Tone;
  toasts: Toast[];
  setRightTab(tab: UiState['rightTab']): void;
  setSafeZones(p: Platform[]): void;
  setExportSizes(s: PostSizeId[]): void;
  setTone(t: Tone): void;
  toast(message: string, action?: ToastAction, ms?: number): number;
  dismiss(id: number): void;
}

let toastSeq = 0;

export const useUi = create<UiState>()((set, get) => ({
  storage: 'unavailable',
  narrow: false,
  handle: undefined,
  rightTab: 'insights',
  safeZones: ['x'],
  exportSizes: ['16:9', '1:1', '9:16'],
  tone: 'punchy',
  toasts: [],
  setRightTab: (rightTab) => set({ rightTab }),
  setSafeZones: (safeZones) => set({ safeZones }),
  setExportSizes: (exportSizes) => set({ exportSizes }),
  setTone: (tone) => set({ tone }),
  toast(message, action, ms = action ? 6000 : 3000) {
    const id = ++toastSeq;
    set({ toasts: [...get().toasts, { id, message, action }] });
    setTimeout(() => get().dismiss(id), ms);
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const NARROW_QUERY = '(max-width: 899px)';
