const RAPIDAPI_KEY = 'b98335a482msh9b5720ba320008ap1dd462jsna7f5ee749f64'
const RAPIDAPI_HOST = 'instagram-looter2.p.rapidapi.com'

export type InstagramProfile = {
  username: string
  full_name: string
  profile_pic_url: string
  follower_count: number
  following_count: number
  media_count: number
  biography: string
}

export async function fetchInstagramProfile(username: string): Promise<InstagramProfile | null> {
  try {
    const cleanUsername = username.replace('@', '').trim()
    const res = await fetch(
      `https://${RAPIDAPI_HOST}/profile?username=${cleanUsername}`,
      {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data || !data.username) return null

    return {
      username: data.username || cleanUsername,
      full_name: data.full_name || '',
      profile_pic_url: data.profile_pic_url_hd || data.profile_pic_url || '',
      follower_count: data.edge_followed_by?.count || 0,
      following_count: data.edge_follow?.count || 0,
      media_count: data.edge_owner_to_timeline_media?.count || 0,
      biography: data.biography || '',
    }
  } catch (err) {
    console.error('Instagram API error:', err)
    return null
  }
}
