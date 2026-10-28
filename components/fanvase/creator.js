'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { toast } from 'sonner'
import { API, money, timeAgo, cn } from '@/lib/fanvase'
import { RATE_NOTE } from '@/lib/currency'
import {
  Avatar, Spinner, StatusBadge, KPICard, EmptyState, Section, PageHeader, Segmented, ListRow,
  InlineError, DashboardSkeleton, FullLoader, selectClass,
} from '@/components/fanvase/atoms'
import { DashboardShell } from '@/components/fanvase/shell'
import { ReferralPanel } from '@/components/fanvase/shared'
import {
  LayoutDashboard, FileText, Users, CreditCard, Wallet, Gift, BarChart3, Settings,
  Plus, Bell, TrendingUp, Repeat, Copy, ExternalLink, Check, ImageIcon, LinkIcon, Trash2,
  Rocket, ArrowUpRight, UserCircle, Banknote, LogOut, Search, DollarSign, Lock, Zap,
} from 'lucide-react'

/* ---------- navigation ---------- */
const NAV_GROUPS = [
  { items: [
    { k: 'overview', t: 'Overview', icon: LayoutDashboard },
    { k: 'content', t: 'Content', icon: FileText },
    { k: 'members', t: 'Members', icon: Users },
  ] },
  { label: 'Business', items: [
    { k: 'plans', t: 'Manage Plans', icon: CreditCard },
    { k: 'earnings', t: 'Payout', icon: Wallet },
    { k: 'referrals', t: 'Referrals', icon: Gift },
    { k: 'analytics', t: 'Analytics', icon: BarChart3 },
  ] },
  { label: 'Account', items: [
    { k: 'settings', t: 'Settings', icon: Settings },
  ] },
]

/* ---------- chart theme (matches design tokens) ---------- */
const CHART = {
  grid: 'hsl(200 8% 14%)',
  tick: 'hsl(200 7% 64%)',
  lime: 'hsl(83 77% 55%)',
  purple: 'hsl(268 70% 66%)',
  tooltip: { background: 'hsl(200 12% 7.5%)', border: '1px solid hsl(200 8% 18%)', borderRadius: 12, color: '#fff', fontSize: 12 },
}

function RevenueChart({ data, color = CHART.lime, id, height = 256 }) {
  const hasData = (data || []).some(d => Number(d.value) > 0)
  if (!hasData) {
    return (
      <div style={{ height }} className="grid place-items-center rounded-xl border border-dashed border-border text-center">
        <div><TrendingUp className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" /><p className="mt-2 text-sm font-medium">No revenue in this period</p><p className="text-xs text-muted-foreground">Earnings from new members will show up here.</p></div>
      </div>
    )
  }
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.35} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="date" tick={{ fill: CHART.tick, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={28} />
          <YAxis tick={{ fill: CHART.tick, fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={v => `$${v}`} />
          <Tooltip contentStyle={CHART.tooltip} formatter={v => [money(v), 'Revenue']} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${id})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ---------- dashboard shell ---------- */
export function CreatorDashboard({ profile, communities: initComms, balance, onNavPublic, onLogout, onSwitchFan, onReload }) {
  const [view, setView] = useState('overview')
  const [comms] = useState(initComms || [])
  const community = comms[0]
  const pending = !community || community.status !== 'active' || profile?.platform_status !== 'active'

  const banner = pending && view !== 'plans' ? (
    <button type="button" onClick={() => setView('plans')} className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-left transition-colors hover:bg-amber-500/10">
      <div aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-300"><Rocket className="h-4 w-4" /></div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-200">Activate your channel</p>
        <p className="text-xs text-muted-foreground">Subscribe to a platform plan to go live and accept members.</p>
      </div>
      <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-300" />
    </button>
  ) : null

  return (
    <DashboardShell
      groups={NAV_GROUPS}
      view={view}
      setView={setView}
      user={profile}
      onLogoClick={() => setView('overview')}
      footer={[
        { t: 'Switch to Fan', icon: UserCircle, onClick: onSwitchFan },
        { t: 'Log out', icon: LogOut, onClick: onLogout },
      ]}
      topRight={
        <>
          <Button size="sm" onClick={() => setView('content')} className="font-semibold"><Plus className="h-4 w-4" /> Create</Button>
          <button type="button" onClick={() => setView('overview')} aria-label="Notifications and activity" className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground"><Bell className="h-4 w-4" /></button>
          <Avatar src={profile?.avatar_url} name={profile?.display_name} size={36} className="hidden sm:grid" />
        </>
      }
      banner={banner}
    >
      {view === 'overview' && <Overview profile={profile} community={community} />}
      {view === 'content' && <Content comms={comms} />}
      {view === 'members' && <Members />}
      {view === 'plans' && <Plans profile={profile} />}
      {view === 'earnings' && <Earnings profile={profile} />}
      {view === 'referrals' && <ReferralPanel />}
      {view === 'analytics' && <Analytics />}
      {view === 'settings' && <SettingsView profile={profile} community={community} onNavPublic={onNavPublic} />}
    </DashboardShell>
  )
}

function ShareLink({ community }) {
  if (!community) return null
  const host = typeof window !== 'undefined' ? window.location.host : 'fanvase.online'
  const link = typeof window !== 'undefined' ? `${window.location.origin}/c/${community.slug}` : ''
  return (
    <div className="flex min-w-0 max-w-full items-center gap-1 rounded-xl border border-border bg-card p-1.5 pl-3">
      <span className="truncate text-xs text-muted-foreground">{host}/c/{community.slug}</span>
      <Button size="sm" variant="secondary" aria-label="Copy community link" onClick={() => { navigator.clipboard.writeText(link); toast.success('Link copied') }}><Copy className="h-3.5 w-3.5" /> Copy</Button>
    </div>
  )
}

/* ---------- OVERVIEW ---------- */
function Overview({ profile, community }) {
  const [range, setRange] = useState(30)
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const load = () => { setData(null); setFailed(false); API.get(`/creator/overview?range=${range}`).then(setData).catch(() => setFailed(true)) }
  useEffect(load, [range])
  if (failed) return <InlineError title="Could not load your dashboard" onRetry={load} />
  if (!data) return <DashboardSkeleton />
  const k = data.kpis
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${profile?.display_name?.split(' ')[0] || 'creator'}`}
        desc={`Here's how ${community?.name || 'your community'} is doing.`}
        actions={<ShareLink community={community} />}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <KPICard label="Total Members" value={k.totalMembers} icon={Users} />
        <KPICard label="Total Revenue" value={money(k.totalRevenue)} icon={DollarSign} />
        <KPICard label="MRR" value={money(k.mrr)} icon={Repeat} accent="purple" />
        <KPICard label="New Members" value={k.newMembers} icon={TrendingUp} />
        <KPICard label="Active Members" value={k.activeMembers} icon={Users} />
        <KPICard label="Referral Earnings" value={money(k.referralEarnings)} icon={Gift} accent="purple" />
      </div>

      <div className="fv-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Revenue over time</h2>
          <Segmented label="Time range" value={range} onChange={setRange} options={[[7, '7d'], [30, '30d'], [90, '3m'], [180, '6m'], [365, '1y']]} />
        </div>
        <RevenueChart data={data.series} id="rev-overview" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Recent activity">
          {data.activity.length === 0 ? <EmptyState icon={Bell} title="No activity yet" desc="Actions will appear here." /> : (
            <div className="space-y-2">{data.activity.map(a => (
              <ListRow key={a.id}
                leading={<div aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Bell className="h-4 w-4" /></div>}
                title={a.title} sub={a.body}
                trailing={<span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>} />
            ))}</div>
          )}
        </Section>
        <Section title="Recent members">
          {data.recentMembers.length === 0 ? <EmptyState icon={Users} title="No members yet" desc="Share your community link to get your first member." /> : (
            <div className="space-y-2">{data.recentMembers.map(m => (
              <ListRow key={m.id}
                leading={<Avatar src={m.profile?.avatar_url} name={m.profile?.display_name} size={36} />}
                title={m.profile?.display_name || 'Member'} sub={<>{m.plan} &middot; {timeAgo(m.joined_at)}</>}
                trailing={<StatusBadge status={m.status} />} />
            ))}</div>
          )}
        </Section>
      </div>
    </div>
  )
}

/* ---------- CONTENT ---------- */
const TYPE_ICON = { text: FileText, image: ImageIcon, file: FileText, link: LinkIcon }

function Content({ comms }) {
  const [posts, setPosts] = useState(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const load = () => { setFailed(false); API.get('/creator/posts').then(r => setPosts(r.posts)).catch(() => setFailed(true)) }
  useEffect(load, [])
  async function del(id) { try { await API.del(`/posts/${id}`); toast.success('Deleted'); load() } catch (e) { toast.error(e.message) } }
  const create = <Button onClick={() => setOpen(true)} className="font-semibold"><Plus className="h-4 w-4" /> Create Post</Button>
  return (
    <div className="space-y-6">
      <PageHeader title="Content" desc="Broadcast posts to your members." actions={create} />
      {failed ? <InlineError title="Could not load your posts" onRetry={load} /> : posts === null ? <FullLoader label="Loading posts" /> : posts.length === 0 ? (
        <EmptyState icon={FileText} title="No posts yet" desc="Publish your first broadcast to engage members." action={create} />
      ) : (
        <div className="space-y-3">{posts.map(p => {
          const Ic = TYPE_ICON[p.type] || FileText
          return (
            <article key={p.id} className="fv-card p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><Ic className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <StatusBadge status={p.status} />
                    <span className="inline-flex items-center gap-1 capitalize">{p.visibility === 'members' && <Lock className="h-3 w-3" aria-hidden="true" />}{p.visibility}</span>
                    {p.community?.name && <span>&middot; {p.community.name}</span>}
                    <span>&middot; {timeAgo(p.created_at)}</span>
                  </div>
                  {p.title && <h3 className="mt-2 text-[15px] font-semibold leading-snug">{p.title}</h3>}
                  {p.content && <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{p.content}</p>}
                  {p.media_url && p.type === 'image' && <img src={p.media_url} alt="" loading="lazy" className="mt-3 aspect-video w-full max-w-sm rounded-xl border border-border object-cover" />}
                  {p.media_url && p.type === 'file' && <a href={p.media_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline"><FileText className="h-4 w-4" /> View attachment</a>}
                  {p.link_url && <a href={p.link_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex max-w-full items-center gap-1.5 text-sm text-primary hover:underline"><LinkIcon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{p.link_url}</span></a>}
                </div>
                <button type="button" onClick={() => setToDelete(p)} aria-label="Delete post" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </article>
          )
        })}</div>
      )}
      <CreatePostDialog open={open} setOpen={setOpen} comms={comms} onCreated={load} />
      <AlertDialog open={!!toDelete} onOpenChange={o => { if (!o) setToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>{toDelete?.title ? `"${toDelete.title}" will be permanently removed.` : 'This post will be permanently removed.'} This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { const id = toDelete?.id; setToDelete(null); if (id) del(id) }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const types = [{ k: 'text', t: 'Text', icon: FileText }, { k: 'image', t: 'Image', icon: ImageIcon }, { k: 'file', t: 'File', icon: FileText }, { k: 'link', t: 'Link', icon: LinkIcon }]
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create post</DialogTitle><DialogDescription>Share an update with your community.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div role="group" aria-label="Post type" className="grid grid-cols-4 gap-2">
            {types.map(t => (
              <button key={t.k} type="button" aria-pressed={type === t.k} onClick={() => { setType(t.k); setMedia('') }} className={cn('flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-medium transition-colors', type === t.k ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                <t.icon className="h-4 w-4" aria-hidden="true" /> {t.t}
              </button>
            ))}
          </div>
          {comms.length > 1 && (
            <div><Label htmlFor="post-community">Community</Label><select id="post-community" value={community} onChange={e => setCommunity(e.target.value)} className={cn(selectClass, 'mt-1.5')}>{comms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          )}
          <div><Label htmlFor="post-title">Title</Label><Input id="post-title" className="mt-1.5" placeholder="Give your post a title" value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><Label htmlFor="post-body">Message</Label><Textarea id="post-body" className="mt-1.5" rows={4} placeholder="Write something..." value={content} onChange={e => setContent(e.target.value)} /></div>
          {(type === 'image' || type === 'file') && (
            <div>
              <Label>{type === 'file' ? 'Attachment (PDF, max 2MB)' : 'Image (max 10MB)'}</Label>
              <label className="mt-1.5 flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input bg-background/50 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                {uploading ? <Spinner className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" aria-hidden="true" />}{media ? 'Replace file' : 'Choose a file'}
                <input type="file" className="sr-only" accept={type === 'file' ? 'application/pdf' : 'image/*'} onChange={e => upload(e, type === 'file' ? 'files' : 'media')} />
              </label>
              {media && type === 'image' && <img src={media} alt="Upload preview" className="mt-2 aspect-video w-full rounded-xl border border-border object-cover" />}
              {media && type === 'file' && <p className="mt-1.5 truncate text-xs text-primary">{media}</p>}
            </div>
          )}
          {type === 'link' && <div><Label htmlFor="post-link">Link</Label><Input id="post-link" className="mt-1.5" placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} /></div>}
          <div>
            <Label>Who can see this</Label>
            <div role="group" aria-label="Visibility" className="mt-1.5 grid grid-cols-2 gap-2">
              {[['public', 'Public', 'Anyone'], ['members', 'Members', 'Paid members only']].map(([v, l, d]) => (
                <button key={v} type="button" aria-pressed={visibility === v} onClick={() => setVisibility(v)} className={cn('rounded-xl border p-2.5 text-left transition-colors', visibility === v ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40')}>
                  <p className={cn('text-sm font-medium', visibility === v && 'text-primary')}>{l}</p><p className="text-xs text-muted-foreground">{d}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
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
  const [failed, setFailed] = useState(false)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const load = () => { setFailed(false); API.get('/creator/members').then(r => setMembers(r.members)).catch(() => setFailed(true)) }
  useEffect(load, [])
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return (members || []).filter(m => (status === 'all' || m.status === status) && (!ql
      || m.profile?.display_name?.toLowerCase().includes(ql)
      || m.profile?.email?.toLowerCase().includes(ql)
      || m.profile?.username?.toLowerCase().includes(ql)))
  }, [members, q, status])

  if (failed) return <InlineError title="Could not load members" onRetry={load} />
  if (members === null) return <FullLoader label="Loading members" />
  return (
    <div className="space-y-6">
      <PageHeader title="Members" desc={`${members.length} ${members.length === 1 ? 'member' : 'members'} across your communities.`} />
      {members.length === 0 ? <EmptyState icon={Users} title="No members yet" desc="Members appear here once they join." /> : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:max-w-xs sm:flex-1">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search members" className="pl-9" placeholder="Search name or email" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <Segmented label="Filter by status" value={status} onChange={setStatus} options={[['all', 'All'], ['active', 'Active'], ['expired', 'Expired'], ['cancelled', 'Cancelled']]} />
          </div>
          {list.length === 0 ? <EmptyState icon={Search} title="No matching members" desc="Try a different search or filter." /> : (
            <>
              <div className="fv-card hidden overflow-hidden md:block">
                <Table>
                  <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Member</TableHead><TableHead>Community</TableHead><TableHead>Plan</TableHead><TableHead>Joined</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>{list.map(m => (
                    <TableRow key={m.id} className="border-border">
                      <TableCell><div className="flex items-center gap-3"><Avatar src={m.profile?.avatar_url} name={m.profile?.display_name} size={34} /><div className="min-w-0"><p className="truncate text-sm font-medium">{m.profile?.display_name}</p><p className="truncate text-xs text-muted-foreground">{m.profile?.email}</p></div></div></TableCell>
                      <TableCell className="text-sm">{m.community?.name}</TableCell>
                      <TableCell className="text-sm capitalize">{m.plan}</TableCell>
                      <TableCell className="text-sm text-muted-foreground" title={new Date(m.joined_at).toLocaleString()}>{timeAgo(m.joined_at)}</TableCell>
                      <TableCell><StatusBadge status={m.status} /></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </div>
              <div className="space-y-2 md:hidden">{list.map(m => (
                <ListRow key={m.id}
                  leading={<Avatar src={m.profile?.avatar_url} name={m.profile?.display_name} size={40} />}
                  title={m.profile?.display_name}
                  sub={<>{m.community?.name} &middot; <span className="capitalize">{m.plan}</span> &middot; {timeAgo(m.joined_at)}</>}
                  trailing={<StatusBadge status={m.status} />} />
              ))}</div>
            </>
          )}
        </>
      )}
    </div>
  )
}

/* ---------- PLANS ---------- */
// Prices and feature lists are unchanged from the previous version of this page.
const PLANS = [
  { k: 'basic', name: 'Basic', price: 5, blurb: 'Everything you need to launch your community.', benefits: ['1 active community', 'Unlimited posts', 'Up to 500 members', 'Standard support', '10% platform fee'] },
  { k: 'pro', name: 'Pro', price: 20, blurb: 'More room to grow your business.', benefits: ['Unlimited communities', 'Unlimited posts & members', 'Priority support', 'Advanced analytics', 'Lower platform fee', 'Custom branding'] },
]

function Plans({ profile }) {
  const [busy, setBusy] = useState('')
  const status = profile?.platform_status
  const current = profile?.platform_plan
  const hasActive = status === 'active'

  async function subscribe(k) {
    setBusy(k)
    try {
      // The server creates a Dodo Payments checkout session; we send the creator to it.
      // After paying, Dodo redirects to /subscribed.
      const { checkout_url } = await API.post('/platform/subscribe', { plan: k })
      if (!checkout_url) throw new Error('Could not start checkout. Please try again.')
      window.location.href = checkout_url
    } catch (e) { toast.error(e.message); setBusy('') }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Plans" desc="Choose the platform plan that powers your channel." />

      {status === 'pending' && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
          <div aria-hidden="true" className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-300"><Zap className="h-4 w-4" /></div>
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-amber-200">Your <span className="capitalize">{current}</span> plan is pending activation</p>
            <p className="mt-0.5 text-muted-foreground">Once your payment is received your channel goes live, usually within 1 hour. We&rsquo;ll notify you.</p>
          </div>
        </div>
      )}
      {hasActive && (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-sm">
          <div aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><Check className="h-4 w-4" /></div>
          <p>You&rsquo;re on the <b className="capitalize">{current}</b> plan.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {PLANS.map(p => {
          const isCurrent = hasActive && current === p.k
          const isPendingPlan = status === 'pending' && current === p.k
          const popular = p.k === 'pro'
          const label = isCurrent ? 'Current plan'
            : isPendingPlan ? 'Complete payment'
            : hasActive && p.k === 'pro' ? 'Upgrade to Pro'
            : `Choose ${p.name}`
          return (
            <article key={p.k} className={cn('relative flex flex-col rounded-2xl border bg-card p-5 sm:p-7', popular ? 'border-primary/40' : 'border-border', isCurrent && 'ring-1 ring-primary/50')}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{p.name}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{p.blurb}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {isCurrent && <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground"><Check className="h-3 w-3" aria-hidden="true" /> Current plan</span>}
                  {isPendingPlan && <StatusBadge status="pending" />}
                  {popular && !isCurrent && <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">Popular</span>}
                </div>
              </div>

              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">{money(p.price)}</span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </div>

              <div className="my-5 h-px bg-border" />

              <ul className="flex-1 space-y-3 text-sm">
                {p.benefits.map(b => (
                  <li key={b} className="flex items-start gap-3">
                    <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Check className="h-3 w-3" /></span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-7 h-11 w-full text-sm font-semibold"
                variant={popular && !isCurrent ? 'default' : 'outline'}
                disabled={!!busy || isCurrent}
                aria-busy={busy === p.k}
                onClick={() => subscribe(p.k)}
              >
                {busy === p.k ? <Spinner className={popular ? 'text-primary-foreground' : ''} /> : label}
              </Button>
            </article>
          )
        })}
      </div>

      <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card/50 p-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" /> Secure checkout powered by Dodo Payments.</p>
        <p>Your channel is activated within 1 hour of payment. Platform fees are deducted from member payments before they reach your balance.</p>
      </div>
    </div>
  )
}

/* ---------- EARNINGS / PAYOUT ---------- */
function Earnings({ profile }) {
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const load = () => { setFailed(false); API.get('/creator/earnings').then(setData).catch(() => setFailed(true)) }
  useEffect(load, [])
  if (failed) return <InlineError title="Could not load your earnings" onRetry={load} />
  if (!data) return <DashboardSkeleton />
  const b = data.balance || {}
  const method = data.payout_method
  const det = data.payout_details || {}
  const methodLabel = { paypal: 'PayPal', upi: 'UPI', cashapp: 'CashApp', bank: 'Bank account' }[method] || 'Not set'
  const methodValue = method === 'paypal' ? det.email : method === 'upi' ? det.upi_id : method === 'cashapp' ? det.cashapp : method === 'bank' ? `${det.account} · ${det.ifsc}` : ''
  async function withdraw() {
    setBusy(true)
    try { await API.post('/creator/withdraw', {}); toast.success('Withdrawal requested! We are processing it.'); load() }
    catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payout"
        desc="Track your revenue and withdraw your balance."
        note={<p className="mt-2 inline-flex items-center rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{RATE_NOTE}</p>}
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KPICard label="Available balance" value={money(b.available)} icon={DollarSign} />
        <KPICard label="Pending payout" value={money(b.pending)} icon={Wallet} accent="purple" />
        <KPICard label="Total earned" value={money(b.total_earned)} icon={TrendingUp} />
        <KPICard label="Referral payouts" value={money(b.referral_earned)} icon={Gift} accent="purple" />
      </div>

      <div className="fv-card p-4 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Wallet className="h-5 w-5" /></div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Payout method</p>
              <p className="truncate font-semibold">{methodLabel}{methodValue ? ` · ${methodValue}` : ''}</p>
              <button type="button" onClick={() => setEditOpen(true)} className="mt-0.5 rounded text-xs font-medium text-primary hover:underline">{method ? 'Edit method' : 'Add payout method'}</button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <div className="sm:text-right"><p className="text-xs text-muted-foreground">Available to withdraw</p><p className="text-xl font-semibold tabular-nums text-primary">{money(b.available)}</p></div>
            <Button onClick={withdraw} disabled={busy || Number(b.available) <= 0} className="font-semibold">{busy ? <Spinner className="text-primary-foreground" /> : <><Banknote className="h-4 w-4" /> Withdraw</>}</Button>
          </div>
        </div>
        {!method && <p className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">No payout method set yet. Add one to enable withdrawals.</p>}
        <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">Exchange rate: <span className="font-semibold text-foreground">{RATE_NOTE}</span>. Balances are in USD; sales priced in &#8377; are converted at this rate.</p>
      </div>

      <PayoutMethodDialog open={editOpen} setOpen={setEditOpen} profile={profile} current={{ method, det }} onSaved={load} />

      {(data.payouts && data.payouts.length > 0) && (
        <Section title="Payout history">
          <div className="space-y-2">{data.payouts.map(p => (
            <ListRow key={p.id}
              leading={<div aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><Banknote className="h-4 w-4" /></div>}
              title="Withdrawal" sub={new Date(p.created_at).toLocaleDateString()}
              trailing={<div className="flex items-center gap-3"><StatusBadge status={p.status} /><span className="font-semibold tabular-nums text-primary">{money(p.amount)}</span></div>} />
          ))}</div>
        </Section>
      )}

      <Section title="Transaction history">
        {(!data.transactions || data.transactions.length === 0) ? <EmptyState icon={DollarSign} title="No transactions yet" desc="Earnings appear here when members join." /> : (
          <>
            <div className="fv-card hidden overflow-hidden md:block">
              <Table>
                <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Date</TableHead><TableHead>Member</TableHead><TableHead>Community</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                <TableBody>{data.transactions.map(t => (
                  <TableRow key={t.id} className="border-border">
                    <TableCell className="text-sm text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{t.member?.display_name || '—'}</TableCell>
                    <TableCell className="text-sm">{t.community?.name || '—'}</TableCell>
                    <TableCell className="text-sm capitalize">{t.type}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-primary">{money(t.amount, t.currency)}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </div>
            <div className="space-y-2 md:hidden">{data.transactions.map(t => (
              <ListRow key={t.id}
                leading={<div aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><DollarSign className="h-4 w-4" /></div>}
                title={<span className="capitalize">{t.type}</span>}
                sub={<>{t.member?.display_name || t.description} &middot; {new Date(t.created_at).toLocaleDateString()}</>}
                trailing={<span className="font-semibold tabular-nums text-primary">{money(t.amount, t.currency)}</span>} />
            ))}</div>
          </>
        )}
      </Section>
    </div>
  )
}

function PayoutMethodDialog({ open, setOpen, profile, current, onSaved }) {
  const isIndia = profile?.country === 'India'
  const options = isIndia ? [['upi', 'UPI'], ['paypal', 'PayPal'], ['bank', 'Bank account']] : [['paypal', 'PayPal'], ['cashapp', 'CashApp']]
  const [method, setMethod] = useState(current?.method || (isIndia ? 'upi' : 'paypal'))
  const [paypal, setPaypal] = useState('')
  const [upi, setUpi] = useState('')
  const [cashapp, setCashapp] = useState('')
  const [acc, setAcc] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (open) {
      const d = current?.det || {}
      setMethod(current?.method || (isIndia ? 'upi' : 'paypal'))
      setPaypal(d.email || ''); setUpi(d.upi_id || ''); setCashapp(d.cashapp || ''); setAcc(d.account || ''); setIfsc(d.ifsc || '')
    }
  }, [open])
  async function save() {
    let details = {}
    if (method === 'paypal') { if (!paypal) return toast.error('Enter PayPal email'); details = { email: paypal } }
    else if (method === 'upi') { if (!upi) return toast.error('Enter UPI ID'); details = { upi_id: upi } }
    else if (method === 'cashapp') { if (!cashapp) return toast.error('Enter CashApp email/tag'); details = { cashapp } }
    else if (method === 'bank') { if (!acc || !ifsc) return toast.error('Enter account number & IFSC'); details = { account: acc, ifsc } }
    setBusy(true)
    try { await API.post('/creator/payout-method', { method, details }); toast.success('Payout method updated'); setOpen(false); onSaved?.() }
    catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Payout method</DialogTitle><DialogDescription>Where should we send your withdrawals?</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div role="group" aria-label="Payout method" className="flex flex-wrap gap-2">{options.map(([k, l]) => <button key={k} type="button" aria-pressed={method === k} onClick={() => setMethod(k)} className={cn('min-h-10 rounded-xl border px-4 text-sm font-medium transition-colors', method === k ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>{l}</button>)}</div>
          {method === 'paypal' && <div><Label htmlFor="pm-paypal">PayPal email</Label><Input id="pm-paypal" className="mt-1.5" value={paypal} onChange={e => setPaypal(e.target.value)} placeholder="you@email.com" /></div>}
          {method === 'upi' && <div><Label htmlFor="pm-upi">UPI ID</Label><Input id="pm-upi" className="mt-1.5" value={upi} onChange={e => setUpi(e.target.value)} placeholder="name@bank" /></div>}
          {method === 'cashapp' && <div><Label htmlFor="pm-cash">CashApp email / $tag</Label><Input id="pm-cash" className="mt-1.5" value={cashapp} onChange={e => setCashapp(e.target.value)} placeholder="$yourtag" /></div>}
          {method === 'bank' && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><Label htmlFor="pm-acc">Account number</Label><Input id="pm-acc" inputMode="numeric" className="mt-1.5" value={acc} onChange={e => setAcc(e.target.value)} /></div><div><Label htmlFor="pm-ifsc">IFSC</Label><Input id="pm-ifsc" className="mt-1.5" value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())} /></div></div>}
        </div>
        <DialogFooter><Button onClick={save} disabled={busy} className="w-full font-semibold sm:w-auto">{busy ? <Spinner className="text-primary-foreground" /> : 'Save method'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- ANALYTICS ---------- */
function Analytics() {
  const [range, setRange] = useState(90)
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const load = () => { setData(null); setFailed(false); API.get(`/creator/overview?range=${range}`).then(setData).catch(() => setFailed(true)) }
  useEffect(load, [range])
  if (failed) return <InlineError title="Could not load analytics" onRetry={load} />
  if (!data) return <DashboardSkeleton />
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" desc="Deep dive into your community performance."
        actions={<Segmented label="Time range" value={range} onChange={setRange} options={[[30, '30d'], [90, '3m'], [180, '6m'], [365, '1y']]} />} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KPICard label="Members" value={data.kpis.totalMembers} icon={Users} />
        <KPICard label="Active" value={data.kpis.activeMembers} icon={Users} />
        <KPICard label="Revenue" value={money(data.kpis.totalRevenue)} icon={DollarSign} />
        <KPICard label="MRR" value={money(data.kpis.mrr)} icon={Repeat} accent="purple" />
      </div>
      <div className="fv-card p-4 sm:p-5">
        <h2 className="mb-4 text-base font-semibold">Revenue trend</h2>
        <RevenueChart data={data.series} color={CHART.purple} id="rev-analytics" height={288} />
      </div>
    </div>
  )
}

/* ---------- SETTINGS ---------- */
function SettingsView({ profile, community, onNavPublic }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" desc="Manage your creator profile." />
      <div className="fv-card p-4 sm:p-6">
        <h2 className="fv-eyebrow mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          <Avatar src={profile?.avatar_url} name={profile?.display_name} size={64} />
          <div className="min-w-0"><p className="truncate text-lg font-semibold">{profile?.display_name}</p><p className="truncate text-sm text-muted-foreground">@{profile?.username} &middot; {profile?.email}</p></div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{profile?.bio || 'No bio yet.'}</p>
      </div>
      {community && (
        <div className="fv-card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="fv-eyebrow">Your community</h2><StatusBadge status={community.status} /></div>
          <div className="flex flex-wrap items-center gap-3">
            <Avatar src={community.image_url} name={community.name} size={48} />
            <div className="min-w-0 flex-1"><p className="truncate font-medium">{community.name}</p><p className="text-xs text-muted-foreground">{money(community.price, community.currency)}{community.pricing_type === 'recurring' ? `/${community.billing_period === 'yearly' ? 'yr' : 'mo'}` : ' one-time'}</p></div>
            <Button size="sm" variant="outline" onClick={() => onNavPublic?.(community)}><ExternalLink className="h-3.5 w-3.5" /> View</Button>
          </div>
          <div className="mt-4"><ShareLink community={community} /></div>
        </div>
      )}
    </div>
  )
}
