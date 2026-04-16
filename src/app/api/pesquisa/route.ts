import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchInstagramProfileFull, type InstagramPost } from '@/lib/instagram'

export const maxDuration = 120

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const ALLOWED_DAYS = new Set([7, 15, 30, 60, 90])

function postViews(p: InstagramPost) {
  return Math.max(p.video_plays, p.video_views, 0)
}

function dayKey(iso: string) {
  return iso.slice(0, 10)
}

type DailyPoint = {
  date: string
  followers: number
  following: number
  posts: number
  followers_change: number
  following_change: number
  posts_change: number
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const rawUsername: string | undefined = body?.username
  const days = Number(body?.days)

  if (!rawUsername || rawUsername.trim().length < 2) {
    return NextResponse.json({ error: 'Username inválido' }, { status: 400 })
  }
  if (!ALLOWED_DAYS.has(days)) {
    return NextResponse.json({ error: 'Período inválido' }, { status: 400 })
  }

  const username = rawUsername.replace('@', '').trim().toLowerCase()

  const profile = await fetchInstagramProfileFull(username, 100)
  if (!profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  const since = Date.now() - days * 24 * 60 * 60 * 1000

  const postsInPeriod = profile.posts.filter((p) => {
    const ts = p.timestamp ? new Date(p.timestamp).getTime() : 0
    return ts >= since
  })

  const topPosts = postsInPeriod
    .slice()
    .sort((a, b) => postViews(b) - postViews(a))
    .slice(0, 20)

  let growth = {
    followers_start: null as number | null,
    followers_change: 0,
    followers_change_pct: 0,
    since_date: null as string | null,
    has_history: false,
  }

  let dailySeries: DailyPoint[] = []
  let isTracked = false

  try {
    await supabaseAdmin.from('pesquisa_snapshots').insert({
      username,
      followers: profile.follower_count,
      following: profile.following_count,
      posts: profile.media_count,
    })

    const sinceIso = new Date(since).toISOString()

    const [{ data: oldSnap }, { data: periodSnaps }, { data: trackedRow }] = await Promise.all([
      supabaseAdmin
        .from('pesquisa_snapshots')
        .select('followers, following, posts, created_at')
        .eq('username', username)
        .lte('created_at', sinceIso)
        .order('created_at', { ascending: false })
        .limit(1),
      supabaseAdmin
        .from('pesquisa_snapshots')
        .select('followers, following, posts, created_at')
        .eq('username', username)
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('pesquisa_tracked')
        .select('username')
        .eq('username', username)
        .maybeSingle(),
    ])

    if (oldSnap && oldSnap.length > 0) {
      const oldest = oldSnap[0]
      const change = profile.follower_count - oldest.followers
      const pct = oldest.followers > 0 ? (change / oldest.followers) * 100 : 0
      growth = {
        followers_start: oldest.followers,
        followers_change: change,
        followers_change_pct: pct,
        since_date: oldest.created_at,
        has_history: true,
      }
    }

    if (periodSnaps && periodSnaps.length > 0) {
      const byDay = new Map<string, { followers: number; following: number; posts: number }>()
      for (const s of periodSnaps) {
        const key = dayKey(s.created_at)
        byDay.set(key, { followers: s.followers, following: s.following, posts: s.posts })
      }
      const sortedDays = Array.from(byDay.keys()).sort()
      let prev: { followers: number; following: number; posts: number } | null = null
      if (oldSnap && oldSnap.length > 0) {
        prev = {
          followers: oldSnap[0].followers,
          following: oldSnap[0].following,
          posts: oldSnap[0].posts,
        }
      }
      for (const key of sortedDays) {
        const d = byDay.get(key)!
        dailySeries.push({
          date: key,
          followers: d.followers,
          following: d.following,
          posts: d.posts,
          followers_change: prev ? d.followers - prev.followers : 0,
          following_change: prev ? d.following - prev.following : 0,
          posts_change: prev ? d.posts - prev.posts : 0,
        })
        prev = d
      }
    }

    isTracked = !!trackedRow
  } catch (err) {
    console.error('Snapshot/daily error:', err)
    dailySeries = []
  }

  return NextResponse.json({
    profile: {
      username: profile.username,
      full_name: profile.full_name,
      profile_pic_url: profile.profile_pic_url,
      follower_count: profile.follower_count,
      following_count: profile.following_count,
      media_count: profile.media_count,
      biography: profile.biography,
    },
    growth,
    period_days: days,
    posts_in_period_count: postsInPeriod.length,
    top_posts: topPosts,
    daily_series: dailySeries,
    is_tracked: isTracked,
  })
}
