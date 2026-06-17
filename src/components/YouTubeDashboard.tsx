import { useState, useEffect } from 'react'

type Channel = { id: string; channelName: string; niche: string; postingFrequency: string; createdAt: string }
type Video = { id: string; title: string; status: string; views: number; likes: number; scheduledAt: string | null; channel: { channelName: string } }
type Dashboard = { channels: number; totalVideos: number; publishedVideos: number; scheduledVideos: number; recentVideos: Video[]; pipeline: Record<string, number> }

const STATUS_COLORS: Record<string, string> = {
  idea: 'bg-blue-100 text-blue-800', scripting: 'bg-purple-100 text-purple-800',
  thumbnail: 'bg-yellow-100 text-yellow-800', seo: 'bg-orange-100 text-orange-800',
  scheduled: 'bg-indigo-100 text-indigo-800', published: 'bg-green-100 text-green-800',
}

const PIPELINE_STAGES = ['ideas', 'scripting', 'thumbnail', 'seo', 'scheduled', 'published']
const PIPELINE_ICONS: Record<string, string> = { ideas: '💡', scripting: '✍️', thumbnail: '🎨', seo: '🔍', scheduled: '📅', published: '🚀' }

export default function YouTubeDashboard() {
  const [tab, setTab] = useState('dashboard')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [channelForm, setChannelForm] = useState({ channelName: '', niche: '', postingFrequency: 'daily', targetAudience: '', aiProvider: 'openai' })
  const [genForm, setGenForm] = useState({ topic: '', style: 'tutorial', channelId: '' })
  const [toast, setToast] = useState('')

  const fetchAll = async () => {
    try {
      const [dRes, cRes, vRes] = await Promise.all([
        fetch('/api/youtube/dashboard'), fetch('/api/youtube/channels'), fetch('/api/youtube/videos')
      ])
      const [d, c, v] = await Promise.all([dRes.json(), cRes.json(), vRes.json()])
      setDashboard(d); setChannels(c.channels || []); setVideos(v.videos || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const addChannel = async () => {
    const res = await fetch('/api/youtube/channels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(channelForm) })
    if (res.ok) { showToast('✅ Channel added!'); setShowAddChannel(false); setChannelForm({ channelName: '', niche: '', postingFrequency: 'daily', targetAudience: '', aiProvider: 'openai' }); fetchAll() }
  }

  const deleteChannel = async (id: string) => {
    if (!confirm('Delete this channel?')) return
    const res = await fetch(`/api/youtube/channels/${id}`, { method: 'DELETE' })
    if (res.ok) { showToast('🗑️ Channel deleted'); fetchAll() }
  }

  const generateVideo = async () => {
    const res = await fetch('/api/youtube/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(genForm) })
    if (res.ok) { showToast('🎬 Video idea generated!'); setShowGenerate(false); setGenForm({ topic: '', style: 'tutorial', channelId: '' }); fetchAll() }
  }

  const deleteVideo = async (id: string) => {
    if (!confirm('Delete this video?')) return
    const res = await fetch(`/api/youtube/videos/${id}`, { method: 'DELETE' })
    if (res.ok) { showToast('🗑️ Video deleted'); fetchAll() }
  }

  const advanceStatus = async (video: Video) => {
    const stages = ['idea', 'scripting', 'thumbnail', 'seo', 'scheduled', 'published']
    const next = stages[stages.indexOf(video.status) + 1]
    if (!next) return
    const res = await fetch(`/api/youtube/videos/${video.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
    if (res.ok) { showToast(`✅ Moved to ${next}`); fetchAll() }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading YouTube Automation...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">{toast}</div>}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white text-xl">▶</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">YouTube Automation</h1>
                <p className="text-xs text-gray-500">Manage channels, videos & analytics</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddChannel(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">+ Channel</button>
              <button onClick={() => setShowGenerate(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition">🎬 Generate Video</button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm inline-flex">
          {(['dashboard', 'channels', 'videos', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'dashboard' && dashboard && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[{ label: 'Channels', value: dashboard.channels, icon: '📺', color: 'bg-blue-500' }, { label: 'Total Videos', value: dashboard.totalVideos, icon: '🎬', color: 'bg-purple-500' }, { label: 'Published', value: dashboard.publishedVideos, icon: '🚀', color: 'bg-green-500' }, { label: 'Scheduled', value: dashboard.scheduledVideos, icon: '📅', color: 'bg-orange-500' }].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className={`${s.color} w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl`}>{s.icon}</div>
                    <div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">📊 Content Pipeline</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {PIPELINE_STAGES.map(stage => (
                  <div key={stage} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">{PIPELINE_ICONS[stage]}</div>
                    <p className="text-2xl font-bold text-gray-900">{dashboard.pipeline[stage] || 0}</p>
                    <p className="text-xs text-gray-500 capitalize">{stage}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">📹 Recent Videos</h3>
              {dashboard.recentVideos.length === 0 ? <p className="text-gray-400 text-center py-8">No videos yet. Click "Generate Video" to create your first one!</p> : (
                <div className="space-y-3">{dashboard.recentVideos.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div><p className="font-medium text-gray-900">{v.title}</p><p className="text-xs text-gray-500">{v.channel?.channelName}</p></div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[v.status] || 'bg-gray-100 text-gray-800'}`}>{v.status}</span>
                  </div>
                ))}</div>
              )}
            </div>
          </div>
        )}
        {tab === 'channels' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">📺 Your Channels</h2>
            {channels.length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
                <p className="text-gray-400 text-lg mb-4">No channels yet</p>
                <button onClick={() => setShowAddChannel(true)} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">+ Add Your First Channel</button>
              </div>
            ) : <div className="grid gap-4 md:grid-cols-2">{channels.map(ch => (
              <div key={ch.id} className="bg-white rounded-xl p-5 shadow-sm border">
                <div className="flex justify-between items-start">
                  <div><h3 className="font-semibold text-lg">{ch.channelName}</h3><p className="text-sm text-gray-500">Niche: {ch.niche}</p><p className="text-sm text-gray-500">Frequency: {ch.postingFrequency}</p></div>
                  <button onClick={() => deleteChannel(ch.id)} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
                </div>
              </div>
            ))}</div>}
          </div>
        )}
        {tab === 'videos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">🎬 Videos</h2>
              <button onClick={() => setShowGenerate(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">+ Generate Video</button>
            </div>
            {videos.length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
                <p className="text-gray-400 text-lg mb-4">No videos yet</p>
                <button onClick={() => setShowGenerate(true)} className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700">🎬 Generate Your First Video</button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="text-left px-4 py-3 font-medium text-gray-600">Title</th><th className="text-left px-4 py-3 font-medium text-gray-600">Channel</th><th className="text-left px-4 py-3 font-medium text-gray-600">Status</th><th className="text-left px-4 py-3 font-medium text-gray-600">Views</th><th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th></tr></thead>
                  <tbody>{videos.map(v => (
                    <tr key={v.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{v.title}</td>
                      <td className="px-4 py-3 text-gray-500">{v.channel?.channelName}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[v.status] || 'bg-gray-100'}`}>{v.status}</span></td>
                      <td className="px-4 py-3 text-gray-500">{v.views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          {v.status !== 'published' && <button onClick={() => advanceStatus(v)} className="text-green-600 hover:text-green-800 text-xs px-2 py-1 rounded hover:bg-green-50">→ Advance</button>}
                          <button onClick={() => deleteVideo(v.id)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {tab === 'settings' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">⚙️ Settings</h2>
            <p className="text-gray-500">Settings panel coming soon. Configure AI providers, API keys, and automation rules here.</p>
          </div>
        )}
      </div>
      {showAddChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddChannel(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl mx-4">
            <h2 className="text-lg font-semibold mb-4">📺 Add New Channel</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Channel Name *</label><input value={channelForm.channelName} onChange={e => setChannelForm({ ...channelForm, channelName: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="My YouTube Channel" /></div>
              <div><label className="block text-sm font-medium mb-1">Niche *</label><input value={channelForm.niche} onChange={e => setChannelForm({ ...channelForm, niche: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Tech, Gaming, Education..." /></div>
              <div><label className="block text-sm font-medium mb-1">Posting Frequency</label><select value={channelForm.postingFrequency} onChange={e => setChannelForm({ ...channelForm, postingFrequency: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="biweekly">Bi-Weekly</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Target Audience</label><input value={channelForm.targetAudience} onChange={e => setChannelForm({ ...channelForm, targetAudience: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="18-35 year olds interested in tech" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6"><button onClick={() => setShowAddChannel(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button><button onClick={addChannel} disabled={!channelForm.channelName || !channelForm.niche} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Add Channel</button></div>
          </div>
        </div>
      )}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowGenerate(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl mx-4">
            <h2 className="text-lg font-semibold mb-4">🎬 Generate Video</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Topic *</label><input value={genForm.topic} onChange={e => setGenForm({ ...genForm, topic: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="How to use AI tools" /></div>
              <div><label className="block text-sm font-medium mb-1">Style</label><select value={genForm.style} onChange={e => setGenForm({ ...genForm, style: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="tutorial">Tutorial</option><option value="review">Review</option><option value="vlog">Vlog</option><option value="educational">Educational</option><option value="entertainment">Entertainment</option></select></div>
              {channels.length > 0 && <div><label className="block text-sm font-medium mb-1">Channel</label><select value={genForm.channelId} onChange={e => setGenForm({ ...genForm, channelId: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="">Select channel...</option>{channels.map(ch => <option key={ch.id} value={ch.id}>{ch.channelName}</option>)}</select></div>}
            </div>
            <div className="flex justify-end gap-3 mt-6"><button onClick={() => setShowGenerate(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button><button onClick={generateVideo} disabled={!genForm.topic} className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">Generate</button></div>
          </div>
        </div>
      )}
    </div>
  )
}