import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchMultipleProfiles } from '@/lib/instagram'

export const maxDuration = 300

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const BATCH_SIZE = 20

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: tracked, error } = await supabaseAdmin
    .from('pesquisa_tracked')
    .select('username')

  if (error) {
    return NextResponse.json({ error: 'Failed to load tracked list' }, { status: 500 })
  }
  if (!tracked || tracked.length === 0) {
    return NextResponse.json({ snapshotted: 0, total: 0 })
  }

  let snapshotted = 0

  for (let i = 0; i < tracked.length; i += BATCH_SIZE) {
    const batch = tracked.slice(i, i + BATCH_SIZE)
    const usernames = batch.map((t) => t.username)

    const profiles = await fetchMultipleProfiles(usernames)

    const rows: {
      username: string
      followers: number
      following: number
      posts: number
    }[] = []

    for (const t of batch) {
      const profile = profiles.get(t.username.toLowerCase())
      if (!profile) continue
      rows.push({
        username: t.username,
        followers: profile.follower_count,
        following: profile.following_count,
        posts: profile.media_count,
      })
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('pesquisa_snapshots')
        .insert(rows)
      if (!insertError) snapshotted += rows.length
    }
  }

  return NextResponse.json({ snapshotted, total: tracked.length })
}
