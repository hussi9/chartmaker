import { createFileRoute, Link, type LinkProps } from '@tanstack/react-router';

const to = (p: string) => p as LinkProps['to'];

export const Route = createFileRoute('/$')({
  component: NotFound,
  head: () => ({ meta: [{ title: 'Page not found — ChartGenie' }, { name: 'robots', content: 'noindex' }] }),
});

function NotFound(): React.JSX.Element {
  return (
    <section className="cg-page cg-notfound">
      <span className="cg-lbl">404</span>
      <h1 className="cg-h1" style={{ fontSize: 40, marginTop: 8 }}>Nothing here.</h1>
      <p style={{ color: 'var(--ink-2)', maxWidth: '48ch' }}>That address does not point at a chart or a page. Start from a look, or paste your numbers.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link to={to('/')} className="cg-btn cg-btn-primary">Pick a look</Link>
        <Link to={to('/new')} className="cg-btn">Paste numbers</Link>
      </div>
    </section>
  );
}
