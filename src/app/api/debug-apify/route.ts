import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function GET() {
  const token = process.env.APIFY_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'No APIFY_TOKEN', envKeys: Object.keys(process.env).filter(k => k.includes('APIFY') || k.includes('apifly') || k.includes('apify')) })
  }

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: ['aisnemorelli'] }),
      }
    )

    const text = await res.text()

    return NextResponse.json({
      tokenPrefix: token.substring(0, 15) + '...',
      status: res.status,
      bodyLength: text.length,
      bodyPreview: text.substring(0, 500),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) })
  }
}
