import { useState, useEffect, useCallback } from 'react'

type Channel = { id: string; channelName: string; niche: string; postingFrequency: string; targetAudience?: string; createdAt: string; videos?: any[] }
type Video = { id: string; title: string; description?: string; status: string; views: number; likes: number; comments?: number; scheduledAt: string | null; channel: { channelName: string }; thumbnailUrl?: string }
type Dashboard = { channels: number; totalVideos: number; publishedVideos: number; scheduledVideos: number; recentVideos: Video[]; pipeline: Record<string, number> }
type Analytics = { totalViews: number; totalSubscribers: number; totalRevenue: number }
type Strategy = { id: string; topic: string; style: string; targetLength: string; trendingScore: number }

const STATUS_COLORS: Record<string, string> = {
  idea: 'bg-blue-100 text-blue-700', scripting: 'bg-purple-100 text-purple-700',
  thumbnail: 'bg-yellow-100 text-yellow-700', seo: 'bg-orange-100 text-orange-700',
  scheduled: 'bg-indigo-100 text-indigo-700', published: 'bg-green-100 text-green-700',
}
const STATUS_ICONS: Record<string, string> = {
  idea: '\u{1F4A1}', scripting: '\u270D\uFE0F', thumbnail: '\u{1F3A8}', seo: '\u{1F50D}', scheduled: '\u{1F4C5}', published: '\u{1F680}',
}
const PIPELINE_STAGES = ['ideas', 'scripting', 'thumbnail', 'seo', 'scheduled', 'published']
const PIPELINE_ICONS: Record<string, string> = { ideas: '\u{1F4A1}', scripting: '\u270D\uFE0F', thumbnail: '\u{1F3A8}', seo: '\u{1F50D}', scheduled: '\u{1F4C5}', published: '\u{1F680}' }

export default function YouTubeDashboard() {
  const [tab, setTab] = useState<'dashboard' | 'channels' | 'videos' | 'analytics'>('dashboard')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [showVideoDetail, setShowVideoDetail] = useState<Video | null>(null)
  const [channelForm, setChannelForm] = useState({ channelName: '', niche: '', postingFrequency: 'daily', targetAudience: '' })
  const [genForm, setGenForm] = useState({ topic: '', style: 'tutorial', channelId: '' })
  const [toast, setToast] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      setError('')
      const [dRes, cRes, vRes, aRes, sRes] = await Promise.all([
        fetch('/api/youtube/dashboard'), fetch('/api/youtube/channels'), fetch('/api/youtube/videos'),
        fetch('/api/youtube/analytics'), fetch('/api/youtube/strategies'),
      ])
      const d = await dRes.json().catch(() => null)
      const c = await cRes.json().catch(() => ({ channels: [] }))
      const v = await vRes.json().catch(() => ({ videos: [] }))
      const a = await aRes.json().catch(() => null)
      const s = await sRes.json().catch(() => ({ strategies: [] }))
      if (d) setDashboard(d)
      setChannels(c.channels || [])
      setVideos(v.videos || [])
      if (a?.summary) setAnalytics(a.summary)
      setStrategies(s.strategies || [])
    } catch (e) {
      setError('Failed to load data. Check your connection.')
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const onRefresh = async () => { setRefreshing(true); await fetchAll() }

  const addChannel = async () => {
    const res = await fetch('/api/youtube/channels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(channelForm) })
    if (res.ok) { showToast('Channel added!'); setShowAddChannel(false); setChannelForm({ channelName: '', niche: '', postingFrequency: 'daily', targetAudience: '' }); fetchAll() }
    else showToast('Failed to add channel')
  }

  const deleteChannel = async (id: string) => {
    const res = await fetch(`/api/youtube/channels/${id}`, { method: 'DELETE' })
    if (res.ok) { showToast('Channel deleted'); fetchAll() }
  }

  const generateVideo = async () => {
    const res = await fetch('/api/youtube/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(genForm) })
    if (res.ok) { showToast('Video generated!'); setShowGenerate(false); setGenForm({ topic: '', style: 'tutorial', channelId: '' }); fetchAll() }
    else showToast('Failed to generate video')
  }

  const deleteVideo = async (id: string) => {
    const res = await fetch(`/api/youtube/videos/${id}`, { method: 'DELETE' })
    if (res.ok) { showToast('Video deleted'); setShowVideoDetail(null); fetchAll() }
  }

  const advanceStatus = async (video: Video) => {
    const stages = ['idea', 'scripting', 'thumbnail', 'seo', 'scheduled', 'published']
    const next = stages[stages.indexOf(video.status) + 1]
    if (!next) return
    const res = await fetch(`/api/youtube/videos/${video.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
    if (res.ok) { showToast('Moved to ' + next); fetchAll() }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Loading YouTube Automation...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-center animate-in slide-in-from-top">
          {toast}
        </div>
      )}

      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center text-white text-lg">{'\u25B6'}</div>
              <div>
                <h1 className="text-base font-bold text-gray-900">YT Automation</h1>
                <p className="text-[10px] text-gray-400">Channels, Videos & Analytics</p>
              </div>
            </div>
            <button onClick={onRefresh} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition">
              <span className={`text-lg ${refreshing ? 'animate-spin' : ''}`}>{'\u21BB'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={onRefresh} className="mt-2 text-red-700 font-medium text-sm underline">Retry</button>
          </div>
        )}

        {tab === 'dashboard' && dashboard && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Channels', value: dashboard.channels, icon: '\u{1F4FA}', color: 'from-blue-500 to-blue-600' },
                { label: 'Videos', value: dashboard.totalVideos, icon: '\u{1F3AC}', color: 'from-purple-500 to-purple-600' },
                { label: 'Published', value: dashboard.publishedVideos, icon: '\u{1F680}', color: 'from-green-500 to-green-600' },
                { label: 'Scheduled', value: dashboard.scheduledVideos, icon: '\u{1F4C5}', color: 'from-orange-500 to-orange-600' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition">
                  <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-white text-lg mb-2`}>{s.icon}</div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Pipeline</h3>
              <div className="grid grid-cols-3 gap-2">
                {PIPELINE_STAGES.map(stage => (
                  <div key={stage} className="text-center p-2.5 bg-gray-50 rounded-xl">
                    <div className="text-xl mb-0.5">{PIPELINE_ICONS[stage]}</div>
                    <p className="text-lg font-bold text-gray-900">{dashboard.pipeline[stage] || 0}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{stage}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowAddChannel(true)} className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-4 shadow-sm text-left active:scale-[0.98] transition">
                <span className="text-2xl block mb-1">+</span>
                <span className="text-sm font-semibold">Add Channel</span>
              </button>
              <button onClick={() => setShowGenerate(true)} className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-4 shadow-sm text-left active:scale-[0.98] transition">
                <span className="text-2xl block mb-1">{'\u{1F3AC}'}</span>
                <span className="text-sm font-semibold">Generate Video</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Recent Videos</h3>
                <button onClick={() => setTab('videos')} className="text-red-600 text-xs font-medium">See All</button>
              </div>
              {dashboard.recentVideos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-2">{'\u{1F3AC}'}</p>
                  <p className="text-gray-400 text-sm">No videos yet</p>
                  <p className="text-gray-300 text-xs mt-1">Tap Generate Video to start!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dashboard.recentVideos.map(v => (
                    <button key={v.id} onClick={() => setShowVideoDetail(v)} className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-left active:bg-gray-100 transition">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                        {STATUS_ICONS[v.status] || '\u{1F3AC}'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{v.title}</p>
                        <p className="text-[10px] text-gray-400">{v.channel?.channelName}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${STATUS_COLORS[v.status] || 'bg-gray-100 text-gray-600'}`}>{v.status}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {strategies.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Trending Strategies</h3>
                <div className="space-y-2">
                  {strategies.slice(0, 3).map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">{'\u{1F3AF}'}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.topic}</p>
                        <p className="text-[10px] text-gray-400">{s.style} - {s.targetLength}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-orange-500">{Math.round(s.trendingScore)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'channels' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Channels ({channels.length})</h2>
              <button onClick={() => setShowAddChannel(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium active:bg-blue-700 transition">+ Add</button>
            </div>
            {channels.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 shadow-sm border text-center">
                <p className="text-4xl mb-3">{'\u{1F4FA}'}</p>
                <p className="text-gray-400 text-sm mb-3">No channels yet</p>
                <button onClick={() => setShowAddChannel(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium active:bg-blue-700">+ Add Your First Channel</button>
              </div>
            ) : (
              <div className="space-y-3">
                {channels.map(ch => (
                  <div key={ch.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0">{'\u25B6'}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900">{ch.channelName}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Niche: {ch.niche}</p>
                        <p className="text-xs text-gray-400">Post: {ch.postingFrequency}</p>
                        {ch.targetAudience && <p className="text-xs text-gray-400">Audience: {ch.targetAudience}</p>}
                        {ch.videos && <p className="text-xs text-gray-500 mt-1 font-medium">{ch.videos.length} videos</p>}
                      </div>
                      <button onClick={() => deleteChannel(ch.id)} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 active:bg-red-100 transition flex-shrink-0">X</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'videos' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Videos ({videos.length})</h2>
              <button onClick={() => setShowGenerate(true)} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium active:bg-red-700 transition">+ Generate</button>
            </div>
            {videos.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 shadow-sm border text-center">
                <p className="text-4xl mb-3">{'\u{1F3AC}'}</p>
                <p className="text-gray-400 text-sm mb-3">No videos yet</p>
                <button onClick={() => setShowGenerate(true)} className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium active:bg-red-700">Generate Your First Video</button>
              </div>
            ) : (
              <div className="space-y-2">
                {videos.map(v => (
                  <button key={v.id} onClick={() => setShowVideoDetail(v)} className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:bg-gray-50 transition">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        {STATUS_ICONS[v.status] || '\u{1F3AC}'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{v.title}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{v.channel?.channelName}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[v.status] || 'bg-gray-100 text-gray-600'}`}>{v.status}</span>
                          <span className="text-[10px] text-gray-400">{v.views.toLocaleString()} views</span>
                          <span className="text-[10px] text-gray-400">{v.likes.toLocaleString()} likes</span>
                        </div>
                      </div>
                      {v.status !== 'published' && (
                        <button onClick={(e) => { e.stopPropagation(); advanceStatus(v) }} className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-medium active:bg-green-100 flex-shrink-0">Next</button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'analytics' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Analytics</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <p className="text-xs text-gray-400">Total Views</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{analytics?.totalViews?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <p className="text-xs text-gray-400">Subscribers</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{analytics?.totalSubscribers?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border col-span-2">
                <p className="text-xs text-gray-400">Revenue</p>
                <p className="text-xl font-bold text-green-600 mt-1">${analytics?.totalRevenue?.toLocaleString() || '0'}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Videos by Status</h3>
              <div className="space-y-2">
                {Object.entries(dashboard?.pipeline || {}).map(([status, count]) => {
                  const max = Math.max(...Object.values(dashboard?.pipeline || { a: 1 }), 1)
                  return (
                    <div key={status} className="flex items-center gap-2">
                      <span className="text-xs w-20 text-right text-gray-500 capitalize">{status}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-500" style={{ width: `${((count as number) / max) * 100}%`, minWidth: count ? '8px' : '0' }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-6 text-center">{count as number}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Videos</h3>
              {videos.filter(v => v.status === 'published').length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-6">No published videos yet</p>
              ) : (
                <div className="space-y-2">
                  {videos.filter(v => v.status === 'published').sort((a, b) => b.views - a.views).slice(0, 5).map((v, i) => (
                    <div key={v.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                      <span className="text-lg font-bold text-gray-300 w-6 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{v.title}</p>
                        <p className="text-[10px] text-gray-400">{v.views.toLocaleString()} views</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg safe-area-bottom">
        <div className="flex">
          {([
            { key: 'dashboard' as const, icon: '\u{1F4CA}', label: 'Home' },
            { key: 'channels' as const, icon: '\u{1F4FA}', label: 'Channels' },
            { key: 'videos' as const, icon: '\u{1F3AC}', label: 'Videos' },
            { key: 'analytics' as const, icon: '\u{1F4C8}', label: 'Analytics' },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 py-2 pt-2.5 text-center transition ${tab === t.key ? 'text-red-600' : 'text-gray-400 active:text-gray-600'}`}>
              <span className="text-xl block">{t.icon}</span>
              <span className="text-[10px] font-medium mt-0.5 block">{t.label}</span>
              {tab === t.key && <div className="w-4 h-0.5 bg-red-600 rounded-full mx-auto mt-1" />}
            </button>
          ))}
        </div>
      </div>

      {showAddChannel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddChannel(false)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 pb-8 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
            <h2 className="text-lg font-semibold mb-4">Add New Channel</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Channel Name *</label>
                <input value={channelForm.channelName} onChange={e => setChannelForm({ ...channelForm, channelName: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="My YouTube Channel" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Niche *</label>
                <input value={channelForm.niche} onChange={e => setChannelForm({ ...channelForm, niche: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Tech, Gaming, Education..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Posting Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {['daily', 'weekly', 'biweekly'].map(f => (
                    <button key={f} onClick={() => setChannelForm({ ...channelForm, postingFrequency: f })} className={`py-2 rounded-xl text-xs font-medium border transition ${channelForm.postingFrequency === f ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 active:bg-gray-100'}`}>{f === 'biweekly' ? 'Bi-Weekly' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Target Audience</label>
                <input value={channelForm.targetAudience} onChange={e => setChannelForm({ ...channelForm, targetAudience: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="18-35 year olds interested in tech" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddChannel(false)} className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-xl text-sm font-medium active:bg-gray-200 transition">Cancel</button>
              <button onClick={addChannel} disabled={!channelForm.channelName || !channelForm.niche} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium active:bg-blue-700 disabled:opacity-50 transition">Add Channel</button>
            </div>
          </div>
        </div>
      )}

      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowGenerate(false)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 pb-8 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
            <h2 className="text-lg font-semibold mb-4">Generate Video</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Topic *</label>
                <input value={genForm.topic} onChange={e => setGenForm({ ...genForm, topic: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" placeholder="How to use AI tools" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {['tutorial', 'review', 'vlog', 'educational', 'entertainment', 'shorts'].map(s => (
                    <button key={s} onClick={() => setGenForm({ ...genForm, style: s })} className={`py-2 rounded-xl text-xs font-medium border transition capitalize ${genForm.style === s ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 active:bg-gray-100'}`}>{s}</button>
                  ))}
                </div>
              </div>
              {channels.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Channel</label>
                  <div className="space-y-1.5">
                    <button onClick={() => setGenForm({ ...genForm, channelId: '' })} className={`w-full text-left py-2 px-3 rounded-xl text-xs border transition ${!genForm.channelId ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>Auto-select</button>
                    {channels.map(ch => (
                      <button key={ch.id} onClick={() => setGenForm({ ...genForm, channelId: ch.id })} className={`w-full text-left py-2 px-3 rounded-xl text-xs border transition ${genForm.channelId === ch.id ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>{ch.channelName}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowGenerate(false)} className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-xl text-sm font-medium active:bg-gray-200 transition">Cancel</button>
              <button onClick={generateVideo} disabled={!genForm.topic} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-medium active:bg-red-700 disabled:opacity-50 transition">Generate</button>
            </div>
          </div>
        </div>
      )}

      {showVideoDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowVideoDetail(null)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 pb-8 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold pr-4">{showVideoDetail.title}</h2>
              <button onClick={() => setShowVideoDetail(null)} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 flex-shrink-0">X</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[showVideoDetail.status]}`}>{showVideoDetail.status}</span>
                <span className="text-xs text-gray-400">{showVideoDetail.channel?.channelName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{showVideoDetail.views.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">Views</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{showVideoDetail.likes.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">Likes</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{(showVideoDetail as any).comments?.toLocaleString() || '0'}</p>
                  <p className="text-[10px] text-gray-400">Comments</p>
                </div>
              </div>
              {showVideoDetail.description && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 mb-1">Description</p>
                  <p className="text-xs text-gray-600">{showVideoDetail.description}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                {showVideoDetail.status !== 'published' && (
                  <button onClick={() => { advanceStatus(showVideoDetail); setShowVideoDetail(null) }} className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-medium active:bg-green-700 transition">Advance Status</button>
                )}
                <button onClick={() => deleteVideo(showVideoDetail.id)} className="py-3 px-5 bg-red-50 text-red-600 rounded-xl text-sm font-medium active:bg-red-100 transition">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}