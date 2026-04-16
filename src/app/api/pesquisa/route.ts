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

  let growth: {
    followers_start: number | null
    followers_change: number
    followers_change_pct: number
    since_date: string | null
    has_history: boolean
  } = {
    followers_start: null,
    followers_change: 0,
    followers_change_pct: 0,
    since_date: null,
    has_history: false,
  }

  try {
    await supabaseAdmin.from('pesquisa_snapshots').insert({
      username,
      followers: profile.follower_count,
      following: profile.following_count,
      posts: profile.media_count,
    })

    const sinceIso = new Date(since).toISOString()
    const { data: snapshots } = await supabaseAdmin
      .from('pesquisa_snapshots')
      .select('followers, created_at')
      .eq('username', username)
      .lte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(1)

    if (snapshots && snapshots.length > 0) {
      const oldest = snapshots[0]
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
  } catch (err) {
    console.error('Snapshot error:', err)
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
  })
}
