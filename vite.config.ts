import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { execFileSync } from 'node:child_process'
import type { PreviewServer, ViteDevServer } from 'vite'
import { isAppPath, isPublishedRoute, routeMetadata, type PublishedRoute } from './src/lib/routeMetadata.ts'
import { structuredDataScript, buildSitemapXml } from './src/lib/seo.ts'

function routeHtml(html: string, path: keyof typeof routeMetadata) {
  const meta = routeMetadata[path]
  const canonical = `https://chartgenie.xyz${path}`
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${meta.description}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${meta.title}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${meta.description}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${meta.title}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${meta.description}" />`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n${structuredDataScript(path)}\n    <\/script>`)
}

// One line of real git history per published route's own source file, so the
// sitemap's <lastmod> reflects an actual change instead of a hand-edited date
// that goes stale the moment content changes. Falls back to the build date if
// git is unavailable (e.g. a shallow/gitless build sandbox) rather than failing.
const ROUTE_SOURCE_FILE: Record<PublishedRoute, string> = {
  '/': 'src/routes/index.tsx',
  '/pie-chart-maker': 'src/routes/pie-chart-maker.tsx',
  '/bar-graph-maker': 'src/routes/bar-graph-maker.tsx',
  '/convert-excel-to-chart': 'src/routes/convert-excel-to-chart.tsx',
}

function lastModFor(path: PublishedRoute): string | undefined {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cd', '--date=short', '--', ROUTE_SOURCE_FILE[path]], { encoding: 'utf8' }).trim()
    return out || undefined
  } catch {
    return undefined
  }
}


// Paths outside the app's routes get a real 404 (dev and preview); Vercel does the same via its rewrites.
function rejectUnknownPages(req: { url?: string; headers: { accept?: string } }, res: { statusCode: number; setHeader(name: string, value: string): void; end(body: string): void }, next: () => void) {
  const path = new URL(req.url || '/', 'http://localhost').pathname
  if (!path.startsWith('/@') && !path.startsWith('/__vite') && !path.includes('.') && !isAppPath(path)) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end('<!doctype html><html><head><title>Page not found — ChartGenie</title><meta name="robots" content="noindex"></head><body><h1>Page not found</h1><a href="/">Go to ChartGenie</a></body></html>')
    return
  }
  next()
}

// https://vite.dev/config/
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    // Vite's static import-graph analysis treats the OCR chunk as "likely
    // needed" and injects a <link rel="modulepreload"> for it on every page.
    // The chunk is precached (see injectManifest below) so this hint isn't
    // needed for correctness, but suppressing it still saves a same-origin
    // fetch on a visitor's very first request, before the service worker
    // has installed.
    modulePreload: { resolveDependencies: (_url, deps) => deps.filter((d) => !d.includes('/ocr-')) },
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (/node_modules[\\/](echarts|zrender)[\\/]/.test(id)) return 'echarts'
          if (/node_modules[\\/](react|react-dom|scheduler|@tanstack|zustand|zundo|immer)[\\/]/.test(id)) return 'vendor'
          // Groups the on-device OCR libraries into their own chunk, reached
          // only via a user-triggered dynamic import() inside src/ocr/engine.ts.
          // Vite's shared dynamic-import runtime helper (an internal virtual
          // module, id "\0vite/preload-helper.js") ends up co-located in
          // whichever chunk Rollup judges "most central" among every chunk
          // that performs a dynamic import — confirmed (via an unminified
          // debug build) to be this one, which is why the main chunk
          // statically imports from it on every route regardless of manual
          // reassignment attempts here. That makes this chunk unconditionally
          // fetched on every page load, so it must be precached (below)
          // rather than excluded, or offline navigation breaks everywhere.
          if (/node_modules[\\/](ppu-paddle-ocr|onnxruntime-web|tesseract\.js|tesseract\.js-core)[\\/]/.test(id)) return 'ocr'
          return undefined
        },
      },
    },
  },
  worker: { format: 'es' },
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true, routesDirectory: './src/routes', generatedRouteTree: './src/routeTree.gen.ts' }),
    react({ compiler: true }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // The ocr-*.js chunk (~450 KB: the OCR libraries' JS glue only) is
      // precached like any other build asset — seemingly at odds with
      // keeping the OCR runtime out of the precache, until you note that the
      // actual heavy weight (PaddleOCR's ONNX model, tesseract.js's wasm and
      // trained-data files) is fetched at OCR-use time from external hosts
      // (e.g. huggingface.co), never from this same-origin build output, so
      // excluding this chunk was never actually saving the precache from a
      // multi-MB cost. It WAS, unfixably (see manualChunks above), being
      // fetched on every single page load anyway; not precaching it only
      // meant that fetch broke the whole app offline (confirmed live).
      injectManifest: { globPatterns: ['**/*.{js,css,html,woff2,svg,png}'], globIgnores: ['**/resvg.wasm', '**/fonts/*.ttf'], maximumFileSizeToCacheInBytes: 4_000_000 },
    }),
    {
    name: 'published-pages',
    transformIndexHtml: {
      order: 'post' as const,
      handler(html: string, context: { path: string }) {
        const path = new URL(context.path, 'http://localhost').pathname
        return isPublishedRoute(path) ? routeHtml(html, path) : html
      }
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const path = new URL(req.url || '/', 'http://localhost').pathname
        if (isPublishedRoute(path) && path !== '/') {
          try {
            const html = await server.transformIndexHtml(path, readFileSync('index.html', 'utf8'))
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(html)
          } catch (error) { next(error) }
          return
        }
        rejectUnknownPages(req, res, next)
      })
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(rejectUnknownPages)
    },
    closeBundle() {
      // NOTE: despite the `published-pages` transformIndexHtml hook above,
      // Vite's production build does not actually invoke it with ctx.path
      // === '/' for the main entry (only `vite dev`/`vite preview` do, via
      // configureServer/configurePreviewServer). Historically this was
      // invisible because the hand-written index.html source already
      // happened to match routeMetadata['/'] — but it means dist/index.html
      // must be regenerated here too, explicitly, or it silently ships
      // whatever is in source index.html untouched (stale JSON-LD included).
      const rootHtml = readFileSync(join('dist', 'index.html'), 'utf8')
      for (const path of Object.keys(routeMetadata) as PublishedRoute[]) {
        const html = routeHtml(rootHtml, path)
        if (path === '/') {
          writeFileSync(join('dist', 'index.html'), html)
        } else {
          const outputPath = join('dist', path.slice(1), 'index.html')
          mkdirSync(dirname(outputPath), { recursive: true })
          writeFileSync(outputPath, html)
        }
      }
      const lastModByPath = Object.fromEntries(
        (Object.keys(routeMetadata) as PublishedRoute[]).map((path) => [path, lastModFor(path)])
      ) as Partial<Record<PublishedRoute, string>>
      writeFileSync(join('dist', 'sitemap.xml'), buildSitemapXml(lastModByPath))
    }
  }],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['e2e/**', 'node_modules/**', '.archive/**', 'docs/**'],
  }
})
