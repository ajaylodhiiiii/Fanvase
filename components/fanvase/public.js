'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase, API, IMAGES, money, cn } from '@/lib/fanvase'
import { Logo, Avatar, Spinner } from '@/components/fanvase/atoms'
import { FooterLinks } from '@/components/fanvase/legal'
import {
  ArrowRight, Rocket, Compass, DollarSign, Repeat, Zap, Gift, Users, ShieldCheck,
  Sparkles, TrendingUp, Check, Lock, LinkIcon, FileText, ImageIcon,
} from 'lucide-react'

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.2-5.5 4.2-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.5C17.1 3.1 14.8 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.7H12z" />
    </svg>
  )
}

/* ============ LANDING ============ */
export function Landing({ onStart, onExplore, onLogin }) {
  const steps = [
    { icon: Rocket, t: 'Create your community', d: 'Spin up a branded channel in minutes and set your price.' },
    { icon: DollarSign, t: 'Set your pricing', d: 'Charge recurring memberships or one-time access.' },
    { icon: Users, t: 'Grow your audience', d: 'Fans discover, join and unlock your exclusive content.' },
    { icon: TrendingUp, t: 'Earn & scale', d: 'Track revenue, members and payouts from one dashboard.' },
  ]
  const feats = [
    { icon: Repeat, t: 'Recurring memberships', d: 'Predictable monthly or yearly revenue from your biggest fans.' },
    { icon: Zap, t: 'One-time access', d: 'Sell lifetime access to a drop, cohort or vault instantly.' },
    { icon: Gift, t: 'Refer & Earn', d: 'Earn $10 when a creator you refer lands their first subscriber.' },
    { icon: ShieldCheck, t: 'Own your audience', d: 'Your members, your content, your brand — always.' },
  ]
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <span className="sm:hidden"><Logo size="sm" /></span><span className="hidden sm:block"><Logo /></span>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#creators" className="hover:text-foreground">For creators</a>
            <button onClick={onExplore} className="hover:text-foreground">Discover</button>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onLogin} className="h-9 px-3 text-[13px] sm:h-10 sm:px-4 sm:text-sm">Log in</Button>
            <Button onClick={onStart} className="h-9 px-3 text-[13px] font-semibold sm:h-10 sm:px-4 sm:text-sm"><span className="sm:hidden">Get started</span><span className="hidden sm:inline">Start Creating</span></Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-grid">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
        <div className="container relative grid grid-cols-1 gap-10 py-16 md:grid-cols-2 md:py-24 md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> The creator membership platform
            </span>
            <h1 className="mt-5 text-[2.5rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Turn your audience into a <span className="text-gradient-lime">income</span>.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
              Fanvase lets creators build paid communities and earn recurring or one-time revenue from their biggest fans — all from one beautiful channel.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={onStart} className="h-12 w-full px-7 text-base font-semibold glow-lime sm:w-auto">
                Start Creating <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={onExplore} className="h-12 w-full px-7 text-base sm:w-auto">
                <Compass className="mr-1 h-4 w-4" /> Explore Communities
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {['Recurring or one-time pricing', 'Secure checkout', 'Refer & Earn rewards'].map(t => (
                <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" aria-hidden="true" /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-primary/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-border">
              <img src={IMAGES.hero} alt="Creator filming in a studio" width={1200} height={800} fetchPriority="high" className="h-[280px] w-full object-cover sm:h-[420px]" />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-border bg-background/85 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary"><TrendingUp className="h-5 w-5" /></div>
                    <div className="min-w-0"><p className="text-xs text-muted-foreground">Recurring memberships</p><p className="text-sm font-semibold sm:text-base">Predictable income from your biggest fans</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How Fanvase works</h2>
          <p className="mt-3 text-muted-foreground">From zero to a monetized community in four simple steps.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Card key={i} className="relative border-border bg-card p-6">
              <span className="absolute right-5 top-5 text-4xl font-black text-secondary">{i + 1}</span>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary"><s.icon className="h-6 w-6" /></div>
              <h3 className="mt-4 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="creators" className="border-y border-border bg-card/40">
        <div className="container grid grid-cols-1 gap-12 py-16 md:grid-cols-2 md:py-24 md:items-center">
          <div>
            <span className="text-sm font-semibold text-primary">Creator monetization</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to earn from your audience</h2>
            <p className="mt-3 text-muted-foreground">Flexible pricing, exclusive content, and a referral engine — designed to grow your recurring income.</p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {feats.map((f, i) => (
                <div key={i} className="rounded-2xl border border-border bg-background p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary"><f.icon className="h-5 w-5" /></div>
                  <h3 className="mt-3 font-semibold">{f.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-purple-600/10 blur-2xl" />
            <img src={IMAGES.edit} alt="Creator editing content" width={1200} height={800} loading="lazy" className="relative h-[280px] w-full sm:h-[440px] rounded-3xl border border-border object-cover" />
          </div>
        </div>
      </section>

      {/* FAN EXPERIENCE */}
      <section className="container py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center">
          <div className="order-2 md:order-1 relative">
            <img src={IMAGES.studio} alt="Fans enjoying a creator community" width={1200} height={800} loading="lazy" className="h-[260px] w-full sm:h-[400px] rounded-3xl border border-border object-cover" />
          </div>
          <div className="order-1 md:order-2">
            <span className="text-sm font-semibold text-purple-300">The fan experience</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Support creators. Unlock the good stuff.</h2>
            <p className="mt-3 text-muted-foreground">Discover communities, join with one tap, and access exclusive posts, files and links from creators you love.</p>
            <ul className="mt-6 space-y-3">
              {['Members-only content feeds', 'Recurring or one-time access', 'Earn rewards by referring friends'].map((t, i) => (
                <li key={i} className="flex items-center gap-3 text-sm"><span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-primary"><Check className="h-3.5 w-3.5" /></span>{t}</li>
              ))}
            </ul>
            <Button className="mt-8" onClick={onExplore} variant="outline"><Compass className="mr-1 h-4 w-4" /> Explore Communities</Button>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-t border-border bg-card/40">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built to be trusted</h2>
            <p className="mt-3 text-muted-foreground">Clear policies, secure payments and a real way to reach us.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { icon: Lock, t: 'Secure checkout', d: 'Payments are handled by Dodo Payments. Fanvase never sees or stores your card details.', href: null },
              { icon: FileText, t: 'Clear policies', d: 'Read exactly how payments, refunds and your data are handled before you commit.', href: '/terms', label: 'Terms & Conditions' },
              { icon: Users, t: 'Real support', d: 'Questions about your account, a payment or a payout? Send us a message and we will help.', href: '/contact', label: 'Contact us' },
            ].map((t, i) => (
              <Card key={i} className="flex flex-col p-6">
                <div aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><t.icon className="h-5 w-5" /></div>
                <h3 className="mt-4 font-semibold">{t.t}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{t.d}</p>
                {t.href && <a href={t.href} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">{t.label} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></a>}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container py-16 md:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card to-background p-8 text-center sm:p-10 md:p-16 glow-lime">
          <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]" />
          <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-5xl">Your community is waiting.</h2>
          <p className="relative mx-auto mt-4 max-w-lg text-muted-foreground">Start building your paid community today. It only takes a few minutes to launch.</p>
          <Button size="lg" onClick={onStart} className="relative mt-8 h-12 w-full px-8 text-base font-semibold sm:w-auto">Start Creating <ArrowRight className="ml-1 h-4 w-4" /></Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container flex flex-col items-center gap-6 py-10">
          <div className="flex w-full flex-col items-center justify-between gap-4 md:flex-row">
            <Logo size="sm" />
            <FooterLinks className="justify-center" />
          </div>
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Fanvase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

/* ============ AUTH ============ */
export function AuthView({ mode = 'signup', initialRole = 'creator', refCode, onDone, onBack, onSwitch }) {
  const [step, setStep] = useState(mode === 'signup' ? 'role' : 'form')
  const [role, setRole] = useState(initialRole)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState(refCode || '')
  const [loading, setLoading] = useState(false)
  const [gLoading, setGLoading] = useState(false)

  async function submit() {
    if (!email || !password) { toast.error('Enter email and password'); return }
    setLoading(true)
    try {
      if (mode === 'signup') {
        await API.post('/auth/signup', { email, password, display_name: name, role, ref: (code || '').trim().toLowerCase() || null })
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      toast.success(mode === 'signup' ? 'Welcome to Fanvase!' : 'Welcome back!')
      onDone?.(role)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  async function forgot() {
    if (!email) { toast.error('Enter your email first'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    if (error) toast.error(error.message)
    else toast.success('If that account exists, a reset link was sent.')
  }

  async function signInGoogle() {
    setGLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
      if (error) throw new Error(error.message)
    } catch (e) { toast.error(e.message); setGLoading(false) }
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-grid p-4 pb-safe pt-safe">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[130px]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo size="lg" onClick={onBack} /></div>

        {mode === 'signup' && step === 'role' && (
          <Card className="p-5 sm:p-6">
            <h1 className="text-center text-xl font-semibold tracking-tight sm:text-2xl">How do you want to use Fanvase?</h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">You can switch or add a creator profile anytime.</p>
            <div className="mt-6 space-y-3">
              {[
                { k: 'creator', icon: Rocket, t: 'Creator', d: 'Build a community and earn from your audience.' },
                { k: 'fan', icon: Users, t: 'Fan', d: 'Discover communities and support your favorite creators.' },
              ].map(o => (
                <button key={o.k} type="button" aria-pressed={role === o.k} onClick={() => setRole(o.k)} className={cn('flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition', role === o.k ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/40')}>
                  <div className={cn('grid h-11 w-11 place-items-center rounded-xl', role === o.k ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary')}><o.icon className="h-5 w-5" /></div>
                  <div className="flex-1"><p className="font-semibold">{o.t}</p><p className="text-sm text-muted-foreground">{o.d}</p></div>
                  <div className={cn('grid h-5 w-5 place-items-center rounded-full border', role === o.k ? 'border-primary bg-primary' : 'border-border')}>{role === o.k && <Check className="h-3 w-3 text-primary-foreground" />}</div>
                </button>
              ))}
            </div>
            <Button className="mt-6 w-full font-semibold" onClick={() => setStep('form')}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
            <p className="mt-4 text-center text-sm text-muted-foreground">Already have an account? <button onClick={() => onSwitch?.('login')} className="font-semibold text-primary">Log in</button></p>
          </Card>
        )}

        {(mode === 'login' || step === 'form') && (
          <Card className="p-5 sm:p-6">
            <h1 className="text-center text-xl font-semibold tracking-tight sm:text-2xl">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
            {mode === 'signup' && <p className="mt-1 text-center text-sm text-muted-foreground">Signing up as <span className="font-semibold capitalize text-primary">{role}</span> {refCode && <>&middot; referred by @{refCode}</>}</p>}
            <div className="mt-6 space-y-4">
              {mode === 'signup' && (<div><Label htmlFor="auth-name">Display name</Label><Input id="auth-name" autoComplete="name" className="mt-1.5" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></div>)}
              <div><Label htmlFor="auth-email">Email</Label><Input id="auth-email" autoComplete="email" inputMode="email" className="mt-1.5" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" /></div>
              {mode === 'signup' && (<div><Label htmlFor="auth-ref">Referral code <span className="text-muted-foreground">(optional)</span></Label><Input id="auth-ref" autoCapitalize="none" className="mt-1.5" value={code} onChange={e => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="creator's username" /><p className="mt-1 text-xs text-muted-foreground">Enter a creator or fan&rsquo;s username who referred you.</p></div>)}
              <div>
                <div className="flex items-center justify-between"><Label htmlFor="auth-password">Password</Label>{mode === 'login' && <button type="button" onClick={forgot} className="rounded px-1 py-1 text-xs text-primary hover:underline">Forgot?</button>}</div>
                <Input id="auth-password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className="mt-1.5" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter a password" onKeyDown={e => e.key === 'Enter' && submit()} />
              </div>
              <Button className="w-full font-semibold" onClick={submit} disabled={loading}>{loading ? <Spinner className="text-primary-foreground" /> : (mode === 'signup' ? 'Create account' : 'Log in')}</Button>
              <div className="relative py-1"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div><div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">or</span></div></div>
              <Button variant="outline" className="w-full" onClick={signInGoogle} disabled={gLoading}>{gLoading ? <Spinner /> : <><GoogleIcon /> Continue with Google</>}</Button>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {mode === 'signup' ? <>Already have an account? <button onClick={() => onSwitch?.('login')} className="font-semibold text-primary">Log in</button></> : <>New to Fanvase? <button onClick={() => onSwitch?.('signup')} className="font-semibold text-primary">Sign up</button></>}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

/* ============ SHARED: community card + discover grid ============ */
export function CommunityCard({ c, onOpen }) {
  return (
    <button type="button" onClick={() => onOpen(c)} className="group overflow-hidden rounded-2xl border border-border bg-card text-left transition-colors hover:border-primary/40">
      <div className="relative aspect-[16/6] w-full overflow-hidden bg-secondary">
        {c.cover_url ? <img src={c.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-purple-600/20" />}
        <span className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">{c.category}</span>
      </div>
      <div className="p-4">
        <div className="-mt-8 mb-2"><Avatar src={c.image_url} name={c.name} size={44} className="ring-4 ring-card" /></div>
        <h3 className="font-semibold leading-tight line-clamp-1">{c.name}</h3>
        <p className="text-xs text-muted-foreground">by @{c.creator?.username || 'creator'}</p>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description || 'An exclusive community.'}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> {c.member_count || 0}</span>
          <span className="rounded-lg bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">{money(c.price, c.currency)}{c.pricing_type === 'recurring' ? `/${c.billing_period === 'yearly' ? 'yr' : 'mo'}` : ''}</span>
        </div>
      </div>
    </button>
  )
}

/* ============ PUBLIC COMMUNITY PAGE ============ */
export function PublicCommunity({ data, currentUser, onJoin, onBack, onLogin }) {
  const { community: c, creator, posts, total_posts, is_member } = data
  const typeIcon = { text: FileText, image: ImageIcon, link: LinkIcon, file: FileText }
  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Logo size="sm" onClick={onBack} />
          {currentUser ? <Button variant="outline" size="sm" onClick={onBack}>My dashboard</Button> : <Button size="sm" onClick={onLogin}>Log in</Button>}
        </div>
      </header>

      <div className="relative h-56 w-full overflow-hidden bg-secondary md:h-72">
        {c.cover_url ? <img src={c.cover_url} className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full bg-gradient-to-br from-primary/25 to-purple-700/25" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container relative -mt-14 grid grid-cols-1 gap-8 pb-32 sm:-mt-16 lg:grid-cols-3 lg:pb-20">
        <div className="lg:col-span-2">
          <div className="flex items-end gap-3 sm:gap-4">
            <Avatar src={c.image_url} name={c.name} size={88} className="ring-4 ring-background" />
            <div className="min-w-0 pb-1 sm:pb-2">
              <span className="rounded-full border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">{c.category}</span>
              <h1 className="mt-1 break-words text-2xl font-bold tracking-tight sm:text-3xl">{c.name}</h1>
              <p className="text-sm text-muted-foreground">by @{creator?.username} &middot; {c.member_count || 0} members</p>
            </div>
          </div>
          <p className="mt-6 text-muted-foreground">{c.description || 'Welcome to this exclusive community.'}</p>

          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Content preview</h2>
            <div className="space-y-3">
              {posts.length === 0 && <p className="text-sm text-muted-foreground">No public posts yet.</p>}
              {posts.map(p => {
                const Ic = typeIcon[p.type] || FileText
                return (
                  <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Ic className="h-3.5 w-3.5 text-primary" /> {p.type} &middot; {p.visibility}</div>
                    {p.title && <h3 className="mt-1 font-semibold">{p.title}</h3>}
                    {p.content && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.content}</p>}
                  </div>
                )
              })}
              {total_posts > posts.length && (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 py-6 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4 text-primary" /> {total_posts - posts.length} members-only posts. Join to unlock.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* JOIN CARD */}
        <div className="lg:sticky lg:top-24 h-fit">
          <Card id="join-card" className="p-5 sm:p-6">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold">{money(c.price, c.currency)}</span>
              <span className="text-muted-foreground">{c.pricing_type === 'recurring' ? `/ ${c.billing_period === 'yearly' ? 'year' : 'month'}` : 'one-time'}</span>
            </div>
            <span className="mt-2 inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">{c.pricing_type === 'recurring' ? 'Recurring membership' : 'One-time access'}</span>
            <ul className="mt-5 space-y-2.5 text-sm">
              {['Full access to all members-only posts', 'Exclusive files, links & resources', 'Direct broadcasts from the creator', 'Cancel anytime'].map((b, i) => (
                <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {b}</li>
              ))}
            </ul>
            {is_member ? (
              <Button className="mt-6 w-full" disabled variant="secondary"><Check className="mr-1 h-4 w-4" /> You&rsquo;re a member</Button>
            ) : (
              <Button className="mt-6 w-full font-semibold" onClick={() => onJoin(c)}>Join Community <ArrowRight className="ml-1 h-4 w-4" /></Button>
            )}
            <p className="mt-3 text-center text-xs text-muted-foreground">Secure checkout &middot; {typeof window !== 'undefined' ? window.location.host : 'fanvase.online'}/c/{c.slug}</p>
          </Card>
        </div>

        {/* Mobile join bar: the join card sits below the content, so keep the action in reach. */}
        {!is_member && (
          <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
            <div className="container flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{money(c.price, c.currency)}{c.pricing_type === 'recurring' ? ` / ${c.billing_period === 'yearly' ? 'year' : 'month'}` : ' one-time'}</p>
              </div>
              <Button className="shrink-0 font-semibold" onClick={() => onJoin(c)}>Join <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
