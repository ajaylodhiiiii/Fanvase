'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { toast } from 'sonner'
import { API, money, timeAgo, cn } from '@/lib/fanvase'
import { Logo, Avatar, Spinner, StatusBadge, KPICard, EmptyState, FullLoader, Section } from '@/components/fanvase/atoms'
import { ReferralPanel } from '@/components/fanvase/shared'
import {
  LayoutDashboard, Radio, FileText, Users, CreditCard, DollarSign, Gift, BarChart3, Settings,
  Plus, Bell, Search, LogOut, Menu, X, TrendingUp, Repeat, Zap, Copy, ExternalLink, Check,
  ImageIcon, LinkIcon, Trash2, Rocket, ArrowUpRight, UserCircle,
} from 'lucide-react'

const NAV = [
  { k: 'overview', t: 'Overview', icon: LayoutDashboard },
  { k: 'content', t: 'Content', icon: FileText },
  { k: 'members', t: 'Members', icon: Users },
  { k: 'plans', t: 'Manage Plans', icon: CreditCard },
  { k: 'earnings', t: 'Earnings', icon: DollarSign },
  { k: 'referrals', t: 'Referrals', icon: Gift },
  { k: 'analytics', t: 'Analytics', icon: BarChart3 },
  { k: 'settings', t: 'Settings', icon: Settings },
]

export function CreatorDashboard({ profile, communities: initComms, balance, onNavPublic, onLogout, onSwitchFan, onReload }) {
  const [view, setView] = useState('overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [comms, setComms] = useState(initComms || [])
  const community = comms[0]
  const pending = !community || community.status !== 'active' || profile?.platform_status !== 'active'

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* SIDEBAR (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center px-5"><Logo size="sm" onClick={onNavPublic} /></div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(n => (
            <button key={n.k} onClick={() => setView(n.k)} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition', view === n.k ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}>
              <n.icon className="h-4.5 w-4.5" /> {n.t}
            </button>
          ))}
        </nav>
        <div className="p-3">
          <button onClick={onSwitchFan} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent"><UserCircle className="h-4.5 w-4.5" /> Switch to Fan</button>
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent"><LogOut className="h-4.5 w-4.5" /> Log out</button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
          <button className="lg:hidden" onClick={() => setMobileNav(true)}><Menu className="h-5 w-5" /></button>
          <div className="hidden flex-1 items-center gap-2 md:flex">
            <div className="relative w-full max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-9 pl-9" placeholder="Search..." /></div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-3 lg:flex-none">
            <Button size="sm" onClick={() => setView('content')} className="font-semibold"><Plus className="mr-1 h-4 w-4" /> Create</Button>
            <button className="relative grid h-9 w-9 place-items-center rounded-xl border border-border"><Bell className="h-4 w-4" /></button>
            <Avatar src={profile?.avatar_url} name={profile?.display_name} size={36} />
          </div>
        </header>

        {/* MOBILE NAV DRAWER */}
        {mobileNav && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNav(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-sidebar p-4">
              <div className="mb-4 flex items-center justify-between"><Logo size="sm" /><button onClick={() => setMobileNav(false)}><X className="h-5 w-5" /></button></div>
              <nav className="space-y-1">{NAV.map(n => (<button key={n.k} onClick={() => { setView(n.k); setMobileNav(false) }} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium', view === n.k ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground')}><n.icon className="h-4.5 w-4.5" /> {n.t}</button>))}</nav>
              <div className="mt-4 border-t border-sidebar-border pt-4"><button onClick={onSwitchFan} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground"><UserCircle className="h-4.5 w-4.5" /> Switch to Fan</button><button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground"><LogOut className="h-4.5 w-4.5" /> Log out</button></div>
            </div>
          </div>
        )}

        <main className="container max-w-6xl py-6">
          {pending && view !== 'plans' && (
            <button onClick={() => setView('plans')} className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-left">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-400"><Rocket className="h-4 w-4" /></div>
              <div className="flex-1"><p className="text-sm font-semibold text-amber-300">Activate your channel</p><p className="text-xs text-muted-foreground">Subscribe to a platform plan to go live and accept members.</p></div>
              <ArrowUpRight className="h-4 w-4 text-amber-400" />
            </button>
          )}
          {view === 'overview' && <Overview profile={profile} community={community} onNavPublic={onNavPublic} />}
          {view === 'content' && <Content comms={comms} />}
          {view === 'members' && <Members />}
          {view === 'plans' && <Plans profile={profile} onReload={onReload} />}
          {view === 'earnings' && <Earnings />}
          {view === 'referrals' && <ReferralPanel />}
          {view === 'analytics' && <Analytics />}
          {view === 'settings' && <SettingsView profile={profile} community={community} onNavPublic={onNavPublic} />}
        </main>
      </div>
    </div>
  )
}

function ShareLink({ community }) {
  if (!community) return null
  const link = typeof window !== 'undefined' ? `${window.location.origin}/c/${community.slug}` : ''
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2">
      <span className="truncate px-2 text-xs text-muted-foreground">fanvase.in/c/{community.slug}</span>
      <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(link); toast.success('Link copied') }}><Copy className="h-3.5 w-3.5" /></Button>
    </div>
  )
}

/* ---------- OVERVIEW ---------- */
function Overview({ profile, community, onNavPublic }) {
  const [range, setRange] = useState(30)
  const [data, setData] = useState(null)
  useEffect(() => { setData(null); API.get(`/creator/overview?range=${range}`).then(setData).catch(() => {}) }, [range])
  if (!data) return <FullLoader label="Loading dashboard" />
  const k = data.kpis
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold tracking-tight">Welcome back, {profile?.display_name?.split(' ')[0] || 'creator'} 👋</h1><p className="text-sm text-muted-foreground">Here&rsquo;s how {community?.name || 'your community'} is doing.</p></div>
        <ShareLink community={community} />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <KPICard label="Total Members" value={k.totalMembers} icon={Users} />
        <KPICard label="Total Revenue" value={money(k.totalRevenue)} icon={DollarSign} />
        <KPICard label="MRR" value={money(k.mrr)} icon={Repeat} accent="purple" />
        <KPICard label="New Members" value={k.newMembers} icon={TrendingUp} />
        <KPICard label="Active Members" value={k.activeMembers} icon={Users} />
        <KPICard label="Referral Earnings" value={money(k.referralEarnings)} icon={Gift} accent="purple" />
      </div>

      <Card className="border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Revenue over time</h2>
          <div className="flex gap-1 rounded-xl border border-border p-1">
            {[[7, '7d'], [30, '30d'], [90, '3m'], [180, '6m'], [365, '1y']].map(([v, l]) => (
              <button key={v} onClick={() => setRange(v)} className={cn('rounded-lg px-2.5 py-1 text-xs', range === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{l}</button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series}>
              <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(83 74% 55%)" stopOpacity={0.5} /><stop offset="100%" stopColor="hsl(83 74% 55%)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ background: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 15%)', borderRadius: 12, color: '#fff' }} formatter={v => [money(v), 'Revenue']} />
              <Area type="monotone" dataKey="value" stroke="hsl(83 74% 55%)" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Recent activity">
          {data.activity.length === 0 ? <EmptyState icon={Bell} title="No activity yet" desc="Actions will appear here." /> : (
            <div className="space-y-2">{data.activity.map(a => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary"><Bell className="h-4 w-4" /></div>
                <div className="flex-1"><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.body}</p></div>
                <span className="text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
              </div>
            ))}</div>
          )}
        </Section>
        <Section title="Recent members">
          {data.recentMembers.length === 0 ? <EmptyState icon={Users} title="No members yet" desc="Share your community link to get your first member." /> : (
            <div className="space-y-2">{data.recentMembers.map(m => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <Avatar src={m.profile?.avatar_url} name={m.profile?.display_name} size={38} />
                <div className="flex-1"><p className="text-sm font-medium">{m.profile?.display_name || 'Member'}</p><p className="text-xs text-muted-foreground">{m.plan} &middot; {timeAgo(m.joined_at)}</p></div>
                <StatusBadge status={m.status} />
              </div>
            ))}</div>
          )}
        </Section>
      </div>
    </div>
  )
}

/* ---------- CONTENT ---------- */
function Content({ comms }) {
  const [posts, setPosts] = useState(null)
  const [open, setOpen] = useState(false)
  const load = () => API.get('/creator/posts').then(r => setPosts(r.posts)).catch(() => setPosts([]))
  useEffect(() => { load() }, [])
  async function del(id) { try { await API.del(`/posts/${id}`); toast.success('Deleted'); load() } catch (e) { toast.error(e.message) } }
  return (
    <div className="space-y-6">
      <Section title="Content" desc="Broadcast posts to your members." right={<Button onClick={() => setOpen(true)} className="font-semibold"><Plus className="mr-1 h-4 w-4" /> Create Post</Button>}>
        {posts === null ? <FullLoader /> : posts.length === 0 ? (
          <EmptyState icon={FileText} title="No posts yet" desc="Publish your first broadcast to engage members." action={<Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> Create Post</Button>} />
        ) : (
          <div className="space-y-3">{posts.map(p => (
            <Card key={p.id} className="border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md bg-secondary px-2 py-0.5 capitalize">{p.type}</span>
                    <StatusBadge status={p.status === 'published' ? 'active' : p.status} /><span>&middot; {p.visibility}</span><span>&middot; {p.community?.name}</span>
                  </div>
                  {p.title && <h3 className="mt-2 font-semibold">{p.title}</h3>}
                  {p.content && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.content}</p>}
                  {p.media_url && <img src={p.media_url} className="mt-2 h-32 rounded-xl object-cover" alt="" />}
                  {p.link_url && <a href={p.link_url} target="_blank" className="mt-2 inline-flex items-center gap-1 text-sm text-primary"><LinkIcon className="h-3.5 w-3.5" /> {p.link_url}</a>}
                  <p className="mt-2 text-xs text-muted-foreground">{timeAgo(p.created_at)}</p>
                </div>
                <button onClick={() => del(p.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </Card>
          ))}</div>
        )}
      </Section>
      <CreatePostDialog open={open} setOpen={setOpen} comms={comms} onCreated={load} />
    </div>
  )
}

function CreatePostDialog({ open, setOpen, comms, onCreated }) {
  const [type, setType] = useState('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [media, setMedia] = useState('')
  const [link, setLink] = useState('')
  const [visibility, setVisibility] = useState('members')
  const [community, setCommunity] = useState(comms[0]?.id || '')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function upload(e, bucket) {
    const f = e.target.files?.[0]; if (!f) return
    setUploading(true)
    try { const r = await API.upload(f, bucket); setMedia(r.url); toast.success('Uploaded') } catch (err) { toast.error(err.message) } finally { setUploading(false) }
  }
  async function submit(status) {
    if (!community) return toast.error('Select a community')
    setBusy(true)
    try {
      await API.post('/posts', { community_id: community, title, content, type, media_url: media, link_url: link, visibility, status })
      toast.success(status === 'draft' ? 'Draft saved' : 'Post published')
      setOpen(false); setTitle(''); setContent(''); setMedia(''); setLink(''); onCreated()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  const types = [{ k: 'text', icon: FileText }, { k: 'image', icon: ImageIcon }, { k: 'file', icon: FileText }, { k: 'link', icon: LinkIcon }]
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create Post</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">{types.map(t => <button key={t.k} onClick={() => setType(t.k)} className={cn('flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 text-xs capitalize', type === t.k ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}><t.icon className="h-4 w-4" /> {t.k}</button>)}</div>
          {comms.length > 1 && <select value={community} onChange={e => setCommunity(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{comms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
          <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea rows={4} placeholder="Write something..." value={content} onChange={e => setContent(e.target.value)} />
          {(type === 'image' || type === 'file') && (
            <div><Label className="text-xs">{type === 'file' ? 'Attachment (PDF, max 2MB)' : 'Image'}</Label>
              <label className="mt-1.5 flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">{uploading ? <Spinner className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}{media ? 'Replace file' : 'Upload'}<input type="file" className="hidden" accept={type === 'file' ? 'application/pdf' : 'image/*'} onChange={e => upload(e, type === 'file' ? 'files' : 'media')} /></label>
              {media && <p className="mt-1 truncate text-xs text-primary">{media}</p>}
            </div>
          )}
          {type === 'link' && <Input placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} />}
          <div><Label className="text-xs">Visibility</Label><div className="mt-1.5 flex gap-2">{['public', 'members'].map(v => <button key={v} onClick={() => setVisibility(v)} className={cn('rounded-xl border px-3 py-1.5 text-sm capitalize', visibility === v ? 'border-primary bg-primary/10 text-primary' : 'border-border')}>{v}</button>)}</div></div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => submit('draft')} disabled={busy}>Save draft</Button>
          <Button onClick={() => submit('published')} disabled={busy} className="font-semibold">{busy ? <Spinner className="text-primary-foreground" /> : 'Publish'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- MEMBERS ---------- */
function Members() {
  const [members, setMembers] = useState(null)
  useEffect(() => { API.get('/creator/members').then(r => setMembers(r.members)).catch(() => setMembers([])) }, [])
  if (members === null) return <FullLoader />
  return (
    <Section title="Members" desc="Everyone across your communities.">
      {members.length === 0 ? <EmptyState icon={Users} title="No members yet" desc="Members appear here once they join." /> : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
            <Table>
              <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Member</TableHead><TableHead>Community</TableHead><TableHead>Plan</TableHead><TableHead>Joined</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{members.map(m => (
                <TableRow key={m.id} className="border-border">
                  <TableCell><div className="flex items-center gap-2"><Avatar src={m.profile?.avatar_url} name={m.profile?.display_name} size={32} /><div><p className="text-sm font-medium">{m.profile?.display_name}</p><p className="text-xs text-muted-foreground">{m.profile?.email}</p></div></div></TableCell>
                  <TableCell className="text-sm">{m.community?.name}</TableCell>
                  <TableCell className="text-sm capitalize">{m.plan}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{timeAgo(m.joined_at)}</TableCell>
                  <TableCell><StatusBadge status={m.status} /></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
          <div className="space-y-2 md:hidden">{members.map(m => (
            <Card key={m.id} className="border-border bg-card p-3"><div className="flex items-center gap-3"><Avatar src={m.profile?.avatar_url} name={m.profile?.display_name} size={40} /><div className="flex-1"><p className="text-sm font-medium">{m.profile?.display_name}</p><p className="text-xs text-muted-foreground">{m.community?.name} &middot; {m.plan}</p></div><StatusBadge status={m.status} /></div></Card>
          ))}</div>
        </>
      )}
    </Section>
  )
}

/* ---------- PLANS ---------- */
function Plans({ profile, onReload }) {
  const [busy, setBusy] = useState('')
  const plans = [
    { k: 'basic', name: 'Basic', price: 5, benefits: ['1 active community', 'Unlimited posts', 'Up to 500 members', 'Standard support', '10% platform fee'] },
    { k: 'pro', name: 'Pro', price: 20, benefits: ['Unlimited communities', 'Unlimited posts & members', 'Priority support', 'Advanced analytics', 'Lower platform fee', 'Custom branding'] },
  ]
  async function subscribe(k) { setBusy(k); try { await API.post('/platform/subscribe', { plan: k }); toast.success('Plan selected! Awaiting admin activation.'); onReload?.() } catch (e) { toast.error(e.message) } finally { setBusy('') } }
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Manage Plans</h1><p className="text-sm text-muted-foreground">Subscribe to a platform plan to activate your channel.</p></div>
      {profile?.platform_status === 'pending' && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-300">Your <b className="capitalize">{profile.platform_plan}</b> plan is pending activation. We&rsquo;ll notify you once it&rsquo;s live.</div>}
      {profile?.platform_status === 'active' && <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary flex items-center gap-2"><Check className="h-4 w-4" /> Your <b className="capitalize">{profile.platform_plan}</b> plan is active.</div>}
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map(p => {
          const active = profile?.platform_plan === p.k && profile?.platform_status === 'active'
          return (
            <Card key={p.k} className={cn('relative border-border bg-card p-6', p.k === 'pro' && 'border-primary/40 glow-lime')}>
              {p.k === 'pro' && <span className="absolute right-5 top-5 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">Popular</span>}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1"><span className="text-3xl font-extrabold">{money(p.price)}</span><span className="text-muted-foreground">/mo</span></div>
              <ul className="mt-5 space-y-2 text-sm">{p.benefits.map((b, i) => <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {b}</li>)}</ul>
              <Button className="mt-6 w-full font-semibold" disabled={busy === p.k || active} variant={p.k === 'pro' ? 'default' : 'outline'} onClick={() => subscribe(p.k)}>{active ? 'Current plan' : busy === p.k ? <Spinner className="text-primary-foreground" /> : `Choose ${p.name}`}</Button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- EARNINGS ---------- */
function Earnings() {
  const [data, setData] = useState(null)
  useEffect(() => { API.get('/creator/earnings').then(setData).catch(() => setData({})) }, [])
  if (!data) return <FullLoader />
  const b = data.balance || {}
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Earnings</h1><p className="text-sm text-muted-foreground">Track your revenue and payouts.</p></div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard label="Available balance" value={money(b.available)} icon={DollarSign} />
        <KPICard label="Total earned" value={money(b.total_earned)} icon={TrendingUp} />
        <KPICard label="Referral payouts" value={money(b.referral_earned)} icon={Gift} accent="purple" />
        <KPICard label="Platform fees" value={money(data.platformFees)} icon={CreditCard} />
      </div>
      <Section title="Transaction history">
        {(!data.transactions || data.transactions.length === 0) ? <EmptyState icon={DollarSign} title="No transactions yet" desc="Earnings appear here when members join." /> : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
              <Table>
                <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Date</TableHead><TableHead>Member</TableHead><TableHead>Community</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                <TableBody>{data.transactions.map(t => (
                  <TableRow key={t.id} className="border-border">
                    <TableCell className="text-sm text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{t.member?.display_name || '—'}</TableCell>
                    <TableCell className="text-sm">{t.community?.name || '—'}</TableCell>
                    <TableCell className="text-sm capitalize">{t.type}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-right font-semibold text-primary">{money(t.amount, t.currency)}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </div>
            <div className="space-y-2 md:hidden">{data.transactions.map(t => (
              <Card key={t.id} className="border-border bg-card p-3"><div className="flex items-center justify-between"><div><p className="text-sm font-medium capitalize">{t.type}</p><p className="text-xs text-muted-foreground">{t.member?.display_name || t.description} &middot; {new Date(t.created_at).toLocaleDateString()}</p></div><span className="font-semibold text-primary">{money(t.amount, t.currency)}</span></div></Card>
            ))}</div>
          </>
        )}
      </Section>
    </div>
  )
}

/* ---------- ANALYTICS ---------- */
function Analytics() {
  const [range, setRange] = useState(90)
  const [data, setData] = useState(null)
  useEffect(() => { setData(null); API.get(`/creator/overview?range=${range}`).then(setData).catch(() => {}) }, [range])
  if (!data) return <FullLoader />
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold tracking-tight">Analytics</h1><p className="text-sm text-muted-foreground">Deep dive into your community performance.</p></div>
        <div className="flex gap-1 rounded-xl border border-border p-1">{[[30, '30d'], [90, '3m'], [180, '6m'], [365, '1y']].map(([v, l]) => <button key={v} onClick={() => setRange(v)} className={cn('rounded-lg px-2.5 py-1 text-xs', range === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{l}</button>)}</div>
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard label="Members" value={data.kpis.totalMembers} icon={Users} />
        <KPICard label="Active" value={data.kpis.activeMembers} icon={Users} />
        <KPICard label="Revenue" value={money(data.kpis.totalRevenue)} icon={DollarSign} />
        <KPICard label="MRR" value={money(data.kpis.mrr)} icon={Repeat} accent="purple" />
      </div>
      <Card className="border-border bg-card p-5"><h2 className="mb-4 font-semibold">Revenue trend</h2>
        <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.series}><defs><linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(270 70% 62%)" stopOpacity={0.5} /><stop offset="100%" stopColor="hsl(270 70% 62%)" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" vertical={false} /><XAxis dataKey="date" tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} /><YAxis tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} width={36} /><Tooltip contentStyle={{ background: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 15%)', borderRadius: 12 }} formatter={v => [money(v), 'Revenue']} /><Area type="monotone" dataKey="value" stroke="hsl(270 70% 62%)" strokeWidth={2} fill="url(#rev2)" /></AreaChart></ResponsiveContainer></div>
      </Card>
    </div>
  )
}

/* ---------- SETTINGS ---------- */
function SettingsView({ profile, community, onNavPublic }) {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Settings</h1><p className="text-sm text-muted-foreground">Manage your creator profile.</p></div>
      <Card className="border-border bg-card p-6">
        <div className="flex items-center gap-4"><Avatar src={profile?.avatar_url} name={profile?.display_name} size={64} /><div><p className="text-lg font-semibold">{profile?.display_name}</p><p className="text-sm text-muted-foreground">@{profile?.username} &middot; {profile?.email}</p></div></div>
        <p className="mt-4 text-sm text-muted-foreground">{profile?.bio || 'No bio yet.'}</p>
      </Card>
      {community && (
        <Card className="border-border bg-card p-6">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Your community</h2><StatusBadge status={community.status} /></div>
          <div className="mt-4 flex items-center gap-3"><Avatar src={community.image_url} name={community.name} size={48} /><div className="flex-1"><p className="font-medium">{community.name}</p><p className="text-xs text-muted-foreground">{money(community.price, community.currency)}{community.pricing_type === 'recurring' ? `/${community.billing_period === 'yearly' ? 'yr' : 'mo'}` : ' one-time'}</p></div><Button size="sm" variant="outline" onClick={() => onNavPublic(community)}><ExternalLink className="mr-1 h-3.5 w-3.5" /> View</Button></div>
          <div className="mt-4"><ShareLink community={community} /></div>
        </Card>
      )}
    </div>
  )
}
