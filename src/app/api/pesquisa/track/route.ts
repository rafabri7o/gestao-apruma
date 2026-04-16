import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const rawUsername: string | undefined = body?.username
  const track: boolean = !!body?.track

  if (!rawUsername || rawUsername.trim().length < 2) {
    return NextResponse.json({ error: 'Username inválido' }, { status: 400 })
  }

  const username = rawUsername.replace('@', '').trim().toLowerCase()

  if (track) {
    await supabaseAdmin.from('pesquisa_tracked').upsert({ username })
  } else {
    await supabaseAdmin.from('pesquisa_tracked').delete().eq('username', username)
  }

  return NextResponse.json({ ok: true, username, tracked: track })
}
