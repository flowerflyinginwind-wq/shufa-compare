import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

function readAppVersion() {
  try {
    const source = fs.readFileSync(path.resolve('src/lib/appVersion.ts'), 'utf8')
    const match = source.match(/APP_VERSION = '([^']+)'/)
    return match?.[1] ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

function normalizeBase(base) {
  if (!base || base === '/') return ''
  return base.endsWith('/') ? base.slice(0, -1) : base
}

function toUrlPath(base, filePath) {
  const prefix = normalizeBase(base)
  const normalized = filePath.replace(/\\/g, '/')
  return prefix ? `${prefix}/${normalized}` : `/${normalized}`
}

function collectFiles(dir, root = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, root))
      continue
    }
    if (entry.name === 'sw.js') continue
    files.push(path.relative(root, fullPath))
  }

  return files
}

const baseArgIndex = process.argv.indexOf('--base')
const base = baseArgIndex >= 0 ? process.argv[baseArgIndex + 1] : '/'
const distDir = path.resolve('dist')
const indexPath = path.join(distDir, 'index.html')

if (!fs.existsSync(indexPath)) {
  console.error('generate-sw: dist/index.html not found. Run vite build first.')
  process.exit(1)
}

const distFiles = collectFiles(distDir)
const precache = [...new Set(distFiles.map((file) => toUrlPath(base, file)))].sort()
const appVersion = readAppVersion()
const cacheKey = crypto.createHash('md5').update(precache.join('|')).digest('hex').slice(0, 10)
const cacheName = `shufa-compare-${appVersion}-${cacheKey}`
const indexUrl = toUrlPath(base, 'index.html')
const scopePrefix = normalizeBase(base) || '/'

const swSource = `const CACHE_NAME = '${cacheName}'
const INDEX_URL = '${indexUrl}'
const PRECACHE = ${JSON.stringify(precache, null, 2)}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document'
}

function isSameScope(url) {
  return url.pathname === '${scopePrefix}' || url.pathname.startsWith('${scopePrefix}/')
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin || !isSameScope(url)) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) return response

          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(async () => {
          if (isNavigationRequest(event.request)) {
            const fallback = await caches.match(INDEX_URL)
            if (fallback) return fallback
          }
          return cached
        })
    }),
  )
})
`

fs.writeFileSync(path.join(distDir, 'sw.js'), swSource, 'utf8')
console.log(`generate-sw: wrote dist/sw.js (${precache.length} files, ${cacheName})`)
