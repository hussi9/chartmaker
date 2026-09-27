import { POST_SIZES, POST_SIZE_IDS, type PostSizeId } from '../../chart/types';
import { SAFE_ZONES, type Platform } from '../../chart/safezones';
import { Chip } from '../common/Chip';

export interface SizeBarProps {
  size: PostSizeId;
  onSize: (s: PostSizeId) => void;
  safeZones: Platform[];
  onSafeZones: (p: Platform[]) => void;
  scale: number;
}

export function SizeBar({ size, onSize, safeZones, onSafeZones, scale }: SizeBarProps): React.JSX.Element {
  const s = POST_SIZES[size];
  const toggle = (p: Platform) => onSafeZones(safeZones.includes(p) ? safeZones.filter((x) => x !== p) : [...safeZones, p]);
  return (
    <div className="cg-sizebar">
      <span className="cg-lbl">Post size</span>
      <div className="cg-chips" role="group" aria-label="Post size">
        {POST_SIZE_IDS.map((id) => (
          <Chip key={id} on={id === size} onClick={() => onSize(id)} title={`${POST_SIZES[id].w} × ${POST_SIZES[id].h}`}>
            {id} · {POST_SIZES[id].label}
          </Chip>
        ))}
      </div>
      <span className="cg-sizebar-sep" aria-hidden="true" />
      <span className="cg-lbl">Safe zones</span>
      <div className="cg-chips" role="group" aria-label="Safe zones">
        {(Object.keys(SAFE_ZONES) as Platform[]).map((p) => (
          <Chip key={p} on={safeZones.includes(p)} onClick={() => toggle(p)} aria-label={`Safe zones: ${SAFE_ZONES[p].label}`} title={`Show where ${SAFE_ZONES[p].label} may crop or cover (as of ${SAFE_ZONES[p].asOf})`}>
            {SAFE_ZONES[p].label}
          </Chip>
        ))}
      </div>
      <span className="cg-mono cg-sizebar-readout">{s.w} × {s.h} · {Math.round(scale * 100)}%</span>
    </div>
  );
}
