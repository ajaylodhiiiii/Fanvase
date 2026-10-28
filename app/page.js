'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, API } from '@/lib/fanvase'
import { FullLoader } from '@/components/fanvase/atoms'
import { Landing, AuthView } from '@/components/fanvase/public'
import { CreatorOnboarding } from '@/components/fanvase/onboarding'
import { CreatorDashboard } from '@/components/fanvase/creator'
import { FanApp, CommunityExperience } from '@/components/fanvase/fan'
import { AdminPanel } from '@/components/fanvase/admin'
import { DiscoverView } from '@/components/fanvase/shared'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/fanvase/atoms'

function App() {
  const [booting, setBooting] = useState(true)
  const [session, setSession] = useState(null)
  const [me, setMe] = useState(null)
  const [screen, setScreen] = useState('landing') // landing | auth | discover | onboarding | app | community
  const [authMode, setAuthMode] = useState('signup')
  const [authRole, setAuthRole] = useState('creator')
  const [appMode, setAppMode] = useState('fan') // fan | creator | admin
  const [fanTab, setFanTab] = useState('communities')
  const [activeSlug, setActiveSlug] = useState(null)
  const [refCode, setRefCode] = useState(null)

  const loadMe = useCallback(async () => {
    try { const data = await API.get('/me'); setMe(data); return data } catch (e) { return null }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) { setRefCode(ref); API.post('/track-click', { code: ref }).catch(() => {}) }
    const auth = params.get('auth')
    if (auth === 'login') { setScreen('auth'); setAuthMode('login') }
    if (auth === 'signup') { setScreen('auth'); setAuthMode('signup') }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) { const m = await loadMe(); routeAfterAuth(m) }
      setBooting(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'SIGNED_OUT') { setMe(null); setScreen('landing') }
    })
    return () => sub.subscription.unsubscribe()
  }, [loadMe])

  function routeAfterAuth(m) {
    if (!m?.profile) return
    const p = m.profile
    if (p.role === 'admin') { setAppMode('admin'); setScreen('app'); return }
    if (p.is_creator && (m.communities?.length || 0) === 0 && !p.username) { setScreen('onboarding'); return }
    if (p.is_creator && (m.communities?.length || 0) > 0) { setAppMode('creator'); setScreen('app'); return }
    setAppMode('fan'); setScreen('app')
  }

  async function onAuthDone(role) {
    const m = await loadMe()
    if (role === 'creator') { setScreen('onboarding') }
    else routeAfterAuth(m)
  }

  async function logout() { await supabase.auth.signOut(); setMe(null); setScreen('landing') }

  function openCommunity(c) {
    const slug = typeof c === 'string' ? c : c?.slug
    if (!slug) return
    setActiveSlug(slug); setScreen('community')
  }

  const openPublic = (c) => { if (c?.slug) window.open(`/c/${c.slug}`, '_blank') }

  if (booting) return <div className="min-h-[100dvh] bg-background"><FullLoader label="Loading Fanvase" /></div>

  // ---- LOGGED OUT ----
  if (!session) {
    if (screen === 'auth') return <AuthView mode={authMode} initialRole={authRole} refCode={refCode} onDone={onAuthDone} onBack={() => setScreen('landing')} onSwitch={(m) => { setAuthMode(m); setScreen('auth') }} />
    if (screen === 'discover') return (
      <div className="min-h-[100dvh] bg-background">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl"><div className="container flex h-16 items-center justify-between"><Logo size="sm" onClick={() => setScreen('landing')} /><Button size="sm" onClick={() => { setAuthMode('signup'); setScreen('auth') }}>Sign up</Button></div></header>
        <div className="container max-w-5xl py-6"><DiscoverView onOpen={openPublic} /></div>
      </div>
    )
    return <Landing onStart={() => { setAuthMode('signup'); setAuthRole('creator'); setScreen('auth') }} onExplore={() => setScreen('discover')} onLogin={() => { setAuthMode('login'); setScreen('auth') }} />
  }

  // ---- LOGGED IN, no profile yet ----
  if (!me?.profile) return <div className="min-h-[100dvh] bg-background"><FullLoader label="Setting up your account" /></div>

  // ---- ONBOARDING ----
  if (screen === 'onboarding') return <CreatorOnboarding profile={me.profile} onExit={async () => { const m = await loadMe(); routeAfterAuth(m) }} onLaunched={async () => { await loadMe(); setAppMode('creator'); setScreen('app') }} />

  // ---- COMMUNITY EXPERIENCE ----
  if (screen === 'community' && activeSlug) return (
    <CommunityExperience slug={activeSlug} currentUser={me.user} onBack={() => setScreen('app')} onLogin={() => {}} onJoin={() => {}} />
  )

  // ---- APP ----
  if (appMode === 'admin') return <AdminPanel profile={me.profile} onExit={() => { setAppMode(me.profile.is_creator && me.communities.length ? 'creator' : 'fan'); }} onLogout={logout} />

  if (appMode === 'creator') return (
    <CreatorDashboard profile={me.profile} communities={me.communities} balance={me.balance}
      onNavPublic={(c) => c ? openPublic(c) : null}
      onLogout={logout}
      onSwitchFan={() => { setAppMode('fan'); setFanTab('communities') }}
      onReload={loadMe}
    />
  )

  return (
    <FanApp profile={me.profile} startTab={fanTab}
      onOpenCommunity={openCommunity}
      onBecomeCreator={() => setScreen('onboarding')}
      onSwitchCreator={() => setAppMode('creator')}
      onLogout={logout}
    />
  )
}

export default App
