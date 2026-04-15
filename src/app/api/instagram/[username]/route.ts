import { NextResponse } from 'next/server'
import { fetchInstagramProfile } from '@/lib/instagram'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  if (!username || username.length < 2) {
    return NextResponse.json({ error: 'Username inválido' }, { status: 400 })
  }

  if (!process.env.APIFY_TOKEN) {
    return NextResponse.json({ error: 'APIFY_TOKEN not configured', hasEnv: !!process.env.APIFY_TOKEN }, { status: 500 })
  }

  const profile = await fetchInstagramProfile(username)
  if (!profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  return NextResponse.json(profile)
}
