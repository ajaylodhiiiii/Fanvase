'use client'

import { createClient } from '@/lib/supabase/browser'
import { cn } from '@/lib/utils'

export const supabase = createClient()

async function req(method, path, body) {
  const opts = { method, headers: {}, credentials: 'include' }
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(`/api${path}`, opts)
  let data = null
  try { data = await res.json() } catch (e) {}
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)
  return data
}
export const API = {
  get: (p) => req('GET', p),
  post: (p, b) => req('POST', p, b || {}),
  put: (p, b) => req('PUT', p, b || {}),
  del: (p) => req('DELETE', p),
  upload: async (file, bucket = 'media') => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('bucket', bucket)
    const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Upload failed')
    return data
  },
}

export const CATEGORIES = ['AI', 'Business', 'Coding', 'Education', 'Fitness', 'Finance', 'Gaming', 'Design', 'Marketing', 'Personal Development', 'Other']
export const COUNTRIES = ['United States', 'India', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Brazil', 'Nigeria', 'Other']

export const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1581368087049-7034ed0d1e6f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200',
  studio: 'https://images.unsplash.com/photo-1581368163672-d717bcb4c6af?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200',
  edit: 'https://images.unsplash.com/photo-1528109966604-5a6a4a964e8d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200',
  p1: 'https://images.unsplash.com/photo-1607503873903-c5e95f80d7b9?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',
  p2: 'https://images.unsplash.com/photo-1587987746776-302404b98970?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',
  p3: 'https://images.unsplash.com/photo-1536766820879-059fec98ec0a?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',
}

export function money(n, currency = 'USD') {
  const v = Number(n || 0)
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: v % 1 === 0 ? 0 : 2 }).format(v)
  } catch (e) { return `$${v}` }
}
export function timeAgo(d) {
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24); if (days < 30) return `${days}d ago`
  return new Date(d).toLocaleDateString()
}
export function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
export { cn }
