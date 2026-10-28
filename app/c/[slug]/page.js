'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, API } from '@/lib/fanvase'
import { FullLoader, EmptyState } from '@/components/fanvase/atoms'
import { PublicCommunity } from '@/components/fanvase/public'
import { Button } from '@/components/ui/button'
import { Compass } from 'lucide-react'
import { toast } from 'sonner'

export default function CommunityPage() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null))
    API.get(`/community/${slug}`).then(setData).catch(() => setData({ error: true }))
  }, [slug])

  if (!data) return <div className="min-h-[100dvh] bg-background"><FullLoader label="Loading community" /></div>
  if (data.error || !data.community) return (
    <div className="grid min-h-[100dvh] place-items-center bg-background">
      <EmptyState icon={Compass} title="Community not found" desc="This community may have been removed." action={<Button onClick={() => (window.location.href = '/')}>Go home</Button>} />
    </div>
  )

  function join(c) {
    if (!user) { window.location.href = '/?auth=signup'; return }
    if (c.payment_link) { window.open(c.payment_link, '_blank'); toast.info('Complete payment to unlock access.') }
    else toast.info('Checkout is being set up by the creator. Check back soon!')
  }

  return (
    <PublicCommunity
      data={data}
      currentUser={user}
      onJoin={join}
      onBack={() => (window.location.href = '/')}
      onLogin={() => (window.location.href = '/?auth=login')}
    />
  )
}
