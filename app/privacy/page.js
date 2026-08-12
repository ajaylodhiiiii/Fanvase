import { InfoShell, H2, P, UL } from '@/components/fanvase/legal'

export const metadata = { title: 'Privacy Policy — Fanvase', description: 'How Fanvase collects, uses and protects your data.' }

export default function PrivacyPage() {
  return (
    <InfoShell title="Privacy Policy" updated="June 2025" subtitle="Your privacy matters to us. This policy explains what we collect and why.">
      <P>This Privacy Policy describes how Fanvase (“Fanvase”, “we”, “us”) collects, uses, and shares information when you use our website and services at fanvase.in and fanvase.online (the “Service”).</P>

      <H2>1. Information we collect</H2>
      <UL>
        <li><b>Account information:</b> your name, email address, username, profile photo, country and bio.</li>
        <li><b>Creator information:</b> community details, pricing, and payout details you provide (e.g. UPI ID, PayPal email, or bank account) used solely to send you your earnings.</li>
        <li><b>Usage data:</b> content you post, communities you join, referrals, and basic analytics about how you use the Service.</li>
        <li><b>Payment information:</b> payments are processed by third-party providers. We do not store your full card details.</li>
      </UL>

      <H2>2. How we use your information</H2>
      <UL>
        <li>To provide, operate and improve the Service.</li>
        <li>To process memberships, referrals, and creator payouts.</li>
        <li>To communicate with you about your account and important updates.</li>
        <li>To keep the platform safe and prevent fraud or abuse.</li>
      </UL>

      <H2>3. Sharing of information</H2>
      <P>We do not sell your personal data. We share information only with service providers that help us run the platform (such as hosting, database, storage and payment processors), or when required by law.</P>

      <H2>4. Data storage &amp; security</H2>
      <P>Your data is stored securely with industry-standard providers and protected using access controls and row-level security. While no method of transmission is 100% secure, we take reasonable measures to protect your information.</P>

      <H2>5. Your rights</H2>
      <P>You may access, update, or request deletion of your personal information at any time by contacting us. Deleting your account removes your profile and associated data.</P>

      <H2>6. Cookies</H2>
      <P>We use essential cookies to keep you signed in and to operate the Service. We do not use them for third-party advertising.</P>

      <H2>7. Children</H2>
      <P>Fanvase is not intended for users under the age of 18. We do not knowingly collect data from children.</P>

      <H2>8. Changes to this policy</H2>
      <P>We may update this policy from time to time. Continued use of the Service after changes means you accept the updated policy.</P>

      <H2>9. Contact</H2>
      <P>For any privacy questions, email <a className="text-primary" href="mailto:support@fanvase.in">support@fanvase.in</a>.</P>
    </InfoShell>
  )
}
