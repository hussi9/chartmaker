// The open chart. One spec, undoable edits, debounced autosave into Dexie.
import { create } from 'zustand';
import { temporal } from 'zundo';
import { immer } from 'zustand/middleware/immer';
import { produce } from 'immer';
import { db } from '../db';
import { defaultSpec, type ChartSpec, type Row } from '../chart/types';
import { svgString } from '../chart/render/svgString';
import { useUi } from './ui';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'unavailable';

export interface DocState {
  id: string | null;
  spec: ChartSpec;
  dirty: boolean;
  saveState: SaveState;
  reset(): void;
  newDoc(partial?: Partial<ChartSpec>): string;
  openSpec(spec: ChartSpec, id?: string): string;
  load(id: string): Promise<boolean>;
  setSpec(recipe: (draft: ChartSpec) => void): void;
  setRows(rows: Row[]): void;
  save(): Promise<void>;
  duplicate(): Promise<string>;
}

export const AUTOSAVE_MS = 400;
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

export function newId(): string {
  return `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function thumbnailBlob(spec: ChartSpec): Blob {
  return new Blob([svgString(spec)], { type: 'image/svg+xml' });
}

export const useDoc = create<DocState>()(
  temporal(
    immer((set, get) => ({
      id: null,
      spec: defaultSpec(),
      dirty: false,
      saveState: 'idle',

      reset() {
        if (autosaveTimer) clearTimeout(autosaveTimer);
        autosaveTimer = null;
        set({ id: null, spec: defaultSpec(), dirty: false, saveState: 'idle' });
      },

      newDoc(partial = {}) {
        const id = newId();
        set({ id, spec: defaultSpec(partial), dirty: true, saveState: 'idle' });
        useDoc.temporal.getState().clear();
        scheduleSave();
        return id;
      },

      openSpec(spec, id = newId()) {
        set({ id, spec, dirty: true, saveState: 'idle' });
        useDoc.temporal.getState().clear();
        scheduleSave();
        return id;
      },

      async load(id) {
        if (useUi.getState().storage !== 'ok') return false;
        const doc = await db.charts.get(id);
        if (!doc) return false;
        set({ id: doc.id, spec: doc.spec, dirty: false, saveState: 'saved' });
        useDoc.temporal.getState().clear();
        return true;
      },

      setSpec(recipe) {
        set((s) => {
          recipe(s.spec);
          s.dirty = true;
          s.saveState = 'saving';
        });
        scheduleSave();
      },

      setRows(rows) {
        get().setSpec((d) => { d.data = rows; });
      },

      async save() {
        if (autosaveTimer) clearTimeout(autosaveTimer);
        autosaveTimer = null;
        const { id, spec } = get();
        if (!id) return;
        if (useUi.getState().storage !== 'ok') {
          set({ saveState: 'unavailable' });
          return;
        }
        try {
          const existing = await db.charts.get(id);
          const now = Date.now();
          await db.charts.put({ id, spec, thumb: thumbnailBlob(spec), createdAt: existing?.createdAt ?? now, updatedAt: now, sharedAt: existing?.sharedAt, sharedUrl: existing?.sharedUrl });
          set({ dirty: false, saveState: 'saved' });
        } catch {
          set({ saveState: 'error' });
        }
      },

      async duplicate() {
        const { spec } = get();
        const copy = produce(spec, (d) => { d.text.title = `${d.text.title} copy`; });
        const id = newId();
        set({ id, spec: copy, dirty: true, saveState: 'idle' });
        useDoc.temporal.getState().clear();
        await get().save();
        return id;
      },
    })),
    { partialize: (s) => ({ spec: s.spec }), limit: 100 },
  ),
);

function scheduleSave(): void {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => { autosaveTimer = null; void useDoc.getState().save(); }, AUTOSAVE_MS);
}
