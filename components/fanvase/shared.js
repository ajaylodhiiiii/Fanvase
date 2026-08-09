'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { API, CATEGORIES, money, cn } from '@/lib/fanvase'
import { Avatar, EmptyState, FullLoader, KPICard, Section } from '@/components/fanvase/atoms'
import { Search, Compass, Gift, Copy, Users, MousePointerClick, CheckCircle2, DollarSign, ArrowRight } from 'lucide-react'

export function DiscoverView({ onOpen }) {
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const [comms, setComms] = useState([])
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const r = await API.get(`/communities?category=${encodeURIComponent(cat)}&q=${encodeURIComponent(q)}`)
      setComms(r.communities || [])
    } catch (e) {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [cat])
  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length >= 2) { try { const r = await API.get(`/search-creator?q=${encodeURIComponent(q)}`); setCreators(r.results || []) } catch (e) {} }
      else setCreators([])
      load()
    }, 350)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Discover communities</h1>
        <p className="text-sm text-muted-foreground">Search creators by username or explore by category.</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9 h-11" placeholder="Search creators or communities..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {creators.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Creators</p>
          {creators.map(c => (
            <button key={c.id} onClick={() => c.community && onOpen(c.community)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left hover:border-primary/50">
              <Avatar src={c.avatar_url} name={c.display_name} size={44} />
              <div className="flex-1"><p className="font-semibold">{c.display_name}</p><p className="text-xs text-muted-foreground">@{c.username}{c.community ? ` \u00b7 ${c.community.name}` : ' \u00b7 no active community'}</p></div>
              {c.community && <ArrowRight className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {['All', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setCat(c)} className={cn('shrink-0 rounded-full border px-4 py-1.5 text-sm', cat === c ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>{c}</button>
        ))}
      </div>

      {loading ? <FullLoader label="Loading communities" /> : comms.length === 0 ? (
        <EmptyState icon={Compass} title="No communities yet" desc="Be the first to create one in this category." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comms.map(c => <DiscoverCard key={c.id} c={c} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  )
}

function DiscoverCard({ c, onOpen }) {
  return (
    <button onClick={() => onOpen(c)} className="group overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:border-primary/50 hover:-translate-y-0.5">
      <div className="relative h-24 w-full overflow-hidden bg-secondary">
        {c.cover_url ? <img src={c.cover_url} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-purple-600/20" />}
        <span className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur">{c.category}</span>
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

export function ReferralPanel() {
  const [data, setData] = useState(null)
  useEffect(() => { API.get('/referrals').then(setData).catch(() => setData({})) }, [])
  if (!data) return <FullLoader label="Loading referrals" />
  const code = data.code || ''
  const copy = () => { if (!code) return toast.error('Set a username first (complete creator setup)'); navigator.clipboard.writeText(code); toast.success('Referral code copied!') }
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Refer & Earn</h1><p className="text-sm text-muted-foreground">Earn $10 when a creator you refer lands their first subscriber.</p></div>

      <Card className="border-primary/30 bg-card p-6 glow-lime">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-purple-500/15 text-purple-300"><Gift className="h-5 w-5" /></div><div><p className="font-semibold">Your referral code</p><p className="text-xs text-muted-foreground">Friends enter this code when they sign up.</p></div></div>
        <div className="mt-4 flex gap-2">
          <div className="flex flex-1 items-center rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-lg font-semibold tracking-wide">{code ? `@${code}` : 'set a username'}</div>
          <Button onClick={copy}><Copy className="mr-1 h-4 w-4" /> Copy code</Button>
        </div>
      </Card>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total clicks" value={data.clicks || 0} icon={MousePointerClick} />
        <KPICard label="Successful referrals" value={data.successful || 0} icon={CheckCircle2} />
        <KPICard label="Pending earnings" value={money(data.pendingEarnings)} icon={DollarSign} accent="purple" />
        <KPICard label="Total earnings" value={money(data.totalEarnings)} icon={Gift} />
      </div>

      <Section title="Your referrals">
        {(!data.referrals || data.referrals.length === 0) ? (
          <EmptyState icon={Users} title="No referrals yet" desc="Share your link to start earning rewards." />
        ) : (
          <div className="space-y-2">
            {data.referrals.map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <Avatar src={r.referred?.avatar_url} name={r.referred?.display_name} size={40} />
                <div className="flex-1"><p className="font-medium">{r.referred?.display_name || 'New user'}</p><p className="text-xs text-muted-foreground">@{r.referred?.username || 'pending'}</p></div>
                <div className="text-right"><p className="font-semibold text-primary">{money(r.reward)}</p><p className="text-xs capitalize text-muted-foreground">{r.status}</p></div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
