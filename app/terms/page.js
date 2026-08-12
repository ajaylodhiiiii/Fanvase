import { InfoShell, H2, P, UL } from '@/components/fanvase/legal'

export const metadata = { title: 'Terms & Conditions — Fanvase', description: 'The terms governing your use of Fanvase.' }

export default function TermsPage() {
  return (
    <InfoShell title="Terms & Conditions" updated="June 2025" subtitle="Please read these terms carefully before using Fanvase.">
      <P>These Terms &amp; Conditions (“Terms”) govern your access to and use of Fanvase. By creating an account or using the Service, you agree to these Terms.</P>

      <H2>1. Accounts</H2>
      <P>You must provide accurate information and are responsible for keeping your account secure. One account may be used for both fan and creator activities. You must be at least 18 years old.</P>

      <H2>2. Creators &amp; communities</H2>
      <UL>
        <li>Creators are responsible for the content they publish and for complying with all applicable laws.</li>
        <li>To activate a community, creators subscribe to a platform plan. Communities become active once the subscription is confirmed.</li>
        <li>Creators set their own membership pricing (recurring or one-time). Pricing changes may be administered by the platform.</li>
      </UL>

      <H2>3. Memberships &amp; payments</H2>
      <P>Fans pay to join communities via the checkout link provided. Access is granted once payment is confirmed. Recurring memberships continue until cancelled. Fanvase may charge a platform fee on creator earnings.</P>

      <H2>4. Referrals</H2>
      <P>Referral rewards are credited according to our Refer &amp; Earn rules (for example, a reward when a creator you refer lands their first subscriber). We may modify or discontinue the referral program and reverse rewards obtained through fraud or abuse.</P>

      <H2>5. Payouts</H2>
      <P>Creators may withdraw their available balance to their chosen payout method. Payouts are reviewed and processed by the platform. You are responsible for the accuracy of your payout details and for any applicable taxes.</P>

      <H2>6. Acceptable use</H2>
      <UL>
        <li>No illegal, infringing, hateful, or sexually exploitative content.</li>
        <li>No fraud, spam, or attempts to disrupt or misuse the Service.</li>
        <li>Respect the intellectual property and rights of others.</li>
      </UL>

      <H2>7. Content ownership</H2>
      <P>You retain ownership of content you create. By posting, you grant Fanvase a license to host and display it as needed to operate the Service.</P>

      <H2>8. Termination</H2>
      <P>We may suspend or terminate accounts that violate these Terms. You may stop using the Service at any time.</P>

      <H2>9. Disclaimer &amp; liability</H2>
      <P>The Service is provided “as is” without warranties of any kind. To the maximum extent permitted by law, Fanvase is not liable for indirect or consequential damages arising from your use of the Service.</P>

      <H2>10. Contact</H2>
      <P>Questions about these Terms? Email <a className="text-primary" href="mailto:support@fanvase.in">support@fanvase.in</a>.</P>
    </InfoShell>
  )
}
