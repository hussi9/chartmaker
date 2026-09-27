import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { PreviewServer, ViteDevServer } from 'vite'
import { isAppPath, isPublishedRoute, routeMetadata } from './src/lib/routeMetadata.ts'

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
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (/node_modules[\\/](echarts|zrender)[\\/]/.test(id)) return 'echarts'
          if (/node_modules[\\/](react|react-dom|scheduler|@tanstack|zustand|zundo|immer)[\\/]/.test(id)) return 'vendor'
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
      workbox: { globPatterns: ['**/*.{js,css,html,woff2,svg,png}'], globIgnores: ['**/resvg.wasm', '**/fonts/*.ttf'], maximumFileSizeToCacheInBytes: 4_000_000 },
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
      const rootHtml = readFileSync(join('dist', 'index.html'), 'utf8')
      for (const path of Object.keys(routeMetadata).filter(path => path !== '/') as (keyof typeof routeMetadata)[]) {
        const outputPath = join('dist', path.slice(1), 'index.html')
        mkdirSync(dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, routeHtml(rootHtml, path))
      }
    }
  }],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['e2e/**', 'node_modules/**', '.archive/**', 'docs/**'],
  }
})
