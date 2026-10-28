'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { API, money, timeAgo, cn } from '@/lib/fanvase'
import { Logo, Avatar, EmptyState, FullLoader, Section, StatusBadge, Spinner, InlineError } from '@/components/fanvase/atoms'
import { DiscoverView, ReferralPanel } from '@/components/fanvase/shared'
import { Users, Compass, Gift, LogOut, Rocket, ArrowLeft, FileText, ImageIcon, LinkIcon, Lock, ExternalLink } from 'lucide-react'

const TABS = [
  { k: 'communities', t: 'Communities', icon: Users },
  { k: 'discover', t: 'Discover', icon: Compass },
  { k: 'refer', t: 'Refer & Earn', icon: Gift },
]

export function FanApp({ profile, onOpenCommunity, onBecomeCreator, onLogout, onSwitchCreator, startTab = 'communities' }) {
  const [tab, setTab] = useState(startTab)
  return (
    <div className="min-h-[100dvh] bg-background pb-24 md:pb-0">
      <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between gap-2 sm:h-16">
          <Logo size="sm" />
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {TABS.map(t => <button key={t.k} type="button" aria-current={tab === t.k ? 'page' : undefined} onClick={() => setTab(t.k)} className={cn('flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors', tab === t.k ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}><t.icon className="h-4 w-4" aria-hidden="true" /> {t.t}</button>)}
          </nav>
          <div className="flex items-center gap-2">
            {profile?.is_creator
              ? <Button size="sm" variant="outline" onClick={onSwitchCreator}><Rocket className="h-3.5 w-3.5" /> Creator</Button>
              : <Button size="sm" onClick={onBecomeCreator} className="font-semibold"><Rocket className="h-3.5 w-3.5" /> <span className="sm:hidden">Create</span><span className="hidden sm:inline">Become a Creator</span></Button>}
            <Avatar src={profile?.avatar_url} name={profile?.display_name} size={34} />
            <button type="button" onClick={onLogout} aria-label="Log out" className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-5 sm:py-8">
        {tab === 'communities' && <FanCommunities onOpen={onOpenCommunity} onDiscover={() => setTab('discover')} />}
        {tab === 'discover' && <DiscoverView onOpen={onOpenCommunity} />}
        {tab === 'refer' && <ReferralPanel />}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav aria-label="Primary" className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
        {TABS.map(t => <button key={t.k} type="button" aria-current={tab === t.k ? 'page' : undefined} onClick={() => setTab(t.k)} className={cn('flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors', tab === t.k ? 'text-primary' : 'text-muted-foreground')}><t.icon className="h-5 w-5" aria-hidden="true" /> {t.t}</button>)}
      </nav>
    </div>
  )
}

function FanCommunities({ onOpen, onDiscover }) {
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const load = () => { setFailed(false); API.get('/fan/communities').then(r => setData(r.communities)).catch(() => setFailed(true)) }
  useEffect(load, [])
  if (failed) return <InlineError title="Could not load your communities" onRetry={load} />
  if (data === null) return <FullLoader label="Loading your communities" />
  return (
    <Section title="Your communities" desc="Communities you've joined.">
      {data.length === 0 ? (
        <EmptyState icon={Users} title="You haven't joined any communities yet" desc="Discover creators and join their communities to unlock exclusive content." action={<Button onClick={onDiscover}><Compass className="mr-1 h-4 w-4" /> Discover communities</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.map(({ community: c, membership: m, lastPost }) => (
            <button key={c.id} type="button" onClick={() => onOpen(c)} className="fv-card fv-card-hover overflow-hidden text-left">
              <div className="relative aspect-[16/6] bg-secondary">{c.cover_url ? <img src={c.cover_url} loading="lazy" className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-purple-600/20" />}</div>
              <div className="p-4"><div className="-mt-10 mb-2 flex items-end justify-between"><Avatar src={c.image_url} name={c.name} size={48} className="ring-4 ring-card" /><StatusBadge status={m.status} /></div>
                <h3 className="truncate font-semibold">{c.name}</h3><p className="truncate text-xs text-muted-foreground">by @{c.creator?.username} &middot; {m.plan}</p>
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
  if (!data) return <div className="min-h-[100dvh] bg-background"><FullLoader label="Loading community" /></div>
  if (data.error || !data.community) return <div className="grid min-h-[100dvh] place-items-center bg-background"><EmptyState icon={Compass} title="Community not found" action={<Button onClick={onBack}>Go back</Button>} /></div>

  const { community: c, creator, posts, total_posts, is_member } = data
  const typeIcon = { text: FileText, image: ImageIcon, link: LinkIcon, file: FileText }
  const shown = tab === 'content' ? posts.filter(p => p.type !== 'text') : posts

  async function join() {
    if (!currentUser) { onLogin?.(); return }
    setJoining(true)
    try {
      if (c.payment_link) { window.open(c.payment_link, '_blank'); toast.info('Complete payment. Access is granted once confirmed.') }
      else { toast.info('Payment link not set yet. The creator is still setting up checkout.') }
    } finally { setJoining(false) }
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between sm:h-16">
          <button type="button" onClick={onBack} className="-ml-2 flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back</button>
          <Logo size="sm" />
        </div>
      </header>

      <div className="relative h-40 w-full overflow-hidden bg-secondary sm:h-48 md:h-60">{c.cover_url ? <img src={c.cover_url} className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full bg-gradient-to-br from-primary/25 to-purple-700/25" />}<div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" /></div>

      <div className="container relative -mt-12 pb-24">
        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          <Avatar src={c.image_url} name={c.name} size={80} className="ring-4 ring-background" />
          <div className="min-w-0 flex-1 pb-1"><h1 className="break-words text-xl font-bold tracking-tight sm:text-2xl">{c.name}</h1><p className="text-sm text-muted-foreground">by @{creator?.username} &middot; {c.member_count || 0} members</p></div>
          {is_member ? <span className="flex items-center gap-1 rounded-xl bg-primary/15 px-3 py-2 text-sm font-medium text-primary"><Users className="h-4 w-4" /> Member</span>
            : <Button onClick={join} disabled={joining} className="font-semibold">{joining ? <Spinner className="text-primary-foreground" /> : `Join \u00b7 ${money(c.price, c.currency)}`}</Button>}
        </div>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{c.description}</p>

        <div role="tablist" aria-label="Community sections" className="no-scrollbar mt-6 flex gap-1 overflow-x-auto border-b border-border">
          {[['feed', 'Feed'], ['content', 'Files & links'], ['members', 'About']].map(([t, l]) => <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn('min-h-11 shrink-0 border-b-2 px-4 text-sm font-medium transition-colors', tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>{l}</button>)}
        </div>

        <div className="mt-6 max-w-2xl space-y-4">
          {!is_member && (
            <Card className="border-primary/30 bg-primary/5 p-4 sm:p-5"><div className="flex items-center gap-3"><Lock className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="font-semibold">Members-only content is locked</p><p className="text-sm text-muted-foreground">Join to unlock all {total_posts} posts, files and links.</p></div><Button size="sm" onClick={join}>Join</Button></div></Card>
          )}
          {tab === 'members' ? (
            <Card className="p-5">
              <div className="flex items-center gap-3"><Avatar src={creator?.avatar_url} name={creator?.display_name} size={48} /><div className="min-w-0"><p className="truncate font-semibold">{creator?.display_name}</p><p className="truncate text-xs text-muted-foreground">@{creator?.username}{creator?.country ? ` · ${creator.country}` : ''}</p></div></div>
              {creator?.bio && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{creator.bio}</p>}
              <p className="mt-4 flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-primary" aria-hidden="true" /> {c.member_count || 0} {(c.member_count || 0) === 1 ? 'member' : 'members'}</p>
            </Card>
          ) : shown.length === 0 ? <EmptyState icon={FileText} title={tab === 'content' ? 'No files or links yet' : 'No posts yet'} desc="Check back soon for new broadcasts." /> : shown.map(p => {
            const Ic = typeIcon[p.type] || FileText
            return (
              <Card key={p.id} className="p-4 sm:p-5">
                <div className="flex items-center gap-3"><Avatar src={creator?.avatar_url} name={creator?.display_name} size={38} /><div><p className="text-sm font-medium">{creator?.display_name}</p><p className="text-xs text-muted-foreground">{timeAgo(p.created_at)} &middot; <span className="capitalize">{p.visibility}</span></p></div><Ic className="ml-auto h-4 w-4 text-primary" /></div>
                {p.title && <h3 className="mt-3 font-semibold">{p.title}</h3>}
                {p.content && <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{p.content}</p>}
                {p.media_url && p.type === 'image' && <img src={p.media_url} loading="lazy" className="mt-3 w-full rounded-xl border border-border object-cover" alt="" />}
                {p.type === 'file' && p.media_url && <a href={p.media_url} target="_blank" className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-primary"><FileText className="h-4 w-4" /> Download attachment <ExternalLink className="h-3 w-3" /></a>}
                {p.link_url && <a href={p.link_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-primary"><LinkIcon className="h-4 w-4 shrink-0" /> <span className="truncate">{p.link_url}</span> <ExternalLink className="h-3 w-3 shrink-0" /></a>}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
