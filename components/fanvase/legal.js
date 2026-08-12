import { cn } from '@/lib/utils'

export const INFO_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/refund', label: 'Refund Policy' },
  { href: '/contact', label: 'Contact' },
]

export function FooterLinks({ className }) {
  return (
    <nav className={cn('flex flex-wrap items-center gap-x-5 gap-y-2', className)}>
      {INFO_LINKS.map(l => (
        <a key={l.href} href={l.href} className="text-sm text-muted-foreground transition hover:text-foreground">{l.label}</a>
      ))}
    </nav>
  )
}

function Wordmark() {
  return (
    <a href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary font-black text-primary-foreground">F</span>
      <span>Fan<span className="text-primary">vase</span></span>
    </a>
  )
}

export function InfoShell({ title, subtitle, updated, children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Wordmark />
          <a href="/" className="text-sm text-muted-foreground transition hover:text-foreground">&larr; Back to home</a>
        </div>
      </header>

      <main className="container max-w-3xl py-12 md:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
        {updated && <p className="mt-2 text-xs text-muted-foreground">Last updated: {updated}</p>}
        <div className="mt-8 space-y-2 leading-relaxed text-muted-foreground">{children}</div>
      </main>

      <footer className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <Wordmark />
          <FooterLinks />
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Fanvase</p>
        </div>
      </footer>
    </div>
  )
}

export function H2({ children }) {
  return <h2 className="mt-8 text-xl font-semibold text-foreground">{children}</h2>
}
export function P({ children }) {
  return <p className="mt-2">{children}</p>
}
export function UL({ children }) {
  return <ul className="mt-2 list-disc space-y-1 pl-5">{children}</ul>
}
