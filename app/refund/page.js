import { InfoShell, H2, P, UL } from '@/components/fanvase/legal'

export const metadata = { title: 'Refund Policy — Fanvase', description: 'Fanvase refund and cancellation policy.' }

export default function RefundPage() {
  return (
    <InfoShell title="Refund & Cancellation Policy" updated="June 2025" subtitle="How refunds and cancellations work on Fanvase.">
      <H2>1. Memberships</H2>
      <P>Payments for community memberships give you access to a creator’s exclusive digital content. Because access is granted immediately upon payment, memberships are generally non-refundable except as described below or where required by law.</P>

      <H2>2. Recurring subscriptions</H2>
      <P>You can cancel a recurring membership at any time. Cancellation stops future renewals; you retain access until the end of the current billing period. We do not provide prorated refunds for partial periods.</P>

      <H2>3. One-time purchases</H2>
      <P>One-time access purchases are non-refundable once access has been granted, except in cases of duplicate charges or clear technical error.</P>

      <H2>4. Eligible refunds</H2>
      <UL>
        <li>You were charged more than once for the same purchase.</li>
        <li>You paid but were never granted access due to a technical issue on our side.</li>
        <li>Any case required by applicable consumer-protection law.</li>
      </UL>

      <H2>5. Platform subscriptions (creators)</H2>
      <P>Creator platform-plan subscriptions are billed to activate your channel and are non-refundable once the plan is activated.</P>

      <H2>6. How to request a refund</H2>
      <P>Email <a className="text-primary" href="mailto:support@fanvase.in">support@fanvase.in</a> within 7 days of the charge with your account email and payment details. We review each request and respond within a reasonable time.</P>
    </InfoShell>
  )
}
