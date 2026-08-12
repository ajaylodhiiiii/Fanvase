import { InfoShell, H2, P, UL } from '@/components/fanvase/legal'

export const metadata = { title: 'About — Fanvase', description: 'Learn about Fanvase, the creator community & membership platform.' }

export default function AboutPage() {
  return (
    <InfoShell title="About Fanvase" subtitle="Turn your audience into a community.">
      <P>Fanvase is a creator community and membership platform that helps creators monetize their audience through paid communities. Creators launch their own branded channel, publish exclusive content, and earn through recurring memberships or one-time access — while fans discover creators they love and unlock members-only content.</P>

      <H2>Our mission</H2>
      <P>We believe creators should own their audience and earn a sustainable, predictable income from the people who value their work the most. Fanvase gives independent creators the tools of a modern subscription business without the complexity.</P>

      <H2>What you can do on Fanvase</H2>
      <UL>
        <li>Creators: build a community, set recurring or one-time pricing, publish text, images, files and links, and track members, revenue and payouts.</li>
        <li>Fans: discover communities, join your favorite creators, access exclusive content, and earn rewards through our Refer &amp; Earn program.</li>
        <li>Refer &amp; Earn: share your referral code and earn a reward when a creator you refer lands their first subscriber.</li>
      </UL>

      <H2>Get in touch</H2>
      <P>Have a question or partnership idea? Reach us any time at <a className="text-primary" href="mailto:support@fanvase.in">support@fanvase.in</a> or via our <a className="text-primary" href="/contact">Contact page</a>.</P>
    </InfoShell>
  )
}
