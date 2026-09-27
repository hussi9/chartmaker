// Bundle the Vercel functions into self-contained ESM files.
// Vercel compiles api/*.ts as Node ESM (package.json "type": "module"), where
// extension-less relative imports into src/ cannot resolve at runtime. So the
// handlers live in server/ and are bundled here; api/og.ts and api/share.ts are
// thin entries that import the bundles by explicit path.
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';

mkdirSync('api/_lib', { recursive: true });
for (const name of ['og', 'share']) {
  await build({
    entryPoints: [`server/${name}.ts`],
    outfile: `api/_lib/${name}.mjs`,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    external: ['@resvg/resvg-js'],
    loader: { '.json': 'json' },
    sourcemap: false,
    logLevel: 'warning',
  });
  console.log(`api/_lib/${name}.mjs`);
}
