'use client'

import { cn, initials } from '@/lib/fanvase'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/* Shared class for native <select> so it matches Input. */
export const selectClass =
  'h-10 w-full rounded-xl border border-input bg-background/50 px-3 text-base transition-colors focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring/30 md:text-sm'

export function Logo({ size = 'md', onClick }) {
  const s = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl'
  const box = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  return (
    <button type="button" onClick={onClick} aria-label="Fanvase home" className={cn('flex items-center gap-2 rounded-lg font-extrabold tracking-tight', s)}>
      <img src="/fanvase-logo.jpeg" alt="" width={36} height={36} className={cn('rounded-lg object-cover', box)} />
      <span>Fan<span className="text-primary">vase</span></span>
    </button>
  )
}

export function Spinner({ className }) {
  return <Loader2 aria-hidden="true" className={cn('h-5 w-5 animate-spin text-primary', className)} />
}

export function FullLoader({ label = 'Loading' }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
      <Spinner className="h-6 w-6" />
      <p className="text-sm">{label}…</p>
    </div>
  )
}

/* Skeleton block for loading states that should keep layout stable. */
export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('fv-skeleton', className)} />
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-6">
      <div className="space-y-2"><Skeleton className="h-7 w-56" /><Skeleton className="h-4 w-72 max-w-full" /></div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-[92px] rounded-2xl" />)}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  )
}

export function Avatar({ src, name, size = 40, className }) {
  return (
    <div className={cn('relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary', className)} style={{ width: size, height: size }}>
      {src
        ? <img src={src} alt={name || ''} width={size} height={size} loading="lazy" className="h-full w-full object-cover" />
        : <span className="font-semibold text-muted-foreground" style={{ fontSize: Math.max(10, Math.round(size * 0.34)) }}>{initials(name)}</span>}
    </div>
  )
}

const BADGE = {
  active: 'bg-primary/10 text-primary border-primary/25',
  completed: 'bg-primary/10 text-primary border-primary/25',
  converted: 'bg-primary/10 text-primary border-primary/25',
  published: 'bg-primary/10 text-primary border-primary/25',
  pending: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  processing: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
  draft: 'bg-secondary text-muted-foreground border-border',
  scheduled: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
  inactive: 'bg-secondary text-muted-foreground border-border',
  expired: 'bg-red-500/10 text-red-300 border-red-500/25',
  cancelled: 'bg-red-500/10 text-red-300 border-red-500/25',
  failed: 'bg-red-500/10 text-red-300 border-red-500/25',
  suspended: 'bg-red-500/10 text-red-300 border-red-500/25',
  paid: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
}

export function StatusBadge({ status }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize', BADGE[status] || BADGE.inactive)}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status || 'n/a'}
    </span>
  )
}

export function KPICard({ label, value, delta, icon: Icon, accent = 'primary' }) {
  return (
    <div className="fv-card min-w-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-xs font-medium leading-snug text-muted-foreground sm:text-[13px]">{label}</p>
        {Icon && (
          <div aria-hidden="true" className={cn('hidden h-8 w-8 shrink-0 place-items-center rounded-lg min-[380px]:grid', accent === 'purple' ? 'bg-purple-500/10 text-purple-300' : 'bg-primary/10 text-primary')}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-2.5 truncate text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">{value}</p>
      {delta != null && <p className={cn('mt-1 text-xs font-medium', delta >= 0 ? 'text-primary' : 'text-red-400')}>{delta >= 0 ? '+' : ''}{delta}% vs last period</p>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center sm:py-16">
      {Icon && <div aria-hidden="true" className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary"><Icon className="h-6 w-6" /></div>}
      <h3 className="text-base font-semibold">{title}</h3>
      {desc && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* Shown when a request fails, instead of an endless spinner. */
export function InlineError({ title = 'Something went wrong', desc = 'We could not load this. Check your connection and try again.', onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/5 px-6 py-12 text-center">
      <div aria-hidden="true" className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-red-500/10 text-red-300"><AlertTriangle className="h-5 w-5" /></div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  )
}

export function PageHeader({ title, desc, actions, note }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="fv-h1">{title}</h1>
        {desc && <p className="fv-sub mt-1">{desc}</p>}
        {note}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Section({ title, desc, right, children }) {
  return (
    <section className="min-w-0">
      {(title || right) && (
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3 sm:mb-4">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>}
            {desc && <p className="fv-sub">{desc}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

/* Compact range / filter switcher. options: [[value, label], ...] */
export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn('min-h-8 shrink-0 rounded-lg px-3 text-xs font-medium transition-colors', value === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
        >{l}</button>
      ))}
    </div>
  )
}

/* Icon + text row used in activity / member lists. */
export function ListRow({ leading, title, sub, trailing }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
      {trailing}
    </div>
  )
}
