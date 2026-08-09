import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ajayylodhi09@gmail.com'

function json(data, status = 200) {
  const res = NextResponse.json(data, { status })
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  return res
}

export async function OPTIONS() {
  return json({}, 200)
}

async function getAuthUser() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return user
  } catch (e) {
    return null
  }
}

async function getProfile(userId) {
  const { data } = await adminClient.from('profiles').select('*').eq('id', userId).single()
  return data
}

function slugify(s) {
  return (s || '').toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
}

const CATEGORIES = ['AI', 'Business', 'Coding', 'Education', 'Fitness', 'Finance', 'Gaming', 'Design', 'Marketing', 'Personal Development', 'Other']

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method
  const url = new URL(request.url)

  try {
    if (route === '/' || route === '/root') return json({ message: 'Fanvase API' })
    if (route === '/categories') return json({ categories: CATEGORIES })

    // ---------- AUTH: signup ----------
    if (route === '/auth/signup' && method === 'POST') {
      const body = await request.json()
      const { email, password, display_name, role, ref } = body
      if (!email || !password) return json({ error: 'Email and password required' }, 400)
      const finalRole = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : (role === 'creator' ? 'creator' : 'fan')
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { display_name: display_name || email.split('@')[0] },
      })
      if (createErr) return json({ error: createErr.message }, 400)
      const uid = created.user.id
      let referredBy = null
      if (ref) {
        const { data: refUser } = await adminClient.from('profiles').select('id').eq('username', ref.toLowerCase()).single()
        if (refUser) referredBy = refUser.id
      }
      await adminClient.from('profiles').insert({
        id: uid, email, display_name: display_name || email.split('@')[0],
        role: finalRole, is_creator: finalRole === 'creator', referred_by: referredBy,
      })
      if (referredBy) {
        await adminClient.from('referrals').insert({ referrer_id: referredBy, referred_id: uid, status: 'pending', reward: 10 })
      }
      return json({ ok: true })
    }

    if (route === '/track-click' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      if (body.code) await adminClient.from('referral_clicks').insert({ referral_code: body.code.toLowerCase() })
      return json({ ok: true })
    }

    // ---------- PUBLIC: discover ----------
    if (route === '/communities' && method === 'GET') {
      const category = url.searchParams.get('category')
      const q = url.searchParams.get('q')
      let query = adminClient.from('communities').select('*').eq('status', 'active').order('member_count', { ascending: false }).limit(60)
      if (category && category !== 'All') query = query.eq('category', category)
      const { data: comms } = await query
      let list = comms || []
      const creatorIds = [...new Set(list.map(c => c.creator_id))]
      const { data: creators } = await adminClient.from('profiles').select('id,username,display_name,avatar_url').in('id', creatorIds.length ? creatorIds : ['00000000-0000-0000-0000-000000000000'])
      const cmap = Object.fromEntries((creators || []).map(c => [c.id, c]))
      list = list.map(c => ({ ...c, creator: cmap[c.creator_id] || null }))
      if (q) {
        const ql = q.toLowerCase()
        list = list.filter(c => c.name?.toLowerCase().includes(ql) || c.creator?.username?.toLowerCase().includes(ql) || c.creator?.display_name?.toLowerCase().includes(ql))
      }
      return json({ communities: list })
    }

    if (route === '/search-creator' && method === 'GET') {
      const q = (url.searchParams.get('q') || '').toLowerCase()
      if (!q) return json({ results: [] })
      const { data: profs } = await adminClient.from('profiles').select('id,username,display_name,avatar_url,bio').eq('is_creator', true).ilike('username', `%${q}%`).limit(10)
      const ids = (profs || []).map(p => p.id)
      const { data: comms } = await adminClient.from('communities').select('*').in('creator_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']).eq('status', 'active')
      const results = (profs || []).map(p => ({ ...p, community: (comms || []).find(c => c.creator_id === p.id) || null }))
      return json({ results })
    }

    if (route.startsWith('/community/') && method === 'GET') {
      const slug = path[1]
      const { data: comm } = await adminClient.from('communities').select('*').eq('slug', slug).single()
      if (!comm) return json({ error: 'Community not found' }, 404)
      const { data: creator } = await adminClient.from('profiles').select('id,username,display_name,avatar_url,bio,country').eq('id', comm.creator_id).single()
      const { data: posts } = await adminClient.from('posts').select('*').eq('community_id', comm.id).eq('status', 'published').order('created_at', { ascending: false }).limit(20)
      const user = await getAuthUser()
      let membership = null
      if (user) {
        const { data: m } = await adminClient.from('memberships').select('*').eq('community_id', comm.id).eq('user_id', user.id).maybeSingle()
        membership = m
      }
      const isMember = membership && membership.status === 'active'
      const visiblePosts = (posts || []).filter(p => isMember || p.visibility === 'public')
      return json({ community: comm, creator, posts: visiblePosts, total_posts: (posts || []).length, membership, is_member: isMember })
    }

    // ================= AUTHENTICATED =================
    const user = await getAuthUser()

    if (route === '/me' && method === 'GET') {
      if (!user) return json({ user: null })
      let profile = await getProfile(user.id)
      if (!profile) {
        const finalRole = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'fan'
        await adminClient.from('profiles').insert({ id: user.id, email: user.email, display_name: user.email.split('@')[0], role: finalRole, is_creator: finalRole === 'creator' })
        profile = await getProfile(user.id)
      }
      const { data: communities } = await adminClient.from('communities').select('*').eq('creator_id', user.id).order('created_at')
      const { data: balance } = await adminClient.from('creator_balances').select('*').eq('creator_id', user.id).maybeSingle()
      return json({ user: { id: user.id, email: user.email }, profile, communities: communities || [], balance: balance || null })
    }

    if (!user) return json({ error: 'Unauthorized' }, 401)
    const profile = await getProfile(user.id)

    if (route === '/username-available' && method === 'GET') {
      const u = (url.searchParams.get('u') || '').toLowerCase()
      if (!u || u.length < 3) return json({ available: false, reason: 'Too short' })
      const { data } = await adminClient.from('profiles').select('id').eq('username', u).maybeSingle()
      return json({ available: !data || data.id === user.id })
    }

    if (route === '/onboarding/creator' && method === 'POST') {
      const body = await request.json()
      const { username, display_name, avatar_url, country, bio, community, pricing } = body
      const uname = (username || '').toLowerCase().trim()
      if (!uname || uname.length < 3) return json({ error: 'Valid username required' }, 400)
      const { data: taken } = await adminClient.from('profiles').select('id').eq('username', uname).maybeSingle()
      if (taken && taken.id !== user.id) return json({ error: 'Username already taken' }, 400)
      const newRole = profile?.role === 'admin' ? 'admin' : 'creator'
      await adminClient.from('profiles').update({
        username: uname, display_name, avatar_url, country, bio,
        role: newRole, is_creator: true, referral_code: uname,
      }).eq('id', user.id)
      let slug = slugify(community?.slug || community?.name)
      if (!slug) slug = `c-${Date.now()}`
      let unique = slug, i = 1
      while (true) {
        const { data: ex } = await adminClient.from('communities').select('id').eq('slug', unique).maybeSingle()
        if (!ex) break
        unique = `${slug}-${i++}`
      }
      const { data: comm, error: cErr } = await adminClient.from('communities').insert({
        creator_id: user.id, name: community?.name || 'My Community', slug: unique,
        description: community?.description, image_url: community?.image_url, cover_url: community?.cover_url,
        category: community?.category || 'Other', country: community?.country || country,
        pricing_type: pricing?.pricing_type || 'recurring', billing_period: pricing?.billing_period || 'monthly',
        price: Number(pricing?.price) || 0, currency: pricing?.currency || 'USD', status: 'pending',
      }).select().single()
      if (cErr) return json({ error: cErr.message }, 400)
      await adminClient.from('creator_balances').upsert({ creator_id: user.id }, { onConflict: 'creator_id' })
      await adminClient.from('notifications').insert({ user_id: user.id, type: 'welcome', title: 'Community created', body: `${comm.name} is ready. Subscribe to a plan to activate it.` })
      return json({ ok: true, community: comm })
    }

    if (route === '/become-creator' && method === 'POST') return json({ ok: true })

    if (route === '/community' && method === 'POST') {
      if (!profile?.is_creator) return json({ error: 'Not a creator' }, 403)
      const body = await request.json()
      let slug = slugify(body?.slug || body?.name) || `c-${Date.now()}`
      let unique = slug, i = 1
      while (true) {
        const { data: ex } = await adminClient.from('communities').select('id').eq('slug', unique).maybeSingle()
        if (!ex) break
        unique = `${slug}-${i++}`
      }
      const { data: comm, error } = await adminClient.from('communities').insert({
        creator_id: user.id, name: body.name || 'New Community', slug: unique, description: body.description,
        image_url: body.image_url, cover_url: body.cover_url, category: body.category || 'Other', country: body.country,
        pricing_type: body.pricing_type || 'recurring', billing_period: body.billing_period || 'monthly',
        price: Number(body.price) || 0, currency: body.currency || 'USD', status: 'pending',
      }).select().single()
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true, community: comm })
    }

    if (route === '/platform/subscribe' && method === 'POST') {
      const body = await request.json()
      const plan = body.plan === 'pro' ? 'pro' : 'basic'
      const price = plan === 'pro' ? 20 : 5
      await adminClient.from('profiles').update({ platform_plan: plan, platform_status: 'pending' }).eq('id', user.id)
      await adminClient.from('transactions').insert({ creator_id: user.id, user_id: user.id, amount: price, type: 'platform', status: 'pending', description: `${plan} plan subscription (awaiting activation)` })
      await adminClient.from('notifications').insert({ user_id: user.id, type: 'platform', title: 'Plan selected', body: `Your ${plan} plan is pending activation by admin.` })
      return json({ ok: true })
    }

    if (route === '/creator/overview' && method === 'GET') {
      if (!profile?.is_creator) return json({ error: 'Not a creator' }, 403)
      const range = parseInt(url.searchParams.get('range') || '30')
      const { data: comms } = await adminClient.from('communities').select('*').eq('creator_id', user.id)
      const commIds = (comms || []).map(c => c.id)
      const commMap = Object.fromEntries((comms || []).map(c => [c.id, c]))
      const { data: members } = await adminClient.from('memberships').select('*').in('community_id', commIds.length ? commIds : ['x']).order('joined_at', { ascending: false })
      const { data: txs } = await adminClient.from('transactions').select('*').eq('creator_id', user.id).eq('status', 'completed').order('created_at', { ascending: false })
      const { data: bal } = await adminClient.from('creator_balances').select('*').eq('creator_id', user.id).maybeSingle()
      const now = Date.now()
      const sinceDays = (d) => now - d * 86400000
      const totalMembers = (members || []).length
      const activeMembers = (members || []).filter(m => m.status === 'active').length
      const newMembers = (members || []).filter(m => new Date(m.joined_at).getTime() > sinceDays(range)).length
      const totalRevenue = (txs || []).filter(t => t.type !== 'referral').reduce((s, t) => s + Number(t.amount), 0)
      const referralEarnings = bal?.referral_earned || 0
      let mrr = 0
      for (const m of (members || [])) {
        if (m.status !== 'active') continue
        const c = commMap[m.community_id]
        if (c?.pricing_type === 'recurring') mrr += c.billing_period === 'yearly' ? Number(c.price) / 12 : Number(c.price)
      }
      const buckets = {}
      for (let i = range - 1; i >= 0; i--) {
        const d = new Date(now - i * 86400000)
        buckets[d.toISOString().slice(0, 10)] = 0
      }
      for (const t of (txs || [])) {
        const k = new Date(t.created_at).toISOString().slice(0, 10)
        if (k in buckets && t.type !== 'referral') buckets[k] += Number(t.amount)
      }
      const series = Object.entries(buckets).map(([date, value]) => ({ date: date.slice(5), value }))
      const { data: notifs } = await adminClient.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8)
      const recentMemberIds = (members || []).slice(0, 6).map(m => m.user_id)
      const { data: mprofiles } = await adminClient.from('profiles').select('id,display_name,username,avatar_url').in('id', recentMemberIds.length ? recentMemberIds : ['x'])
      const pmap = Object.fromEntries((mprofiles || []).map(p => [p.id, p]))
      const recentMembers = (members || []).slice(0, 6).map(m => ({ ...m, profile: pmap[m.user_id] || null, community: commMap[m.community_id] || null }))
      return json({
        kpis: { totalMembers, activeMembers, newMembers, totalRevenue, mrr: Math.round(mrr * 100) / 100, referralEarnings },
        series, activity: notifs || [], recentMembers,
        balance: bal || { available: 0, pending: 0, total_earned: 0, referral_earned: 0 },
      })
    }

    if (route === '/creator/posts' && method === 'GET') {
      const { data: comms } = await adminClient.from('communities').select('id,name').eq('creator_id', user.id)
      const commIds = (comms || []).map(c => c.id)
      const { data: posts } = await adminClient.from('posts').select('*').in('community_id', commIds.length ? commIds : ['x']).order('created_at', { ascending: false })
      const cmap = Object.fromEntries((comms || []).map(c => [c.id, c]))
      return json({ posts: (posts || []).map(p => ({ ...p, community: cmap[p.community_id] || null })) })
    }
    if (route === '/posts' && method === 'POST') {
      if (!profile?.is_creator) return json({ error: 'Not a creator' }, 403)
      const body = await request.json()
      const { data: comm } = await adminClient.from('communities').select('id').eq('id', body.community_id).eq('creator_id', user.id).single()
      if (!comm) return json({ error: 'Invalid community' }, 400)
      const { data: post, error } = await adminClient.from('posts').insert({
        community_id: body.community_id, creator_id: user.id, title: body.title, content: body.content,
        type: body.type || 'text', media_url: body.media_url, link_url: body.link_url,
        visibility: body.visibility || 'members', status: body.status || 'published', scheduled_at: body.scheduled_at || null,
      }).select().single()
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true, post })
    }
    if (route.startsWith('/posts/') && method === 'PUT') {
      const id = path[1]
      const body = await request.json()
      const { data: existing } = await adminClient.from('posts').select('*').eq('id', id).single()
      if (!existing || existing.creator_id !== user.id) return json({ error: 'Forbidden' }, 403)
      const { data: post, error } = await adminClient.from('posts').update({
        title: body.title, content: body.content, type: body.type, media_url: body.media_url,
        link_url: body.link_url, visibility: body.visibility, status: body.status,
      }).eq('id', id).select().single()
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true, post })
    }
    if (route.startsWith('/posts/') && method === 'DELETE') {
      const id = path[1]
      const { data: existing } = await adminClient.from('posts').select('creator_id').eq('id', id).single()
      if (!existing || existing.creator_id !== user.id) return json({ error: 'Forbidden' }, 403)
      await adminClient.from('posts').delete().eq('id', id)
      return json({ ok: true })
    }

    if (route === '/creator/members' && method === 'GET') {
      const { data: comms } = await adminClient.from('communities').select('id,name').eq('creator_id', user.id)
      const commIds = (comms || []).map(c => c.id)
      const cmap = Object.fromEntries((comms || []).map(c => [c.id, c]))
      const { data: members } = await adminClient.from('memberships').select('*').in('community_id', commIds.length ? commIds : ['x']).order('joined_at', { ascending: false })
      const ids = (members || []).map(m => m.user_id)
      const { data: profs } = await adminClient.from('profiles').select('id,display_name,username,avatar_url,email').in('id', ids.length ? ids : ['x'])
      const pmap = Object.fromEntries((profs || []).map(p => [p.id, p]))
      return json({ members: (members || []).map(m => ({ ...m, profile: pmap[m.user_id] || null, community: cmap[m.community_id] || null })) })
    }

    if (route === '/creator/earnings' && method === 'GET') {
      const { data: bal } = await adminClient.from('creator_balances').select('*').eq('creator_id', user.id).maybeSingle()
      const { data: txs } = await adminClient.from('transactions').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(100)
      const { data: payouts } = await adminClient.from('payouts').select('*').eq('creator_id', user.id).order('created_at', { ascending: false })
      const ids = [...new Set((txs || []).map(t => t.user_id).filter(Boolean))]
      const { data: profs } = await adminClient.from('profiles').select('id,display_name,username').in('id', ids.length ? ids : ['x'])
      const pmap = Object.fromEntries((profs || []).map(p => [p.id, p]))
      const { data: comms } = await adminClient.from('communities').select('id,name').eq('creator_id', user.id)
      const cmap = Object.fromEntries((comms || []).map(c => [c.id, c]))
      const platformFees = (txs || []).filter(t => t.type === 'subscription' || t.type === 'onetime').reduce((s, t) => s + Number(t.amount) * 0.1, 0)
      return json({
        balance: bal || { available: 0, pending: 0, total_earned: 0, referral_earned: 0 },
        transactions: (txs || []).map(t => ({ ...t, member: pmap[t.user_id] || null, community: cmap[t.community_id] || null })),
        payouts: payouts || [], platformFees: Math.round(platformFees * 100) / 100,
      })
    }

    if (route === '/referrals' && method === 'GET') {
      const code = profile?.referral_code || profile?.username
      const { data: refs } = await adminClient.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false })
      const { count: clicks } = await adminClient.from('referral_clicks').select('id', { count: 'exact', head: true }).eq('referral_code', code || 'x')
      const referredIds = (refs || []).map(r => r.referred_id).filter(Boolean)
      const { data: profs } = await adminClient.from('profiles').select('id,display_name,username,avatar_url').in('id', referredIds.length ? referredIds : ['x'])
      const pmap = Object.fromEntries((profs || []).map(p => [p.id, p]))
      const successful = (refs || []).filter(r => r.status !== 'pending').length
      const totalEarnings = (refs || []).filter(r => r.status === 'converted' || r.status === 'paid').reduce((s, r) => s + Number(r.reward), 0)
      const pendingEarnings = (refs || []).filter(r => r.status === 'converted').reduce((s, r) => s + Number(r.reward), 0)
      const paidEarnings = (refs || []).filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.reward), 0)
      return json({
        code, clicks: clicks || 0, successful, totalEarnings, pendingEarnings, paidEarnings,
        referrals: (refs || []).map(r => ({ ...r, referred: pmap[r.referred_id] || null })),
      })
    }

    if (route === '/fan/communities' && method === 'GET') {
      const { data: memberships } = await adminClient.from('memberships').select('*').eq('user_id', user.id).order('joined_at', { ascending: false })
      const commIds = (memberships || []).map(m => m.community_id)
      const { data: comms } = await adminClient.from('communities').select('*').in('id', commIds.length ? commIds : ['x'])
      const creatorIds = [...new Set((comms || []).map(c => c.creator_id))]
      const { data: creators } = await adminClient.from('profiles').select('id,username,display_name,avatar_url').in('id', creatorIds.length ? creatorIds : ['x'])
      const crmap = Object.fromEntries((creators || []).map(c => [c.id, c]))
      const cmap = Object.fromEntries((comms || []).map(c => [c.id, { ...c, creator: crmap[c.creator_id] || null }]))
      const result = []
      for (const m of (memberships || [])) {
        const c = cmap[m.community_id]
        if (!c) continue
        const { data: lastPost } = await adminClient.from('posts').select('title,created_at,type').eq('community_id', c.id).eq('status', 'published').order('created_at', { ascending: false }).limit(1).maybeSingle()
        result.push({ membership: m, community: c, lastPost })
      }
      return json({ communities: result })
    }

    // ================= ADMIN =================
    if (route.startsWith('/admin/')) {
      if (profile?.role !== 'admin') return json({ error: 'Forbidden' }, 403)

      if (route === '/admin/overview' && method === 'GET') {
        const { count: users } = await adminClient.from('profiles').select('id', { count: 'exact', head: true })
        const { count: creators } = await adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('is_creator', true)
        const { count: communities } = await adminClient.from('communities').select('id', { count: 'exact', head: true })
        const { count: pendingComms } = await adminClient.from('communities').select('id', { count: 'exact', head: true }).eq('status', 'pending')
        const { count: members } = await adminClient.from('memberships').select('id', { count: 'exact', head: true })
        const { data: txs } = await adminClient.from('transactions').select('amount,type,status')
        const revenue = (txs || []).filter(t => t.status === 'completed').reduce((s, t) => s + Number(t.amount), 0)
        return json({ users: users || 0, creators: creators || 0, communities: communities || 0, pendingComms: pendingComms || 0, members: members || 0, revenue })
      }
      if (route === '/admin/users' && method === 'GET') {
        const { data: users } = await adminClient.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
        return json({ users: users || [] })
      }
      if (route === '/admin/communities' && method === 'GET') {
        const { data: comms } = await adminClient.from('communities').select('*').order('created_at', { ascending: false }).limit(200)
        const ids = [...new Set((comms || []).map(c => c.creator_id))]
        const { data: creators } = await adminClient.from('profiles').select('id,username,display_name,email,platform_plan,platform_status').in('id', ids.length ? ids : ['x'])
        const cmap = Object.fromEntries((creators || []).map(c => [c.id, c]))
        return json({ communities: (comms || []).map(c => ({ ...c, creator: cmap[c.creator_id] || null })) })
      }
      if (route === '/admin/update-community' && method === 'POST') {
        const body = await request.json()
        const update = {}
        if (body.status) update.status = body.status
        if (body.payment_link !== undefined) update.payment_link = body.payment_link
        if (body.price !== undefined) update.price = Number(body.price)
        if (body.pricing_type) update.pricing_type = body.pricing_type
        if (body.billing_period) update.billing_period = body.billing_period
        const { data: comm, error } = await adminClient.from('communities').update(update).eq('id', body.community_id).select().single()
        if (error) return json({ error: error.message }, 400)
        if (body.status === 'active') {
          await adminClient.from('notifications').insert({ user_id: comm.creator_id, type: 'activation', title: 'Community activated', body: `${comm.name} is now live and accepting members!` })
        }
        return json({ ok: true, community: comm })
      }
      if (route === '/admin/activate-platform' && method === 'POST') {
        const body = await request.json()
        const status = body.status || 'active'
        await adminClient.from('profiles').update({ platform_status: status }).eq('id', body.creator_id)
        await adminClient.from('transactions').update({ status: 'completed' }).eq('creator_id', body.creator_id).eq('type', 'platform').eq('status', 'pending')
        await adminClient.from('notifications').insert({ user_id: body.creator_id, type: 'platform', title: 'Plan activated', body: 'Your platform subscription is now active.' })
        return json({ ok: true })
      }
      if (route === '/admin/add-member' && method === 'POST') {
        const body = await request.json()
        const { community_id, user_email, plan } = body
        const { data: targetUser } = await adminClient.from('profiles').select('*').ilike('email', user_email).maybeSingle()
        if (!targetUser) return json({ error: 'No user found with that email' }, 404)
        const { data: comm } = await adminClient.from('communities').select('*').eq('id', community_id).single()
        if (!comm) return json({ error: 'Community not found' }, 404)
        const { data: existing } = await adminClient.from('memberships').select('*').eq('community_id', community_id).eq('user_id', targetUser.id).maybeSingle()
        if (existing) {
          await adminClient.from('memberships').update({ status: 'active', plan: plan || existing.plan }).eq('id', existing.id)
        } else {
          await adminClient.from('memberships').insert({ community_id, user_id: targetUser.id, plan: plan || (comm.pricing_type === 'recurring' ? comm.billing_period : 'one-time'), status: 'active', added_by: user.id })
          await adminClient.from('communities').update({ member_count: (comm.member_count || 0) + 1 }).eq('id', community_id)
        }
        await adminClient.from('transactions').insert({
          creator_id: comm.creator_id, user_id: targetUser.id, community_id, amount: comm.price, currency: comm.currency,
          type: comm.pricing_type === 'recurring' ? 'subscription' : 'onetime', status: 'completed', description: `New member: ${targetUser.email}`,
        })
        const net = Number(comm.price) * 0.9
        const { data: bal } = await adminClient.from('creator_balances').select('*').eq('creator_id', comm.creator_id).maybeSingle()
        if (bal) {
          await adminClient.from('creator_balances').update({ available: Number(bal.available) + net, total_earned: Number(bal.total_earned) + net, updated_at: new Date().toISOString() }).eq('creator_id', comm.creator_id)
        } else {
          await adminClient.from('creator_balances').insert({ creator_id: comm.creator_id, available: net, total_earned: net })
        }
        await adminClient.from('notifications').insert({ user_id: comm.creator_id, type: 'member', title: 'New member joined', body: `${targetUser.display_name || targetUser.email} joined ${comm.name}.` })
        await adminClient.from('notifications').insert({ user_id: targetUser.id, type: 'access', title: 'Access granted', body: `You now have access to ${comm.name}!` })
        const { data: creatorProfile } = await adminClient.from('profiles').select('referred_by').eq('id', comm.creator_id).single()
        if (creatorProfile?.referred_by) {
          const { data: ref } = await adminClient.from('referrals').select('*').eq('referrer_id', creatorProfile.referred_by).eq('referred_id', comm.creator_id).eq('status', 'pending').maybeSingle()
          if (ref) {
            await adminClient.from('referrals').update({ status: 'converted' }).eq('id', ref.id)
            const { data: rbal } = await adminClient.from('creator_balances').select('*').eq('creator_id', creatorProfile.referred_by).maybeSingle()
            const reward = Number(ref.reward)
            if (rbal) {
              await adminClient.from('creator_balances').update({ available: Number(rbal.available) + reward, referral_earned: Number(rbal.referral_earned) + reward, total_earned: Number(rbal.total_earned) + reward }).eq('creator_id', creatorProfile.referred_by)
            } else {
              await adminClient.from('creator_balances').insert({ creator_id: creatorProfile.referred_by, available: reward, referral_earned: reward, total_earned: reward })
            }
            await adminClient.from('transactions').insert({ creator_id: creatorProfile.referred_by, user_id: comm.creator_id, amount: reward, type: 'referral', status: 'completed', description: 'Referral reward: referred creator got first subscriber' })
            await adminClient.from('notifications').insert({ user_id: creatorProfile.referred_by, type: 'referral', title: 'Referral reward earned!', body: `You earned $${reward} \u2014 a creator you referred got their first subscriber.` })
          }
        }
        return json({ ok: true })
      }
      if (route === '/admin/remove-member' && method === 'POST') {
        const body = await request.json()
        await adminClient.from('memberships').update({ status: 'cancelled' }).eq('id', body.membership_id)
        return json({ ok: true })
      }
      return json({ error: 'Admin route not found' }, 404)
    }

    return json({ error: `Route ${route} not found` }, 404)
  } catch (error) {
    console.error('API Error:', route, error)
    return json({ error: error.message || 'Internal server error' }, 500)
  }
}

export async function POST(request, context) {
  const { path = [] } = await context.params
  const route = `/${path.join('/')}`
  if (route === '/upload') {
    try {
      const user = await getAuthUser()
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const form = await request.formData()
      const file = form.get('file')
      const bucket = form.get('bucket') === 'files' ? 'files' : 'media'
      if (!(file instanceof File)) return json({ error: 'No file' }, 400)
      const maxSize = bucket === 'files' ? 2 * 1024 * 1024 : 10 * 1024 * 1024
      if (file.size > maxSize) return json({ error: `File too large (max ${bucket === 'files' ? '2MB' : '10MB'})` }, 413)
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
      const objectPath = `${user.id}/${crypto.randomUUID()}.${ext}`
      const arrayBuffer = await file.arrayBuffer()
      const { error } = await adminClient.storage.from(bucket).upload(objectPath, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false })
      if (error) return json({ error: error.message }, 400)
      const { data } = adminClient.storage.from(bucket).getPublicUrl(objectPath)
      return json({ ok: true, url: data.publicUrl, path: objectPath })
    } catch (e) {
      return json({ error: e.message }, 500)
    }
  }
  return handleRoute(request, context)
}

export const GET = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
