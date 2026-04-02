import { NextResponse } from 'next/server'

const RAPIDAPI_KEY = 'b98335a482msh9b5720ba320008ap1dd462jsna7f5ee749f64'
const RAPIDAPI_HOST = 'instagram-looter2.p.rapidapi.com'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  if (!username || username.length < 2) {
    return new NextResponse(null, { status: 400 })
  }

  try {
    // Fetch profile to get fresh avatar URL
    const res = await fetch(
      `https://${RAPIDAPI_HOST}/profile?username=${username}`,
      {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )

    if (!res.ok) return new NextResponse(null, { status: 404 })

    const data = await res.json()
    const picUrl = data.profile_pic_url_hd || data.profile_pic_url

    if (!picUrl) return new NextResponse(null, { status: 404 })

    // Fetch the actual image
    const imgRes = await fetch(picUrl)
    if (!imgRes.ok) return new NextResponse(null, { status: 404 })

    const imgBuffer = await imgRes.arrayBuffer()

    return new NextResponse(imgBuffer, {
      headers: {
        'Content-Type': imgRes.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
