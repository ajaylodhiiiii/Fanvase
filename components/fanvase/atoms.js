'use client'

import { cn, initials } from '@/lib/fanvase'
import { Loader2 } from 'lucide-react'

export function Logo({ size = 'md', onClick }) {
  const s = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl'
  const box = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  return (
    <button onClick={onClick} className={cn('flex items-center gap-2 font-extrabold tracking-tight', s)}>
      <img src="/fanvase-logo.jpeg" alt="Fanvase logo" className={cn('rounded-lg object-cover', box)} />
      <span>Fan<span className="text-primary">vase</span></span>
    </button>
  )
}

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-primary', className)} />
}

export function FullLoader({ label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
      <Spinner className="h-7 w-7" />
      <p className="text-sm">{label}…</p>
    </div>
  )
}

export function Avatar({ src, name, size = 40, className }) {
  return (
    <div className={cn('relative shrink-0 rounded-full overflow-hidden bg-secondary grid place-items-center border border-border', className)} style={{ width: size, height: size }}>
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : <span className="text-xs font-semibold text-muted-foreground">{initials(name)}</span>}
    </div>
  )
}

export function StatusBadge({ status }) {
  const map = {
    active: 'bg-primary/15 text-primary border-primary/30',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    inactive: 'bg-muted text-muted-foreground border-border',
    expired: 'bg-destructive/15 text-red-400 border-destructive/30',
    cancelled: 'bg-destructive/15 text-red-400 border-destructive/30',
    completed: 'bg-primary/15 text-primary border-primary/30',
    converted: 'bg-primary/15 text-primary border-primary/30',
    paid: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    suspended: 'bg-destructive/15 text-red-400 border-destructive/30',
  }
  return <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', map[status] || map.inactive)}>{status || 'n/a'}</span>
}

export function KPICard({ label, value, delta, icon: Icon, accent = 'primary' }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && <div className={cn('grid h-9 w-9 place-items-center rounded-xl', accent === 'purple' ? 'bg-purple-500/15 text-purple-300' : 'bg-primary/15 text-primary')}><Icon className="h-4 w-4" /></div>}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      {delta != null && <p className={cn('mt-1 text-xs font-medium', delta >= 0 ? 'text-primary' : 'text-red-400')}>{delta >= 0 ? '+' : ''}{delta}% vs last period</p>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 px-6 text-center">
      {Icon && <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary"><Icon className="h-7 w-7" /></div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {desc && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Section({ title, desc, right, children }) {
  return (
    <div>
      {(title || right) && (
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            {title && <h2 className="text-xl font-bold tracking-tight">{title}</h2>}
            {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}
