import { InfoShell, H2, P } from '@/components/fanvase/legal'

export const metadata = { title: 'Contact — Fanvase', description: 'Get in touch with the Fanvase team.' }

export default function ContactPage() {
  return (
    <InfoShell title="Contact us" subtitle="We’re here to help — reach out any time.">
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Support &amp; general</p>
          <a className="mt-1 block text-lg font-semibold text-primary" href="mailto:support@fanvase.in">support@fanvase.in</a>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Website</p>
          <a className="mt-1 block text-lg font-semibold text-primary" href="https://fanvase.in">fanvase.in</a>
        </div>
      </div>

      <H2>Creator support</H2>
      <P>Need help activating your channel, setting up payouts, or getting paid? Email us with your account email and we’ll get you sorted quickly.</P>

      <H2>Report a problem</H2>
      <P>To report abuse, a policy violation, or a bug, email <a className="text-primary" href="mailto:support@fanvase.in">support@fanvase.in</a> with as much detail as possible.</P>
    </InfoShell>
  )
}
