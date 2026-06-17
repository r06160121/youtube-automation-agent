import { Hono } from 'hono'
import { serveStatic } from 'hono/node'
import customRoutes from './custom-routes'
import { createServer } from 'http'

const app = new Hono()

app.use('*', async (c, next) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*')
  c.res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (c.req.method === 'OPTIONS') return c.text('', 204)
  await next()
})

app.get('/health', (c) => c.json({ ok: true }))

try {
  const { createAllRoutes } = await import('./src/generated')
  const { prisma } = await import('./src/lib/db')
  app.route('/api', createAllRoutes(prisma))
} catch {}

app.route('/api', customRoutes)

app.use('/*', serveStatic({ root: './dist' }))
app.get('*', serveStatic({ path: './dist/index.html' }))

const port = Number(process.env.PORT) || 3001

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`)
    const request = new Request(url.toString(), {
      method: req.method,
      headers: Object.fromEntries(Object.entries(req.headers).filter(([_, v]) => v !== undefined) as [string, string][]),
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
    })
    const response = await app.fetch(request)
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()))
    if (response.body) {
      const reader = response.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(value)
      }
    }
    res.end()
  } catch (error) {
    console.error('Server error:', error)
    res.writeHead(500)
    res.end('Internal Server Error')
  }
})

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})