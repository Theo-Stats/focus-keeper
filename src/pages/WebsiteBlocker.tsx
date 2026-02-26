import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Shield, Trash2, Plus, Globe } from 'lucide-react'

interface WebsiteBlockResult {
  success: boolean
  message: string
  data?: string[]
}

export function WebsiteBlocker() {
  const [blockedWebsites, setBlockedWebsites] = useState<string[]>([])
  const [newWebsite, setNewWebsite] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadBlockedWebsites()
  }, [])

  const loadBlockedWebsites = async () => {
    try {
      const result = await invoke<WebsiteBlockResult>('get_blocked_websites')
      if (result.success && result.data) {
        setBlockedWebsites(result.data)
      }
    } catch (error) {
      console.error('Failed to load blocked websites:', error)
    }
  }

  const addWebsite = async () => {
    if (!newWebsite.trim()) return

    setLoading(true)
    try {
      const result = await invoke<WebsiteBlockResult>('add_website', { domain: newWebsite.trim() })
      if (result.success) {
        setBlockedWebsites(prev => [...prev, newWebsite.trim()])
        setNewWebsite('')
        setMessage({ type: 'success', text: '网站已添加到黑名单' })
        await invoke('add_block', { website: true })
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: String(error) })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const removeWebsite = async (website: string) => {
    try {
      const result = await invoke<WebsiteBlockResult>('remove_website', { domain: website })
      if (result.success) {
        setBlockedWebsites(prev => prev.filter(w => w !== website))
        setMessage({ type: 'success', text: '网站已从黑名单移除' })
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: String(error) })
    } finally {
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const unblockAll = async () => {
    try {
      const result = await invoke<WebsiteBlockResult>('unblock_all')
      if (result.success) {
        setBlockedWebsites([])
        setMessage({ type: 'success', text: '已解除所有网站屏蔽' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: String(error) })
    } finally {
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addWebsite()
    }
  }

  const commonWebsites = [
    'weibo.com',
    'douyin.com',
    'bilibili.com',
    'youtube.com',
    'twitter.com',
    'facebook.com',
    'reddit.com',
    'instagram.com'
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            网站屏蔽
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="输入要屏蔽的网站，例如：weibo.com"
              value={newWebsite}
              onChange={(e) => setNewWebsite(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button variant="primary" onClick={addWebsite} disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              添加
            </Button>
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {commonWebsites.map((site) => (
              <Button
                key={site}
                variant="outline"
                size="sm"
                onClick={() => setNewWebsite(site)}
                disabled={blockedWebsites.includes(site) || loading}
              >
                {site}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              已屏蔽的网站
            </CardTitle>
            {blockedWebsites.length > 0 && (
              <Button variant="destructive" size="sm" onClick={unblockAll}>
                <Trash2 className="w-4 h-4 mr-2" />
                全部解除
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {blockedWebsites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无屏蔽的网站
            </div>
          ) : (
            <div className="space-y-2">
              {blockedWebsites.map((website) => (
                <div
                  key={website}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span>{website}</span>
                    <Badge variant="secondary">已屏蔽</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWebsite(website)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
