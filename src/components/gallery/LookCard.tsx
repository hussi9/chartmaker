import { Chart } from '../../chart/render/Chart';
import { PLOTS } from '../../chart/plots';
import type { Template } from '../../chart/templates';
import { Button } from '../common/Button';

export function LookCard({ t, onUse, featured }: { t: Template; onUse: (t: Template) => void; featured?: boolean }): React.JSX.Element {
  return (
    <article className={`cg-card cg-lookcard ${featured ? 'cg-lookcard-featured' : ''}`} aria-label={t.name}>
      <div className="cg-lookcard-thumb">
        <Chart spec={t.spec} static />
      </div>
      <div className="cg-lookcard-foot">
        <div className="cg-lookcard-text">
          <div className="cg-lookcard-name">{t.name}</div>
          <div className="cg-mono cg-lookcard-meta">{PLOTS[t.type].name.toLowerCase()} · {t.spec.data.length} rows · sample</div>
        </div>
        <Button size="sm" variant={featured ? 'primary' : 'secondary'} onClick={() => onUse(t)} aria-label={`Use this: ${t.name}`}>Use this</Button>
      </div>
    </article>
  );
}
