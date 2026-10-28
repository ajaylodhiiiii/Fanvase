'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { API, money, cn } from '@/lib/fanvase'
import { Avatar, FullLoader, KPICard, StatusBadge, Section, EmptyState, Spinner, PageHeader, InlineError, selectClass } from '@/components/fanvase/atoms'
import { DashboardShell } from '@/components/fanvase/shell'
import { LayoutDashboard, Users, Radio, UserPlus, LogOut, DollarSign, Check, Link2, ShieldCheck, Banknote, Clock } from 'lucide-react'

const NAV_GROUPS = [
  { items: [
    { k: 'overview', t: 'Overview', icon: LayoutDashboard },
    { k: 'communities', t: 'Communities', icon: Radio },
    { k: 'members', t: 'Add Members', icon: UserPlus },
  ] },
  { label: 'Finance & people', items: [
    { k: 'payouts', t: 'Payouts', icon: Banknote },
    { k: 'users', t: 'Users', icon: Users },
  ] },
]

export function AdminPanel({ profile, onExit, onLogout }) {
  const [view, setView] = useState('overview')
  return (
    <DashboardShell
      badge="ADMIN"
      groups={NAV_GROUPS}
      view={view}
      setView={setView}
      user={profile}
      onLogoClick={() => setView('overview')}
      footer={[
        { t: 'My dashboard', icon: LayoutDashboard, onClick: onExit },
        { t: 'Log out', icon: LogOut, onClick: onLogout },
      ]}
      topRight={<><span className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground sm:flex"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" /> Admin console</span><Avatar src={profile?.avatar_url} name={profile?.display_name} size={36} /></>}
    >
      {view === 'overview' && <AdminOverview />}
      {view === 'communities' && <AdminCommunities />}
      {view === 'members' && <AdminAddMember />}
      {view === 'payouts' && <AdminPayouts />}
      {view === 'users' && <AdminUsers />}
    </DashboardShell>
  )
}

function AdminOverview() {
  const [d, setD] = useState(null)
  const [failed, setFailed] = useState(false)
  const load = () => { setFailed(false); API.get('/admin/overview').then(setD).catch(() => setFailed(true)) }
  useEffect(load, [])
  if (failed) return <InlineError title="Could not load the overview" onRetry={load} />
  if (!d) return <FullLoader />
  return (
    <div className="space-y-6">
      <PageHeader title="Platform overview" desc="Key numbers across Fanvase." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <KPICard label="Total Users" value={d.users} icon={Users} />
        <KPICard label="Creators" value={d.creators} icon={Radio} accent="purple" />
        <KPICard label="Communities" value={d.communities} icon={Radio} />
        <KPICard label="Pending Communities" value={d.pendingComms} icon={Radio} accent="purple" />
        <KPICard label="Total Members" value={d.members} icon={UserPlus} />
        <KPICard label="Platform Revenue" value={money(d.revenue)} icon={DollarSign} />
      </div>
    </div>
  )
}

function AdminCommunities() {
  const [list, setList] = useState(null)
  const [editing, setEditing] = useState(null)
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState('')
  const [failed, setFailed] = useState(false)
  const load = () => { setFailed(false); API.get('/admin/communities').then(r => setList(r.communities)).catch(() => setFailed(true)) }
  useEffect(() => { load() }, [])
  async function activate(c) { setBusy(c.id); try { await API.post('/admin/update-community', { community_id: c.id, status: c.status === 'active' ? 'pending' : 'active' }); toast.success('Updated'); load() } catch (e) { toast.error(e.message) } finally { setBusy('') } }
  async function activatePlatform(c) { setBusy('p' + c.id); try { await API.post('/admin/activate-platform', { creator_id: c.creator_id }); toast.success('Platform activated'); load() } catch (e) { toast.error(e.message) } finally { setBusy('') } }
  async function saveLink(c) { try { await API.post('/admin/update-community', { community_id: c.id, payment_link: link }); toast.success('Payment link saved'); setEditing(null); load() } catch (e) { toast.error(e.message) } }
  if (failed) return <InlineError title="Could not load communities" onRetry={load} />
  if (list === null) return <FullLoader />
  return (
    <Section title="Communities" desc="Activate channels, set payment links and manage creators.">
      {list.length === 0 ? <EmptyState icon={Radio} title="No communities yet" /> : (
        <div className="space-y-3">{list.map(c => (
          <Card key={c.id} className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar src={c.image_url} name={c.name} size={44} />
              <div className="min-w-0 flex-1"><p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">@{c.creator?.username} &middot; {money(c.price, c.currency)}{c.pricing_type === 'recurring' ? `/${c.billing_period === 'yearly' ? 'yr' : 'mo'}` : ' one-time'} &middot; {c.member_count || 0} members</p></div>
              <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Plan: {c.creator?.platform_plan || 'none'}</span><StatusBadge status={c.creator?.platform_status || 'inactive'} /></div>
              <StatusBadge status={c.status} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <Button size="sm" variant={c.status === 'active' ? 'outline' : 'default'} disabled={busy === c.id} onClick={() => activate(c)}>{busy === c.id ? <Spinner /> : c.status === 'active' ? 'Deactivate' : <><Check className="mr-1 h-3.5 w-3.5" /> Activate channel</>}</Button>
              {c.creator?.platform_status !== 'active' && <Button size="sm" variant="secondary" disabled={busy === 'p' + c.id} onClick={() => activatePlatform(c)}>{busy === 'p' + c.id ? <Spinner /> : 'Activate platform plan'}</Button>}
              {editing === c.id ? (
                <div className="flex flex-1 items-center gap-2"><Input className="h-8" placeholder="https://payment-link..." value={link} onChange={e => setLink(e.target.value)} /><Button size="sm" onClick={() => saveLink(c)}>Save</Button></div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => { setEditing(c.id); setLink(c.payment_link || '') }}><Link2 className="mr-1 h-3.5 w-3.5" /> {c.payment_link ? 'Edit payment link' : 'Set payment link'}</Button>
              )}
            </div>
            {c.payment_link && editing !== c.id && <p className="mt-2 break-all text-xs text-primary">Payment: {c.payment_link}</p>}
          </Card>
        ))}</div>
      )}
    </Section>
  )
}

function AdminAddMember() {
  const [list, setList] = useState([])
  const [community, setCommunity] = useState('')
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { API.get('/admin/communities').then(r => { setList(r.communities); if (r.communities[0]) setCommunity(r.communities[0].id) }).catch(() => {}) }, [])
  async function add() {
    if (!community || !email) return toast.error('Select community and enter user email')
    setBusy(true)
    try { await API.post('/admin/add-member', { community_id: community, user_email: email, plan }); toast.success('Member added & access granted!'); setEmail(''); setPlan('') } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Add member to a channel" desc="After a user pays, manually grant them access to a creator&rsquo;s community." />
      <Card className="max-w-lg p-4 sm:p-6">
        <div className="space-y-4">
          <div><Label>Community / channel</Label><select value={community} onChange={e => setCommunity(e.target.value)} className={`${selectClass} mt-1.5`}>{list.map(c => <option key={c.id} value={c.id}>{c.name} (@{c.creator?.username})</option>)}</select></div>
          <div><Label>User email</Label><Input className="mt-1.5" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@email.com" /></div>
          <div><Label>Plan label (optional)</Label><Input className="mt-1.5" value={plan} onChange={e => setPlan(e.target.value)} placeholder="monthly / one-time" /></div>
          <Button className="w-full font-semibold" onClick={add} disabled={busy}>{busy ? <Spinner className="text-primary-foreground" /> : <><UserPlus className="h-4 w-4" /> Grant access</>}</Button>
        </div>
      </Card>
    </div>
  )
}

function fmtPayout(creator) {
  if (!creator?.payout_method) return 'No payout method set'
  const d = creator.payout_details || {}
  const m = creator.payout_method
  if (m === 'paypal') return `PayPal · ${d.email || ''}`
  if (m === 'upi') return `UPI · ${d.upi_id || ''}`
  if (m === 'cashapp') return `CashApp · ${d.cashapp || ''}`
  if (m === 'bank') return `Bank · A/C ${d.account || ''} · IFSC ${d.ifsc || ''}`
  return m
}

function AdminPayouts() {
  const [list, setList] = useState(null)
  const [busy, setBusy] = useState('')
  const [failed, setFailed] = useState(false)
  const load = () => { setFailed(false); API.get('/admin/payouts').then(r => setList(r.payouts)).catch(() => setFailed(true)) }
  useEffect(() => { load() }, [])
  async function setStatus(p, status) { setBusy(p.id); try { await API.post('/admin/update-payout', { payout_id: p.id, status }); toast.success(`Payout marked ${status}`); load() } catch (e) { toast.error(e.message) } finally { setBusy('') } }
  if (failed) return <InlineError title="Could not load payouts" onRetry={load} />
  if (list === null) return <FullLoader />
  return (
    <Section title="Payouts" desc="Review creator withdrawals and mark them processing or paid.">
      {list.length === 0 ? <EmptyState icon={Banknote} title="No payout requests yet" desc="Creator withdrawals will appear here." /> : (
        <div className="space-y-3">{list.map(p => (
          <Card key={p.id} className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Banknote className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1"><p className="font-semibold">{money(p.amount)} <span className="text-xs font-normal text-muted-foreground">to @{p.creator?.username || 'creator'}</span></p><p className="text-xs text-muted-foreground">{p.creator?.email} · {new Date(p.created_at).toLocaleDateString()}</p></div>
              <StatusBadge status={p.status} />
            </div>
            <div className="mt-3 rounded-xl border border-border bg-background p-3 text-sm"><span className="text-muted-foreground">Send to: </span><span className="font-medium">{fmtPayout(p.creator)}</span></div>
            {p.status !== 'paid' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {p.status === 'pending' && <Button size="sm" variant="secondary" disabled={busy === p.id} onClick={() => setStatus(p, 'processing')}><Clock className="mr-1 h-3.5 w-3.5" /> Mark processing</Button>}
                <Button size="sm" disabled={busy === p.id} onClick={() => setStatus(p, 'paid')}>{busy === p.id ? <Spinner /> : <><Check className="mr-1 h-3.5 w-3.5" /> Mark paid</>}</Button>
              </div>
            )}
          </Card>
        ))}</div>
      )}
    </Section>
  )
}

function AdminUsers() {
  const [users, setUsers] = useState(null)
  const [failed, setFailed] = useState(false)
  const load = () => { setFailed(false); API.get('/admin/users').then(r => setUsers(r.users)).catch(() => setFailed(true)) }
  useEffect(load, [])
  if (failed) return <InlineError title="Could not load users" onRetry={load} />
  if (users === null) return <FullLoader />
  return (
    <Section title={`Users (${users.length})`}>
      <div className="space-y-2">{users.map(u => (
        <Card key={u.id} className="p-3"><div className="flex items-center gap-3"><Avatar src={u.avatar_url} name={u.display_name} size={38} /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{u.display_name} {u.username && <span className="text-muted-foreground">@{u.username}</span>}</p><p className="truncate text-xs text-muted-foreground">{u.email}</p></div><div className="flex items-center gap-2"><span className={cn('rounded-full border px-2 py-0.5 text-xs capitalize', u.role === 'admin' ? 'border-purple-500/30 bg-purple-500/15 text-purple-300' : u.role === 'creator' ? 'border-primary/30 bg-primary/15 text-primary' : 'border-border text-muted-foreground')}>{u.role}</span></div></div></Card>
      ))}</div>
    </Section>
  )
}
