'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { API, CATEGORIES, money, cn } from '@/lib/fanvase'
import { Avatar, EmptyState, FullLoader, KPICard, Section, PageHeader, InlineError, ListRow } from '@/components/fanvase/atoms'
import { Search, Compass, Gift, Copy, Users, MousePointerClick, CheckCircle2, DollarSign, ArrowRight } from 'lucide-react'

export function DiscoverView({ onOpen }) {
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const [comms, setComms] = useState([])
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  async function load() {
    setLoading(true); setFailed(false)
    try {
      const r = await API.get(`/communities?category=${encodeURIComponent(cat)}&q=${encodeURIComponent(q)}`)
      setComms(r.communities || [])
    } catch (e) { setFailed(true) } finally { setLoading(false) }
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
      <PageHeader title="Discover communities" desc="Search creators by username or explore by category." />
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search creators or communities" className="h-11 pl-10" placeholder="Search creators or communities..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {creators.length > 0 && (
        <div className="space-y-2">
          <p className="fv-eyebrow">Creators</p>
          {creators.map(c => (
            <button key={c.id} type="button" onClick={() => c.community && onOpen(c.community)} className="fv-card fv-card-hover flex w-full items-center gap-3 p-3 text-left">
              <Avatar src={c.avatar_url} name={c.display_name} size={44} />
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{c.display_name}</p><p className="text-xs text-muted-foreground">@{c.username}{c.community ? ` \u00b7 ${c.community.name}` : ' \u00b7 no active community'}</p></div>
              {c.community && <ArrowRight className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}

      <div role="group" aria-label="Categories" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {['All', ...CATEGORIES].map(c => (
          <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className={cn('min-h-9 shrink-0 rounded-full border px-4 text-sm transition-colors', cat === c ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>{c}</button>
        ))}
      </div>

      {failed ? <InlineError title="Could not load communities" onRetry={load} /> : loading ? <FullLoader label="Loading communities" /> : comms.length === 0 ? (
        <EmptyState icon={Compass} title={q.trim() ? 'No matches found' : 'No communities yet'} desc={q.trim() ? 'Try a different search or category.' : 'Be the first to create one in this category.'} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comms.map(c => <DiscoverCard key={c.id} c={c} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  )
}

function DiscoverCard({ c, onOpen }) {
  return (
    <button type="button" onClick={() => onOpen(c)} className="fv-card fv-card-hover group overflow-hidden text-left">
      <div className="relative aspect-[16/6] w-full overflow-hidden bg-secondary">
        {c.cover_url ? <img src={c.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-purple-600/20" />}
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
  const [failed, setFailed] = useState(false)
  const load = () => { setFailed(false); API.get('/referrals').then(setData).catch(() => setFailed(true)) }
  useEffect(load, [])
  if (failed) return <InlineError title="Could not load referrals" onRetry={load} />
  if (!data) return <FullLoader label="Loading referrals" />
  const code = data.code || ''
  const copy = () => { if (!code) return toast.error('Set a username first (complete creator setup)'); navigator.clipboard.writeText(code); toast.success('Referral code copied!') }
  return (
    <div className="space-y-6">
      <PageHeader title="Refer & Earn" desc="Earn $10 when a creator you refer lands their first subscriber." />

      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-3"><div aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-purple-500/10 text-purple-300"><Gift className="h-5 w-5" /></div><div><p className="font-semibold">Your referral code</p><p className="text-xs text-muted-foreground">Friends enter this code when they sign up.</p></div></div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-base font-semibold tracking-wide sm:text-lg"><span className="truncate">{code ? `@${code}` : 'set a username'}</span></div>
          <Button onClick={copy} className="sm:w-auto"><Copy className="h-4 w-4" /> Copy code</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
              <ListRow key={r.id}
                leading={<Avatar src={r.referred?.avatar_url} name={r.referred?.display_name} size={40} />}
                title={r.referred?.display_name || 'New user'} sub={`@${r.referred?.username || 'pending'}`}
                trailing={<div className="text-right"><p className="font-semibold tabular-nums text-primary">{money(r.reward)}</p><p className="text-xs capitalize text-muted-foreground">{r.status}</p></div>} />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
