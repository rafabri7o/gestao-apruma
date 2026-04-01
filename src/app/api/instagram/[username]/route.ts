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

  const profile = await fetchInstagramProfile(username)
  if (!profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  return NextResponse.json(profile)
}
