import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse(null, { status: 400 })
  }

  let target: URL
  try {
    target = new URL(url)
  } catch {
    return new NextResponse(null, { status: 400 })
  }

  if (!/(cdninstagram\.com|fbcdn\.net)$/i.test(target.hostname)) {
    return new NextResponse(null, { status: 400 })
  }

  try {
    const res = await fetch(target.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Referer: 'https://www.instagram.com/',
      },
    })
    if (!res.ok) {
      return new NextResponse(null, { status: res.status })
    }

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
