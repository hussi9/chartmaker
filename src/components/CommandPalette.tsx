// ⌘K: every action in one place. Built on cmdk; loaded lazily by the shell.
import { useMemo } from 'react';
import { Command } from 'cmdk';
import { useNavigate, type LinkProps } from '@tanstack/react-router';
import { useDoc } from '../store/document';
import { useUi } from '../store/ui';
import { CHART_TYPES, LOOKS, POST_SIZES, POST_SIZE_IDS, type LookId, type PostSizeId } from '../chart/types';
import { PLOTS } from '../chart/plots';
import { shareUrls } from '../codec/state';
import { copyPng } from '../export/png';
import './command.css';

const to = (p: string) => p as LinkProps['to'];
const LOOK_LABELS: Record<LookId, string> = { clean: 'Clean', bold: 'Bold', dark: 'Dark', newsletter: 'Newsletter' };

interface Cmd { id: string; label: string; group: string; keywords?: string; run: () => void }

export function CommandPalette(): React.JSX.Element | null {
  const open = useUi((s) => s.palette);
  const setOpen = useUi((s) => s.setPalette);
  const navigate = useNavigate();
  const toast = useUi((s) => s.toast);
  const hasDoc = useDoc((s) => s.id !== null);

  const commands = useMemo<Cmd[]>(() => {
    const go = (path: string, label: string): Cmd => ({ id: `go-${path}`, label: `Go to ${label}`, group: 'Navigate', run: () => void navigate({ to: to(path) } as never) });
    const doc = () => useDoc.getState();
    const list: Cmd[] = [
      { id: 'new', label: 'New chart', group: 'Navigate', keywords: 'paste intake', run: () => void navigate({ to: to('/new') } as never) },
      go('/?templates=1', 'Templates'), go('/charts', 'My charts'), go('/series', 'Series'), go('/brand', 'Brand'),
    ];
    if (hasDoc) {
      list.push(
        { id: 'undo', label: 'Undo', group: 'Edit', run: () => useDoc.temporal.getState().undo() },
        { id: 'redo', label: 'Redo', group: 'Edit', run: () => useDoc.temporal.getState().redo() },
        { id: 'legend', label: 'Toggle legend', group: 'Edit', run: () => doc().setSpec((d) => { d.options.legend = !d.options.legend; }) },
        { id: 'depth', label: 'Toggle depth (3D)', group: 'Edit', run: () => doc().setSpec((d) => { d.options.depth = !d.options.depth; }) },
        { id: 'grid', label: 'Toggle grid lines', group: 'Edit', run: () => doc().setSpec((d) => { d.options.grid = !d.options.grid; }) },
        { id: 'save', label: 'Save chart', group: 'Edit', run: async () => { await doc().save(); const st = doc().saveState; toast(st === 'saved' ? 'Saved' : st === 'unavailable' ? 'Not saved in this browser (storage unavailable).' : 'Save failed.'); } },
        { id: 'dup', label: 'Duplicate chart', group: 'Edit', run: async () => { const id = await doc().duplicate(); void navigate({ to: to('/edit/$id'), params: { id } } as never); } },
        { id: 'tab-insights', label: 'Show insights panel', group: 'Panels', run: () => useUi.getState().setRightTab('insights') },
        { id: 'tab-caption', label: 'Show caption panel', group: 'Panels', run: () => useUi.getState().setRightTab('caption') },
        { id: 'tab-style', label: 'Show style panel', group: 'Panels', run: () => useUi.getState().setRightTab('style') },
        { id: 'share', label: 'Copy share link', group: 'Export', run: async () => { const u = shareUrls(doc().spec, window.location.origin); if (u.error) { toast(u.error); return; } try { await navigator.clipboard.writeText(u.path ?? u.hash); toast('Link copied'); } catch { toast('Could not copy.'); } } },
        { id: 'copypng', label: 'Copy PNG', group: 'Export', run: async () => { try { await copyPng(doc().spec, doc().spec.size); toast('PNG copied'); } catch { toast('Could not copy the PNG.'); } } },
        ...POST_SIZE_IDS.map((s: PostSizeId): Cmd => ({ id: `size-${s}`, label: `Size → ${s} · ${POST_SIZES[s].label}`, group: 'Change size', run: () => doc().setSpec((d) => { d.size = s; }) })),
        ...(Object.keys(LOOKS) as LookId[]).map((l): Cmd => ({ id: `look-${l}`, label: `Look → ${LOOK_LABELS[l]}`, group: 'Change look', run: () => doc().setSpec((d) => { d.look = l; }) })),
        ...CHART_TYPES.map((t): Cmd => ({ id: `type-${t}`, label: `Type → ${PLOTS[t].name}`, group: 'Change type', keywords: PLOTS[t].category, run: () => { const ok = PLOTS[t].accepts(doc().spec.data); if (ok.ok) doc().setSpec((d) => { d.type = t; }); else toast(ok.reason); } })),
      );
    }
    return list;
  }, [hasDoc, navigate, toast]);

  if (!open) return null;
  const groups = [...new Set(commands.map((c) => c.group))];
  return (
    <div className="cg-dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <Command label="Search or command" className="cg-cmd" loop>
        <div role="dialog" aria-modal="true" aria-label="Command palette" className="cg-cmd-inner">
          <Command.Input className="cg-cmd-input" placeholder="Search or command…" autoFocus onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }} />
          <Command.List className="cg-cmd-list">
            <Command.Empty className="cg-hint" style={{ padding: 12 }}>Nothing matches.</Command.Empty>
            {groups.map((g) => (
              <Command.Group key={g} heading={g} className="cg-cmd-group">
                {commands.filter((c) => c.group === g).map((c) => (
                  <Command.Item key={c.id} value={`${c.label} ${c.keywords ?? ''}`} className="cg-cmd-item" onSelect={() => { setOpen(false); void c.run(); }}>
                    {c.label}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
          <div className="cg-cmd-foot cg-mono">⌘K to open · ↑↓ to move · ⏎ to run · Esc to close</div>
        </div>
      </Command>
    </div>
  );
}
