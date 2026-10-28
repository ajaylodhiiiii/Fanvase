'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/fanvase/atoms'
import { CheckCircle2, XCircle } from 'lucide-react'

// Dodo Payments sends the creator here after checkout (return_url) with
// ?status=... appended. This page only shows a message; it never activates anything.
const FAILED = ['failed', 'cancelled', 'canceled', 'expired']

export default function SubscribedPage() {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const status = (new URLSearchParams(window.location.search).get('status') || '').toLowerCase()
    setFailed(FAILED.includes(status))
  }, [])

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center">
        <div className="mb-6 flex justify-center"><Logo size="sm" onClick={() => (window.location.href = '/')} /></div>
        {failed ? (
          <>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-destructive/15 text-destructive"><XCircle className="h-7 w-7" /></div>
            <h1 className="text-2xl font-bold tracking-tight">Payment not completed</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your payment didn&rsquo;t go through, so you have not been charged. You can try again from Manage Plans.</p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary"><CheckCircle2 className="h-7 w-7" /></div>
            <h1 className="text-2xl font-bold tracking-tight">Subscribed successfully</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your account will be set up and live within 1 hour.</p>
          </>
        )}
        <Button className="mt-8 w-full font-semibold" onClick={() => (window.location.href = '/')}>Go to dashboard</Button>
      </div>
    </div>
  )
}
