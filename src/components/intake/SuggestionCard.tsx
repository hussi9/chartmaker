import { Chart } from '../../chart/render/Chart';
import { PLOTS } from '../../chart/plots';
import type { ChartSpec, ChartType } from '../../chart/types';
import { Button } from '../common/Button';

export function SuggestionCard({ spec, type, reason, rank, onUse }: { spec: ChartSpec; type: ChartType; reason: string; rank: number; onUse: () => void }): React.JSX.Element {
  return (
    <li className={`cg-card cg-suggestion ${rank === 0 ? 'cg-suggestion-best' : ''}`}>
      <div className="cg-suggestion-head">
        <div>
          <div className="cg-suggestion-name">{PLOTS[type].name}</div>
          <div className="cg-hint">{rank === 0 ? 'Best match · ' : ''}{reason}</div>
        </div>
        <Button size="sm" variant={rank === 0 ? 'primary' : 'secondary'} onClick={onUse} aria-label={`Use ${PLOTS[type].name}`}>Use</Button>
      </div>
      <div className="cg-suggestion-thumb"><Chart spec={{ ...spec, type }} static /></div>
    </li>
  );
}
