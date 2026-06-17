import { Hono } from 'hono'
import { prisma } from './src/lib/db'

const app = new Hono()

app.get('/youtube/dashboard', async (c) => {
  try {
    const channels = await prisma.youTubeChannel.count()
    const totalVideos = await prisma.video.count()
    const publishedVideos = await prisma.video.count({ where: { status: 'published' } })
    const scheduledVideos = await prisma.video.count({ where: { status: 'scheduled' } })
    const recentVideos = await prisma.video.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { channel: true } })
    const pipeline = {
      ideas: await prisma.video.count({ where: { status: 'idea' } }),
      scripting: await prisma.video.count({ where: { status: 'scripting' } }),
      thumbnail: await prisma.video.count({ where: { status: 'thumbnail' } }),
      seo: await prisma.video.count({ where: { status: 'seo' } }),
      scheduled: await prisma.video.count({ where: { status: 'scheduled' } }),
      published: await prisma.video.count({ where: { status: 'published' } })
    }
    return c.json({ channels, totalVideos, publishedVideos, scheduledVideos, recentVideos, pipeline })
  } catch (e: any) {
    return c.json({ error: e.message || 'Database error' }, 500)
  }
})

app.get('/youtube/channels', async (c) => {
  try {
    const channels = await prisma.youTubeChannel.findMany({ include: { videos: true } })
    return c.json({ channels })
  } catch (e: any) {
    return c.json({ error: e.message || 'Database error' }, 500)
  }
})

app.post('/youtube/channels', async (c) => {
  try {
    const body = await c.req.json()
    const channel = await prisma.youTubeChannel.create({
      data: {
        channelName: body.channelName, channelId: body.channelId, niche: body.niche,
        postingFrequency: body.postingFrequency || 'daily', targetAudience: body.targetAudience,
        aiProvider: body.aiProvider || 'openai', apiKey: body.apiKey
      }
    })
    return c.json({ channel })
  } catch (e: any) {
    return c.json({ error: e.message || 'Failed to create channel' }, 500)
  }
})

app.delete('/youtube/channels/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await prisma.video.deleteMany({ where: { channelId: id } })
    await prisma.analytics.deleteMany({ where: { channelId: id } })
    await prisma.contentStrategy.deleteMany({ where: { channelId: id } })
    await prisma.youTubeChannel.delete({ where: { id } })
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message || 'Failed to delete channel' }, 500)
  }
})

app.get('/youtube/videos', async (c) => {
  try {
    const channelId = c.req.query('channelId')
    const status = c.req.query('status')
    const where: any = {}
    if (channelId) where.channelId = channelId
    if (status) where.status = status
    const videos = await prisma.video.findMany({ where, include: { channel: true }, orderBy: { createdAt: 'desc' } })
    return c.json({ videos })
  } catch (e: any) {
    return c.json({ error: e.message || 'Database error' }, 500)
  }
})

app.post('/youtube/videos', async (c) => {
  try {
    const body = await c.req.json()
    const video = await prisma.video.create({
      data: {
        title: body.title, description: body.description, tags: body.tags,
        thumbnailUrl: body.thumbnailUrl, videoUrl: body.videoUrl,
        status: body.status || 'idea', channelId: body.channelId
      }
    })
    return c.json({ video })
  } catch (e: any) {
    return c.json({ error: e.message || 'Failed to create video' }, 500)
  }
})

app.put('/youtube/videos/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const video = await prisma.video.update({ where: { id }, data: body })
    return c.json({ video })
  } catch (e: any) {
    return c.json({ error: e.message || 'Failed to update video' }, 500)
  }
})

app.delete('/youtube/videos/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await prisma.video.delete({ where: { id } })
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message || 'Failed to delete video' }, 500)
  }
})

app.post('/youtube/generate', async (c) => {
  try {
    const body = await c.req.json()
    const { topic, style, channelId } = body
    let targetChannelId = channelId
    if (!targetChannelId) {
      const first = await prisma.youTubeChannel.findFirst()
      targetChannelId = first?.id
    }
    if (!targetChannelId) {
      return c.json({ error: 'No channel found. Create a channel first.' }, 400)
    }
    const titles: Record<string, string[]> = {
      tutorial: [\`How to \${topic} - Complete Guide\`, \`\${topic} Tutorial for Beginners\`, \`Master \${topic} in 10 Minutes\`],
      review: [\`\${topic} Review - Is It Worth It?\`, \`Honest \${topic} Review 2026\`, \`\${topic} vs The Competition\`],
      vlog: [\`My \${topic} Journey\`, \`Day in the Life: \${topic}\`, \`\${topic} Vlog - You Won't Believe This!\`],
      educational: [\`Why \${topic} Matters\`, \`The Science Behind \${topic}\`, \`\${topic} Explained Simply\`],
      entertainment: [\`I Tried \${topic} for 30 Days\`, \`\${topic} Challenge Gone Wrong\`, \`The \${topic} Experience\`],
      shorts: [\`\${topic} in 60 Seconds\`, \`Quick \${topic} Tip\`, \`\${topic} Hack You Need to Know\`],
    }
    const options = titles[style] || titles.tutorial
    const title = options[Math.floor(Math.random() * options.length)]
    const video = await prisma.video.create({
      data: {
        title,
        description: \`Auto-generated \${style} content about \${topic}. This video covers everything you need to know.\`,
        tags: JSON.stringify([topic.toLowerCase(), style, 'youtube', 'content']),
        status: 'idea',
        channelId: targetChannelId
      }
    })
    return c.json({ video, message: 'Video idea generated!' })
  } catch (e: any) {
    return c.json({ error: e.message || 'Failed to generate video' }, 500)
  }
})

app.get('/youtube/analytics', async (c) => {
  try {
    const analytics = await prisma.analytics.findMany({ orderBy: { date: 'desc' }, take: 30 })
    return c.json({
      analytics,
      summary: {
        totalViews: analytics.reduce((s, a) => s + a.totalViews, 0),
        totalSubscribers: analytics[0]?.totalSubscribers || 0,
        totalRevenue: analytics.reduce((s, a) => s + a.totalRevenue, 0)
      }
    })
  } catch (e: any) {
    return c.json({ analytics: [], summary: { totalViews: 0, totalSubscribers: 0, totalRevenue: 0 } })
  }
})

app.get('/youtube/strategies', async (c) => {
  try {
    const strategies = await prisma.contentStrategy.findMany({ orderBy: { trendingScore: 'desc' }, take: 20 })
    return c.json({ strategies })
  } catch (e: any) {
    return c.json({ strategies: [] })
  }
})

app.post('/youtube/strategies', async (c) => {
  try {
    const body = await c.req.json()
    const firstChannel = await prisma.youTubeChannel.findFirst()
    if (!firstChannel) return c.json({ error: 'No channel found' }, 400)
    const strategy = await prisma.contentStrategy.create({
      data: {
        topic: body.topic, style: body.style || 'educational',
        targetLength: body.targetLength || '10-15 minutes',
        trendingScore: body.trendingScore || Math.random() * 100,
        channelId: body.channelId || firstChannel.id
      }
    })
    return c.json({ strategy })
  } catch (e: any) {
    return c.json({ error: e.message || 'Failed to create strategy' }, 500)
  }
})

export default app