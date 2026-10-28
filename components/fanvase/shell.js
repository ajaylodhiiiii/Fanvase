'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/fanvase'
import { Logo, Avatar } from '@/components/fanvase/atoms'
import { Menu, X } from 'lucide-react'

/*
  DashboardShell: shared layout for the creator dashboard and the admin console.

  groups:   [{ label?: string, items: [{ k, t, icon }] }]   primary navigation
  footer:   [{ t, icon, onClick }]                          account actions (kept apart from nav)
  topRight: node rendered at the right of the top bar
  banner:   node rendered above the page content
*/
export function DashboardShell({ badge, groups, view, setView, footer = [], user, topRight, banner, children, onLogoClick }) {
  const [open, setOpen] = useState(false)
  const closeRef = useRef(null)
  const flat = groups.flatMap(g => g.items)
  const current = flat.find(i => i.k === view)

  // Drawer: Escape closes, body scroll locks, focus moves to the close button.
  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open])

  function go(k) { setView(k); setOpen(false) }

  const nav = (
    <nav aria-label="Primary" className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.label && <p className="fv-eyebrow mb-1.5 px-3">{g.label}</p>}
          <ul className="space-y-0.5">
            {g.items.map(n => {
              const active = view === n.k
              return (
                <li key={n.k}>
                  <button
                    type="button"
                    onClick={() => go(n.k)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                      active ? 'bg-sidebar-accent text-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
                    )}
                  >
                    {active && <span aria-hidden="true" className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />}
                    <n.icon aria-hidden="true" className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                    <span className="truncate">{n.t}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  const account = (
    <div className="border-t border-sidebar-border p-3">
      {user && (
        <div className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar src={user.avatar_url} name={user.display_name} size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.display_name || 'Account'}</p>
            {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
          </div>
        </div>
      )}
      <ul className="space-y-0.5">
        {footer.map((f, i) => (
          <li key={i}>
            <button type="button" onClick={() => { setOpen(false); f.onClick?.() }} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground">
              <f.icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-muted-foreground" /> {f.t}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <div className="min-h-[100dvh] bg-background lg:flex">
      {/* DESKTOP SIDEBAR */}
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-2 px-5">
          <Logo size="sm" onClick={onLogoClick} />
          {badge && <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-primary">{badge}</span>}
        </div>
        {nav}
        {account}
      </aside>

      {/* MOBILE DRAWER (always mounted so it can animate) */}
      <div className={cn('fixed inset-0 z-50 transition-[visibility] duration-300 lg:hidden', open ? 'visible' : 'invisible')} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={cn('absolute inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={cn(
            'pt-safe pb-safe pl-safe absolute left-0 top-0 flex h-full w-[86%] max-w-[320px] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl transition-transform duration-300 ease-out',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Logo size="sm" onClick={() => { setOpen(false); onLogoClick?.() }} />
              {badge && <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-primary">{badge}</span>}
            </div>
            <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          {nav}
          {account}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {/* TOP BAR */}
        <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:h-16">
            <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="-ml-2 grid h-10 w-10 place-items-center rounded-xl text-foreground transition-colors hover:bg-secondary lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <p className="truncate text-sm font-semibold lg:text-[15px]">{current?.t}</p>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">{topRight}</div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
          {banner}
          {children}
        </main>
      </div>
    </div>
  )
}
