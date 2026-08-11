import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

function readEnvFile(envPath) {
  try {
    const txt = fs.readFileSync(envPath, 'utf8')
    const lines = txt.split(/\r?\n/)
    const out = {}
    for (const line of lines) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/)
      if (m) out[m[1]] = m[2]
    }
    return out
  } catch (e) {
    return {}
  }
}

async function main() {
  const projectRoot = path.resolve(new URL(import.meta.url).pathname, '..', '..')
  const publicDir = path.join(projectRoot, 'public')
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })

  // Determine site URL from env or .env
  const env = { ...process.env }
  const dotEnv = readEnvFile(path.join(projectRoot, '.env'))
  Object.assign(env, dotEnv)

  // Default production site URL for this project. Will be used if SITE_URL not provided.
  const DEFAULT_SITE_URL = 'https://aarunya-sparsha-foundation.netlify.app'
  const siteUrl = (env.SITE_URL || env.VITE_SITE_URL || env.VITE_PUBLIC_URL || env.SITE_DOMAIN || DEFAULT_SITE_URL).replace(/\/$/, '')

  const supabaseUrl = env.VITE_SUPABASE_URL
  const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY

  const urls = []
  // Homepage (absolute)
  urls.push(`${siteUrl}/`)

  // Try to fetch public events if Supabase creds exist
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: events, error } = await supabase.from('events').select('id').order('event_date', { ascending: false })
      if (!error && Array.isArray(events)) {
        for (const ev of events) {
          if (ev?.id) urls.push(`${siteUrl}/events/${ev.id}`)
        }
      }
    } catch (e) {
      // ignore fetch errors — we'll still write a sitemap with what we have
      // eslint-disable-next-line no-console
      console.error('Could not fetch events for sitemap generation:', e?.message || e)
    }
  }

  // Build sitemap XML
  const now = new Date().toISOString()
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  const footer = '</urlset>\n'
  const body = urls
    .map((u) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`)
    .join('\n')

  const content = header + body + '\n' + footer
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), content, 'utf8')

  console.log('Wrote public/sitemap.xml')
  if (!siteUrl) {
    console.log('Note: SITE_URL was not provided; sitemap contains relative URLs. To generate absolute URLs, set SITE_URL (e.g. https://example.com) in environment and re-run this script.')
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Sitemap generation failed:', e)
  process.exit(1)
})
