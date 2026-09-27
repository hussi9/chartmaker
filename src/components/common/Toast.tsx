import { useUi } from '../../store/ui';

export function Toasts(): React.JSX.Element | null {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismiss);
  if (toasts.length === 0) return null;
  return (
    <div className="cg-toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} role="status" className="cg-toast">
          <span>{t.message}</span>
          {t.action && (
            <button type="button" className="cg-toast-action" onClick={() => { t.action?.run(); dismiss(t.id); }}>
              {t.action.label}
            </button>
          )}
          <button type="button" className="cg-toast-close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
