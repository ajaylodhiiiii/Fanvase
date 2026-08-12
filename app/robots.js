export default function robots() {
  const base = 'https://fanvase.online'
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/auth/'] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
