import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchInstagramProfile } from '@/lib/instagram'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST() {
  try {
    // Get all mentorados
    const { data: mentorados, error } = await supabaseAdmin
      .from('mentorados')
      .select('id, instagram, seguidores_atual')

    if (error || !mentorados) {
      return NextResponse.json({ error: 'Failed to fetch mentorados' }, { status: 500 })
    }

    const results: { instagram: string; posts_7d: number; followers: number; status: string }[] = []

    // Fetch Instagram data for each (with small delay to avoid rate limits)
    for (const m of mentorados) {
      if (!m.instagram) {
        results.push({ instagram: '', posts_7d: 0, followers: 0, status: 'skipped' })
        continue
      }

      try {
        const profile = await fetchInstagramProfile(m.instagram)
        if (profile) {
          await supabaseAdmin
            .from('mentorados')
            .update({
              posts: profile.posts_last_7d,
              seguidores_atual: profile.follower_count,
            })
            .eq('id', m.id)

          results.push({
            instagram: m.instagram,
            posts_7d: profile.posts_last_7d,
            followers: profile.follower_count,
            status: 'updated',
          })
        } else {
          results.push({ instagram: m.instagram, posts_7d: 0, followers: 0, status: 'not_found' })
        }
      } catch {
        results.push({ instagram: m.instagram, posts_7d: 0, followers: 0, status: 'error' })
      }

      // Small delay between requests to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500))
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
