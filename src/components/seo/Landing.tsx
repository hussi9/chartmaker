// The three search landings: real copy, a live example of that look, one way in.
import { useEffect } from 'react';
import { Link, useNavigate, type LinkProps } from '@tanstack/react-router';
import { useTopBar } from '../shell/TopBar';
import { useDoc } from '../../store/document';
import { Chart } from '../../chart/render/Chart';
import { PLOTS } from '../../chart/plots';
import { CHART_TYPES, defaultSpec, type ChartType } from '../../chart/types';
import { routeMetadata, type PublishedRoute } from '../../lib/routeMetadata';
import { Button } from '../common/Button';

const to = (p: string) => p as LinkProps['to'];

export interface LandingProps { route: PublishedRoute; type: ChartType; steps: string[]; intakeFirst?: boolean }

export function Landing({ route, type, steps, intakeFirst }: LandingProps): React.JSX.Element {
  const navigate = useNavigate();
  const meta = routeMetadata[route];
  const def = PLOTS[type];
  const example = defaultSpec({ type, data: def.sample.map((r) => ({ ...r })), text: { title: def.name, subtitle: def.blurb, source: 'sample data' } });

  useEffect(() => {
    useTopBar.getState().set({ crumb: meta.heading });
    return () => useTopBar.getState().set({ crumb: undefined });
  }, [meta.heading]);

  const start = () => {
    if (intakeFirst) { void navigate({ to: to('/new') } as never); return; }
    const id = useDoc.getState().newDoc({ type, data: def.sample.map((r) => ({ ...r })), text: { title: def.name, source: 'sample data' } });
    void navigate({ to: to('/edit/$id'), params: { id } } as never);
  };

  return (
    <div className="cg-page cg-landing">
      <span className="cg-lbl">ChartGenie · free, no account, saved in this browser</span>
      <h1 className="cg-h1" style={{ fontSize: 40, maxWidth: '20ch' }}>{meta.heading}</h1>
      <p className="cg-landing-lead">{meta.description}</p>
      <div className="cg-landing-grid">
        <div className="cg-card cg-landing-example" aria-label={`Example ${def.name.toLowerCase()}`}>
          <Chart spec={example} static />
          <div className="cg-lookcard-foot"><span className="cg-mono cg-hint">{def.name.toLowerCase()} · sample data</span><Button variant="primary" size="sm" onClick={start}>{intakeFirst ? 'Paste your rows' : 'Start with this chart'}</Button></div>
        </div>
        <ol className="cg-landing-steps">
          {steps.map((s, i) => <li key={i}><span className="cg-landing-step-n">{i + 1}</span><span>{s}</span></li>)}
        </ol>
      </div>
      <p className="cg-hint" style={{ fontSize: 13 }}>
        {CHART_TYPES.length} chart looks, four post sizes (X, LinkedIn, Story, Deck), PNG and SVG export, and a share link that unfurls as a card. Everything runs in your browser; charts you save stay in this browser.
      </p>
      <Link to={to('/?templates=1')} className="cg-linkbtn">See every look →</Link>
    </div>
  );
}
