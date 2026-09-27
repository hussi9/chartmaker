import type { ReactNode } from 'react';
import { LOOKS, type ChartType, type LookId, type Row } from '../../chart/types';
import { Chip } from '../common/Chip';
import { TypePicker } from './TypePicker';

const LOOK_LABELS: Record<LookId, string> = { clean: 'Clean', bold: 'Bold', dark: 'Dark', newsletter: 'Newsletter' };

export interface LookStripProps {
  type: ChartType;
  rows: Row[];
  look: LookId;
  onType: (t: ChartType) => void;
  onLook: (l: LookId) => void;
  hasBrand: boolean;
  onApplyBrand?: () => void;
  trailing?: ReactNode;
}

export function LookStrip({ type, rows, look, onType, onLook, hasBrand, onApplyBrand, trailing }: LookStripProps): React.JSX.Element {
  return (
    <div className="cg-lookstrip">
      <span className="cg-lbl">Look</span>
      <TypePicker type={type} rows={rows} onChange={onType} />
      <div className="cg-chips" role="group" aria-label="Look">
        {(Object.keys(LOOKS) as LookId[]).map((l) => <Chip key={l} on={l === look} onClick={() => onLook(l)}>{LOOK_LABELS[l]}</Chip>)}
        {hasBrand && <Chip tint onClick={onApplyBrand}>Apply my brand</Chip>}
      </div>
      <div className="cg-lookstrip-trailing">{trailing}</div>
    </div>
  );
}
