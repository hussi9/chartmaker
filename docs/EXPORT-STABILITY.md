# Immediate export stability

The shared chart canvas now renders its final geometry immediately. Previously, all but one Recharts series used animation defaults and seven canvas transitions interpolated theme/size changes. Capturing that DOM immediately could export an incomplete shape or an intermediate appearance.

All 16 series instances now disable geometry animation. Canvas transitions were removed or disabled. PNG/SVG downloads, clipboard output, native sharing and direct copy use the same stable canvas. This trades decorative interpolation for immediate, predictable editing and exports.

Verification: 89 tests passed; lint passed with four existing warnings; TypeScript/production build and diff check passed. Coverage includes 17 chart types, six themes, four aspect ratios and immediate edited export snapshots. Chart primitive mocks test the rendering contract; physical devices and broader real-file inspection remain separate evidence requirements.
