// Platform crop rules as dated constants. Fractions of the post width/height
// that a platform's UI may cover or crop. Update `asOf` when re-verified.
import type { PostSizeId } from './types';

export type Platform = 'x' | 'linkedin' | 'instagram';

export interface Inset { top: number; right: number; bottom: number; left: number }

export interface SafeZone { label: string; asOf: string; source: string; insets: Partial<Record<PostSizeId, Inset>> }

export const SAFE_ZONES: Record<Platform, SafeZone> = {
  x: {
    label: 'X',
    asOf: '2026-09-27',
    // Timeline shows 16:9 and 1:1 uncropped with ~16px rounded corners (1.5% clear);
    // 4:3 is cropped to 16:9 in the timeline card, losing 12.5% top and bottom.
    source: 'https://developer.x.com/en/docs/x-for-websites/cards/overview/summary-card-with-large-image',
    insets: { '16:9': { top: 0.015, right: 0.015, bottom: 0.015, left: 0.015 }, '1:1': { top: 0.015, right: 0.015, bottom: 0.015, left: 0.015 }, '4:3': { top: 0.125, right: 0.015, bottom: 0.125, left: 0.015 } },
  },
  linkedin: {
    label: 'LinkedIn',
    asOf: '2026-09-27',
    // Feed previews show 1:1 and 16:9 uncropped (2% clear for rounded corners);
    // portrait is capped at 4:5, so a 9:16 loses ~15% top and bottom.
    source: 'https://www.linkedin.com/help/linkedin/answer/a521928',
    insets: { '1:1': { top: 0.02, right: 0.02, bottom: 0.02, left: 0.02 }, '16:9': { top: 0.02, right: 0.02, bottom: 0.02, left: 0.02 }, '9:16': { top: 0.15, right: 0.02, bottom: 0.15, left: 0.02 } },
  },
  instagram: {
    label: 'Instagram',
    asOf: '2026-09-27',
    // Stories: top 14% (250px of 1920) and bottom 20% (340px) sit under the UI.
    source: 'https://help.instagram.com/1038071743007909',
    insets: { '9:16': { top: 0.14, right: 0.02, bottom: 0.2, left: 0.02 }, '1:1': { top: 0.02, right: 0.02, bottom: 0.02, left: 0.02 } },
  },
};
