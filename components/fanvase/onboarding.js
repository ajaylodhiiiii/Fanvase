'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { API, CATEGORIES, COUNTRIES, money, cn } from '@/lib/fanvase'
import { Logo, Avatar, Spinner } from '@/components/fanvase/atoms'
import { ArrowRight, ArrowLeft, Check, Upload, Repeat, Zap, Gift, Rocket, ImageIcon } from 'lucide-react'

function Uploader({ label, value, onChange, aspect = 'square' }) {
  const [busy, setBusy] = useState(false)
  async function pick(e) {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try { const r = await API.upload(file, 'media'); onChange(r.url); toast.success('Uploaded') }
    catch (err) { toast.error(err.message) } finally { setBusy(false) }
  }
  return (
    <div>
      {label && <Label className="mb-1.5 block">{label}</Label>}
      <label className={cn('relative flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-background hover:border-primary/50', aspect === 'wide' ? 'h-28' : 'h-28 w-28')}>
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">{busy ? <Spinner /> : <Upload className="h-5 w-5" />}<span className="text-xs">{busy ? 'Uploading' : 'Upload'}</span></div>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={pick} />
      </label>
    </div>
  )
}

export function CreatorOnboarding({ profile, onLaunched, onExit }) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)
  const [unameOk, setUnameOk] = useState(null)
  const [d, setD] = useState({
    username: profile?.username || '', display_name: profile?.display_name || '', avatar_url: profile?.avatar_url || '',
    country: profile?.country || 'United States', bio: profile?.bio || '',
    c_name: '', c_slug: '', c_desc: '', c_image: '', c_cover: '', c_category: 'AI', c_country: 'United States',
    pricing_type: 'recurring', billing_period: 'monthly', price: '9', currency: 'USD',
  })
  const set = (k, v) => setD(p => ({ ...p, [k]: v }))

  async function checkUsername(v) {
    set('username', v); setUnameOk(null)
    if (v.length < 3) return
    setChecking(true)
    try { const r = await API.get(`/username-available?u=${encodeURIComponent(v)}`); setUnameOk(r.available) }
    catch (e) {} finally { setChecking(false) }
  }

  const steps = ['Creator', 'Community', 'Pricing', 'Review']
  function next() {
    if (step === 1) { if (d.username.length < 3) return toast.error('Choose a username (3+ chars)'); if (unameOk === false) return toast.error('Username taken'); if (!d.display_name) return toast.error('Enter a display name') }
    if (step === 2 && !d.c_name) return toast.error('Enter a community name')
    if (step === 3 && (!d.price || Number(d.price) <= 0)) return toast.error('Set a price')
    setStep(s => Math.min(4, s + 1))
  }

  async function launch() {
    setSaving(true)
    try {
      const r = await API.post('/onboarding/creator', {
        username: d.username, display_name: d.display_name, avatar_url: d.avatar_url, country: d.country, bio: d.bio,
        community: { name: d.c_name, slug: d.c_slug || d.c_name, description: d.c_desc, image_url: d.c_image, cover_url: d.c_cover, category: d.c_category, country: d.c_country },
        pricing: { pricing_type: d.pricing_type, billing_period: d.billing_period, price: d.price, currency: d.currency },
      })
      toast.success('Community launched! Subscribe to a plan to activate it.')
      onLaunched?.(r.community)
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const slugPreview = (d.c_slug || d.c_name || 'your-community').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return (
    <div className="min-h-screen bg-grid">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between"><Logo size="sm" onClick={onExit} /><Button variant="ghost" size="sm" onClick={onExit}>Save & exit</Button></div>
      </header>

      <div className="container max-w-3xl py-8">
        {/* stepper */}
        <div className="mb-8 flex items-center justify-between">
          {steps.map((s, i) => {
            const n = i + 1, done = n < step, cur = n === step
            return (
              <div key={s} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={cn('grid h-9 w-9 place-items-center rounded-full border text-sm font-semibold', done ? 'border-primary bg-primary text-primary-foreground' : cur ? 'border-primary text-primary' : 'border-border text-muted-foreground')}>{done ? <Check className="h-4 w-4" /> : n}</div>
                  <span className={cn('mt-1 hidden text-xs sm:block', cur ? 'text-foreground' : 'text-muted-foreground')}>{s}</span>
                </div>
                {i < steps.length - 1 && <div className={cn('mx-2 h-0.5 flex-1', n < step ? 'bg-primary' : 'bg-border')} />}
              </div>
            )
          })}
        </div>

        <Card className="border-border bg-card p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div><h2 className="text-2xl font-bold">Set up your creator account</h2><p className="text-sm text-muted-foreground">This is your public identity on Fanvase.</p></div>
              <div className="flex items-center gap-4">
                <Uploader value={d.avatar_url} onChange={v => set('avatar_url', v)} />
                <div className="flex-1 space-y-4">
                  <div><Label>Username</Label><div className="relative"><Input className="mt-1.5" value={d.username} onChange={e => checkUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="yourhandle" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">{checking ? <Spinner className="h-4 w-4" /> : unameOk === true ? <span className="text-primary">Available</span> : unameOk === false ? <span className="text-red-400">Taken</span> : null}</span></div><p className="mt-1 text-xs text-muted-foreground">fanvase.in/@{d.username || 'yourhandle'} &middot; this is also your referral code</p></div>
                  <div><Label>Display name</Label><Input className="mt-1.5" value={d.display_name} onChange={e => set('display_name', e.target.value)} placeholder="Your Name" /></div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Country</Label><select value={d.country} onChange={e => set('country', e.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
              <div><Label>Short bio</Label><Textarea className="mt-1.5" rows={3} value={d.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell fans what you're about..." /></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div><h2 className="text-2xl font-bold">Create your community</h2><p className="text-sm text-muted-foreground">Your channel where you broadcast to members.</p></div>
              <Uploader label="Cover / banner" value={d.c_cover} onChange={v => set('c_cover', v)} aspect="wide" />
              <div className="flex items-center gap-4">
                <Uploader label="Community image" value={d.c_image} onChange={v => set('c_image', v)} />
                <div className="flex-1 space-y-4">
                  <div><Label>Community name</Label><Input className="mt-1.5" value={d.c_name} onChange={e => set('c_name', e.target.value)} placeholder="e.g. AI Builders Club" /></div>
                  <div><Label>Community URL slug</Label><Input className="mt-1.5" value={d.c_slug} onChange={e => set('c_slug', e.target.value)} placeholder="ai-builders" /><p className="mt-1 text-xs text-muted-foreground">fanvase.in/c/{slugPreview}</p></div>
                </div>
              </div>
              <div><Label>Description</Label><Textarea className="mt-1.5" rows={3} value={d.c_desc} onChange={e => set('c_desc', e.target.value)} placeholder="What will members get?" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Category</Label><select value={d.c_category} onChange={e => set('c_category', e.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><Label>Country</Label><select value={d.c_country} onChange={e => set('c_country', e.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div><h2 className="text-2xl font-bold">Set your pricing</h2><p className="text-sm text-muted-foreground">Choose how fans pay to access your community.</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[{ k: 'recurring', icon: Repeat, t: 'Recurring', d: 'Charge every month or year. Best for ongoing content.' }, { k: 'onetime', icon: Zap, t: 'One-time', d: 'Charge once for lifetime access.' }].map(o => (
                  <button key={o.k} onClick={() => set('pricing_type', o.k)} className={cn('rounded-2xl border p-5 text-left transition', d.pricing_type === o.k ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/40')}>
                    <div className={cn('grid h-10 w-10 place-items-center rounded-xl', d.pricing_type === o.k ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary')}><o.icon className="h-5 w-5" /></div>
                    <p className="mt-3 font-semibold">{o.t}</p><p className="text-sm text-muted-foreground">{o.d}</p>
                  </button>
                ))}
              </div>
              {d.pricing_type === 'recurring' && (
                <div><Label>Billing period</Label><div className="mt-1.5 flex gap-2">{['monthly', 'yearly'].map(b => <button key={b} onClick={() => set('billing_period', b)} className={cn('rounded-xl border px-4 py-2 text-sm capitalize', d.billing_period === b ? 'border-primary bg-primary/10 text-primary' : 'border-border')}>{b}</button>)}</div></div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Price</Label><div className="relative mt-1.5"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span><Input className="pl-7" type="number" value={d.price} onChange={e => set('price', e.target.value)} /></div></div>
                <div><Label>Currency</Label><select value={d.currency} onChange={e => set('currency', e.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>USD</option><option>INR</option><option>EUR</option><option>GBP</option></select></div>
              </div>
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm"><span className="font-semibold text-primary">{money(d.price, d.currency)}</span> {d.pricing_type === 'recurring' ? `per ${d.billing_period === 'yearly' ? 'year' : 'month'}` : 'one-time'} &middot; you keep 90%.</div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div><h2 className="text-2xl font-bold">Review & launch</h2><p className="text-sm text-muted-foreground">Everything look good? Launch your community.</p></div>
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="relative h-24 bg-secondary">{d.c_cover ? <img src={d.c_cover} className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-purple-600/20" />}</div>
                <div className="p-4"><div className="-mt-10 mb-2"><Avatar src={d.c_image} name={d.c_name} size={52} className="ring-4 ring-card" /></div>
                  <h3 className="font-bold">{d.c_name || 'Your Community'}</h3><p className="text-xs text-muted-foreground">by @{d.username} &middot; {d.c_category}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{d.c_desc || 'No description'}</p>
                  <div className="mt-3 flex items-center gap-2"><span className="rounded-lg bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">{money(d.price, d.currency)}{d.pricing_type === 'recurring' ? `/${d.billing_period === 'yearly' ? 'yr' : 'mo'}` : ' one-time'}</span><span className="text-xs text-muted-foreground">fanvase.in/c/{slugPreview}</span></div>
                </div>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-300">After launching, subscribe to a platform plan to activate your channel and start accepting members.</div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={() => step === 1 ? onExit?.() : setStep(s => s - 1)}><ArrowLeft className="mr-1 h-4 w-4" /> {step === 1 ? 'Cancel' : 'Back'}</Button>
            {step < 4 ? <Button onClick={next} className="font-semibold">Continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
              : <Button onClick={launch} disabled={saving} className="font-semibold glow-lime">{saving ? <Spinner className="text-primary-foreground" /> : <><Rocket className="mr-1 h-4 w-4" /> Launch Community</>}</Button>}
          </div>
        </Card>
      </div>
    </div>
  )
}
