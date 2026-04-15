import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchMultipleProfiles } from '@/lib/instagram'
import { uploadAvatarToStorage } from '@/lib/avatar-storage'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BATCH_SIZE = 20

export async function POST() {
  try {
    const { data: mentorados, error } = await supabaseAdmin
      .from('mentorados')
      .select('id, instagram, seguidores_atual')

    if (error || !mentorados) {
      return NextResponse.json({ error: 'Failed to fetch mentorados' }, { status: 500 })
    }

    const withInstagram = mentorados.filter((m) => !!m.instagram)
    const results: { instagram: string; posts_7d: number; followers: number; status: string }[] = []

    // Process in batches to avoid Apify timeout
    for (let i = 0; i < withInstagram.length; i += BATCH_SIZE) {
      const batch = withInstagram.slice(i, i + BATCH_SIZE)
      const usernames = batch.map((m) => m.instagram)

      const profiles = await fetchMultipleProfiles(usernames)

      for (const m of batch) {
        const profile = profiles.get(m.instagram.toLowerCase())
        if (!profile) {
          results.push({ instagram: m.instagram, posts_7d: 0, followers: 0, status: 'not_found' })
          continue
        }

        try {
          let avatarUrl = profile.profile_pic_url || undefined
          if (profile.profile_pic_url) {
            const storageUrl = await uploadAvatarToStorage(m.instagram, profile.profile_pic_url)
            if (storageUrl) {
              avatarUrl = storageUrl
            }
          }

          await supabaseAdmin
            .from('mentorados')
            .update({
              posts: profile.posts_last_7d,
              seguidores_atual: profile.follower_count,
              avatar: avatarUrl,
            })
            .eq('id', m.id)

          results.push({
            instagram: m.instagram,
            posts_7d: profile.posts_last_7d,
            followers: profile.follower_count,
            status: 'updated',
          })
        } catch {
          results.push({ instagram: m.instagram, posts_7d: 0, followers: 0, status: 'error' })
        }
      }
    }

    // Add skipped ones (no instagram)
    const skipped = mentorados.length - withInstagram.length
    for (let i = 0; i < skipped; i++) {
      results.push({ instagram: '', posts_7d: 0, followers: 0, status: 'skipped' })
    }

    return NextResponse.json({
      updated: results.filter((r) => r.status === 'updated').length,
      total: mentorados.length,
      results,
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
