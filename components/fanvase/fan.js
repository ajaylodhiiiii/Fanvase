'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { API, money, timeAgo, cn } from '@/lib/fanvase'
import { Logo, Avatar, EmptyState, FullLoader, Section, StatusBadge, Spinner } from '@/components/fanvase/atoms'
import { DiscoverView, ReferralPanel } from '@/components/fanvase/shared'
import { Users, Compass, Gift, LogOut, Rocket, ArrowLeft, FileText, ImageIcon, LinkIcon, Lock, ExternalLink, Bell } from 'lucide-react'

const TABS = [
  { k: 'communities', t: 'Communities', icon: Users },
  { k: 'discover', t: 'Discover', icon: Compass },
  { k: 'refer', t: 'Refer & Earn', icon: Gift },
]

export function FanApp({ profile, onOpenCommunity, onBecomeCreator, onLogout, onSwitchCreator, startTab = 'communities' }) {
  const [tab, setTab] = useState(startTab)
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Logo size="sm" />
          <nav className="hidden items-center gap-1 md:flex">
            {TABS.map(t => <button key={t.k} onClick={() => setTab(t.k)} className={cn('flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium', tab === t.k ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}><t.icon className="h-4 w-4" /> {t.t}</button>)}
          </nav>
          <div className="flex items-center gap-2">
            {profile?.is_creator ? <Button size="sm" variant="outline" onClick={onSwitchCreator}><Rocket className="mr-1 h-3.5 w-3.5" /> Creator</Button> : <Button size="sm" onClick={onBecomeCreator} className="font-semibold"><Rocket className="mr-1 h-3.5 w-3.5" /> Become a Creator</Button>}
            <Avatar src={profile?.avatar_url} name={profile?.display_name} size={34} />
            <button onClick={onLogout} className="hidden rounded-lg p-2 text-muted-foreground hover:bg-secondary md:block"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-6">
        {tab === 'communities' && <FanCommunities onOpen={onOpenCommunity} onDiscover={() => setTab('discover')} />}
        {tab === 'discover' && <DiscoverView onOpen={onOpenCommunity} />}
        {tab === 'refer' && <ReferralPanel />}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
        {TABS.map(t => <button key={t.k} onClick={() => setTab(t.k)} className={cn('flex flex-col items-center gap-1 py-2.5 text-xs', tab === t.k ? 'text-primary' : 'text-muted-foreground')}><t.icon className="h-5 w-5" /> {t.t}</button>)}
      </nav>
    </div>
  )
}

function FanCommunities({ onOpen, onDiscover }) {
  const [data, setData] = useState(null)
  useEffect(() => { API.get('/fan/communities').then(r => setData(r.communities)).catch(() => setData([])) }, [])
  if (data === null) return <FullLoader label="Loading your communities" />
  return (
    <Section title="Your communities" desc="Communities you've joined.">
      {data.length === 0 ? (
        <EmptyState icon={Users} title="You haven't joined any communities yet" desc="Discover creators and join their communities to unlock exclusive content." action={<Button onClick={onDiscover}><Compass className="mr-1 h-4 w-4" /> Discover communities</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map(({ community: c, membership: m, lastPost }) => (
            <button key={c.id} onClick={() => onOpen(c)} className="overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:border-primary/50">
              <div className="relative h-24 bg-secondary">{c.cover_url ? <img src={c.cover_url} className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-purple-600/20" />}</div>
              <div className="p-4"><div className="-mt-10 mb-2 flex items-end justify-between"><Avatar src={c.image_url} name={c.name} size={48} className="ring-4 ring-card" /><StatusBadge status={m.status} /></div>
                <h3 className="font-semibold">{c.name}</h3><p className="text-xs text-muted-foreground">by @{c.creator?.username} &middot; {m.plan}</p>
                <p className="mt-2 text-xs text-muted-foreground">{lastPost ? `Latest: ${lastPost.title || lastPost.type} \u00b7 ${timeAgo(lastPost.created_at)}` : 'No posts yet'}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </Section>
  )
}

/* ---------- COMMUNITY EXPERIENCE (member feed) ---------- */
export function CommunityExperience({ slug, currentUser, onBack, onJoin, onLogin }) {
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('feed')
  const [joining, setJoining] = useState(false)
  useEffect(() => { API.get(`/community/${slug}`).then(setData).catch(() => setData({ error: true })) }, [slug])
  if (!data) return <div className="min-h-screen bg-background"><FullLoader label="Loading community" /></div>
  if (data.error || !data.community) return <div className="grid min-h-screen place-items-center bg-background"><EmptyState icon={Compass} title="Community not found" action={<Button onClick={onBack}>Go back</Button>} /></div>

  const { community: c, creator, posts, total_posts, is_member } = data
  const typeIcon = { text: FileText, image: ImageIcon, link: LinkIcon, file: FileText }

  async function join() {
    if (!currentUser) { onLogin?.(); return }
    setJoining(true)
    try {
      if (c.payment_link) { window.open(c.payment_link, '_blank'); toast.info('Complete payment. Access is granted once confirmed.') }
      else { toast.info('Payment link not set yet. The creator is still setting up checkout.') }
    } finally { setJoining(false) }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</button>
          <Logo size="sm" />
        </div>
      </header>

      <div className="relative h-48 w-full overflow-hidden bg-secondary md:h-60">{c.cover_url ? <img src={c.cover_url} className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full bg-gradient-to-br from-primary/25 to-purple-700/25" />}<div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" /></div>

      <div className="container -mt-14 relative pb-24">
        <div className="flex flex-wrap items-end gap-4">
          <Avatar src={c.image_url} name={c.name} size={88} className="ring-4 ring-background" />
          <div className="flex-1 pb-1"><h1 className="text-2xl font-bold tracking-tight">{c.name}</h1><p className="text-sm text-muted-foreground">by @{creator?.username} &middot; {c.member_count || 0} members</p></div>
          {is_member ? <span className="flex items-center gap-1 rounded-xl bg-primary/15 px-3 py-2 text-sm font-medium text-primary"><Users className="h-4 w-4" /> Member</span>
            : <Button onClick={join} disabled={joining} className="font-semibold">{joining ? <Spinner className="text-primary-foreground" /> : `Join \u00b7 ${money(c.price, c.currency)}`}</Button>}
        </div>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{c.description}</p>

        <div className="mt-6 flex gap-1 border-b border-border">
          {['feed', 'content', 'members'].map(t => <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-2.5 text-sm font-medium capitalize', tab === t ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground')}>{t}</button>)}
        </div>

        <div className="mt-6 max-w-2xl space-y-4">
          {!is_member && (
            <Card className="border-primary/30 bg-primary/5 p-5"><div className="flex items-center gap-3"><Lock className="h-5 w-5 text-primary" /><div className="flex-1"><p className="font-semibold">Members-only content is locked</p><p className="text-sm text-muted-foreground">Join to unlock all {total_posts} posts, files and links.</p></div><Button size="sm" onClick={join}>Join</Button></div></Card>
          )}
          {posts.length === 0 ? <EmptyState icon={FileText} title="No posts yet" desc="Check back soon for new broadcasts." /> : posts.map(p => {
            const Ic = typeIcon[p.type] || FileText
            return (
              <Card key={p.id} className="border-border bg-card p-5">
                <div className="flex items-center gap-3"><Avatar src={creator?.avatar_url} name={creator?.display_name} size={38} /><div><p className="text-sm font-medium">{creator?.display_name}</p><p className="text-xs text-muted-foreground">{timeAgo(p.created_at)} &middot; <span className="capitalize">{p.visibility}</span></p></div><Ic className="ml-auto h-4 w-4 text-primary" /></div>
                {p.title && <h3 className="mt-3 font-semibold">{p.title}</h3>}
                {p.content && <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{p.content}</p>}
                {p.media_url && p.type === 'image' && <img src={p.media_url} className="mt-3 w-full rounded-xl object-cover" alt="" />}
                {p.type === 'file' && p.media_url && <a href={p.media_url} target="_blank" className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-primary"><FileText className="h-4 w-4" /> Download attachment <ExternalLink className="h-3 w-3" /></a>}
                {p.link_url && <a href={p.link_url} target="_blank" className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-primary"><LinkIcon className="h-4 w-4" /> {p.link_url} <ExternalLink className="h-3 w-3" /></a>}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
