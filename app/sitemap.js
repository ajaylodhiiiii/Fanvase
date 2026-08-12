export default function sitemap() {
  const base = 'https://fanvase.online'
  const now = new Date()
  const routes = [
    { path: '', priority: 1.0, freq: 'daily' },
    { path: '/about', priority: 0.7, freq: 'monthly' },
    { path: '/privacy', priority: 0.4, freq: 'yearly' },
    { path: '/terms', priority: 0.4, freq: 'yearly' },
    { path: '/refund', priority: 0.4, freq: 'yearly' },
    { path: '/contact', priority: 0.6, freq: 'monthly' },
  ]
  return routes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }))
}
