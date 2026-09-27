# Portfolio decision — 26 September 2026

See [approved portfolio strategy](../PORTFOLIO-STRATEGY.md).

Target when cloud features are added: one shared PostgreSQL database with `chart_auth` and `chart` schemas, restricted per-product access and independent migrations. Keep current Vite frontend, hosting and `chartgenie.xyz` initially; provide a trusted API for auth/storage.

Preserve anonymous local editing/export and local CSV processing. Cloud save and publication are separate explicit actions. Migrate local charts only with opt-in, a local backup and deduplication. Add stable revocable published snapshots/embeds; do not equate current encoded URLs with encrypted or revocable hosting. Review save-failure messaging and chart-title analytics before cloud rollout.

No application changes or deployment are part of this note. Work on this product individually when selected.
