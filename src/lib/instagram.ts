const APIFY_TOKEN = process.env.APIFY_TOKEN!

export type InstagramProfile = {
  username: string
  full_name: string
  profile_pic_url: string
  follower_count: number
  following_count: number
  media_count: number
  posts_last_7d: number
  biography: string
}


export async function fetchInstagramProfile(username: string): Promise<InstagramProfile | null> {
  try {
    const cleanUsername = username.replace('@', '').trim()
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [cleanUsername] }),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || !data[0]) return null

    const profile = data[0]

    // Skip if API returned no real data
    if (profile.followersCount == null && profile.postsCount == null) return null

    // Count posts from last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const latestPosts = profile.latestPosts || []
    const postsLast7d = latestPosts.filter(
      (p: { timestamp?: string }) => {
        const ts = p.timestamp ? new Date(p.timestamp).getTime() : 0
        return ts >= sevenDaysAgo
      }
    ).length

    return {
      username: profile.username || cleanUsername,
      full_name: profile.fullName || '',
      profile_pic_url: profile.profilePicUrlHD || profile.profilePicUrl || '',
      follower_count: profile.followersCount ?? 0,
      following_count: profile.followsCount ?? 0,
      media_count: profile.postsCount ?? 0,
      posts_last_7d: postsLast7d,
      biography: profile.biography || '',
    }
  } catch (err) {
    console.error('Instagram API error:', err)
    return null
  }
}

export async function fetchMultipleProfiles(usernames: string[]): Promise<Map<string, InstagramProfile>> {
  const results = new Map<string, InstagramProfile>()
  if (usernames.length === 0) return results

  try {
    const cleanUsernames = usernames.map((u) => u.replace('@', '').trim())
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: cleanUsernames }),
      }
    )
    if (!res.ok) return results
    const data = await res.json()
    if (!Array.isArray(data)) return results

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    for (const profile of data) {
      if (!profile.username) continue
      // Skip profiles where the API returned no real data
      if (profile.followersCount == null && profile.postsCount == null) continue

      const latestPosts = profile.latestPosts || []
      const postsLast7d = latestPosts.filter(
        (p: { timestamp?: string }) => {
          const ts = p.timestamp ? new Date(p.timestamp).getTime() : 0
          return ts >= sevenDaysAgo
        }
      ).length

      results.set(profile.username.toLowerCase(), {
        username: profile.username,
        full_name: profile.fullName || '',
        profile_pic_url: profile.profilePicUrlHD || profile.profilePicUrl || '',
        follower_count: profile.followersCount ?? 0,
        following_count: profile.followsCount ?? 0,
        media_count: profile.postsCount ?? 0,
        posts_last_7d: postsLast7d,
        biography: profile.biography || '',
      })
    }
  } catch (err) {
    console.error('Instagram batch API error:', err)
  }

  return results
}
