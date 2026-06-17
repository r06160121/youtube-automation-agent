import { Hono } from 'hono'
import { prisma } from './src/lib/db'

const app = new Hono()

app.get('/youtube/dashboard', async (c) => {
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
})

app.get('/youtube/channels', async (c) => {
  const channels = await prisma.youTubeChannel.findMany({ include: { videos: true, analytics: true, strategies: true } })
  return c.json({ channels })
})

app.post('/youtube/channels', async (c) => {
  const body = await c.req.json()
  const channel = await prisma.youTubeChannel.create({
    data: {
      channelName: body.channelName, channelId: body.channelId, niche: body.niche,
      postingFrequency: body.postingFrequency || 'daily', targetAudience: body.targetAudience,
      aiProvider: body.aiProvider || 'openai', apiKey: body.apiKey
    }
  })
  return c.json({ channel })
})

app.delete('/youtube/channels/:id', async (c) => {
  const id = c.req.param('id')
  await prisma.youTubeChannel.delete({ where: { id } })
  return c.json({ success: true })
})

app.get('/youtube/videos', async (c) => {
  const channelId = c.req.query('channelId')
  const status = c.req.query('status')
  const where: any = {}
  if (channelId) where.channelId = channelId
  if (status) where.status = status
  const videos = await prisma.video.findMany({ where, include: { channel: true }, orderBy: { createdAt: 'desc' } })
  return c.json({ videos })
})

app.post('/youtube/videos', async (c) => {
  const body = await c.req.json()
  const video = await prisma.video.create({
    data: {
      title: body.title, description: body.description, tags: body.tags,
      thumbnailUrl: body.thumbnailUrl, videoUrl: body.videoUrl,
      status: body.status || 'idea', channelId: body.channelId
    }
  })
  return c.json({ video })
})

app.put('/youtube/videos/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const video = await prisma.video.update({ where: { id }, data: body })
  return c.json({ video })
})

app.delete('/youtube/videos/:id', async (c) => {
  const id = c.req.param('id')
  await prisma.video.delete({ where: { id } })
  return c.json({ success: true })
})

app.post('/youtube/generate', async (c) => {
  const body = await c.req.json()
  const { topic, style, channelId } = body
  const video = await prisma.video.create({
    data: {
      title: `${topic} - ${style || 'Tutorial'}`,
      description: `Auto-generated content about ${topic}.`,
      tags: JSON.stringify([topic.toLowerCase(), style || 'tutorial', 'education']),
      status: 'idea',
      channelId: channelId || (await prisma.youTubeChannel.findFirst())?.id || ''
    }
  })
  return c.json({ video, message: 'Content generation started' })
})

app.get('/youtube/analytics', async (c) => {
  const analytics = await prisma.analytics.findMany({ orderBy: { date: 'desc' }, take: 30 })
  return c.json({ analytics, summary: { totalViews: analytics.reduce((s, a) => s + a.totalViews, 0), totalSubscribers: analytics[0]?.totalSubscribers || 0, totalRevenue: analytics.reduce((s, a) => s + a.totalRevenue, 0) } })
})

app.get('/youtube/strategies', async (c) => {
  const strategies = await prisma.contentStrategy.findMany({ orderBy: { trendingScore: 'desc' }, take: 20 })
  return c.json({ strategies })
})

app.post('/youtube/strategies', async (c) => {
  const body = await c.req.json()
  const strategy = await prisma.contentStrategy.create({
    data: {
      topic: body.topic, style: body.style || 'educational', targetLength: body.targetLength || '10-15 minutes',
      trendingScore: body.trendingScore || Math.random() * 100, channelId: body.channelId
    }
  })
  return c.json({ strategy })
})

export default app