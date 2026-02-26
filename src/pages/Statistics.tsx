import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Shield, Smartphone, RotateCcw, TrendingUp } from 'lucide-react'

interface DailyStats {
  date: string
  focus_duration_seconds: number
  block_count: number
  websites_blocked: number
  apps_blocked: number
}

interface StatsData {
  today: DailyStats
  total_focus_seconds: number
  total_blocks: number
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟 ${secs}秒`
  }
  return `${secs}秒`
}

export function Statistics() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await invoke<StatsData>('get_stats')
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      const data = await invoke<StatsData>('reset_stats')
      setStats(data)
    } catch (error) {
      console.error('Failed to reset stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载失败</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">数据统计</h2>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          重置统计
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              今日专注时长
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.today.focus_duration_seconds)}</div>
            <p className="text-xs text-gray-500 mt-1">
              总计：{formatDuration(stats.total_focus_seconds)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              今日拦截次数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today.block_count}</div>
            <p className="text-xs text-gray-500 mt-1">
              总计：{stats.total_blocks}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              网站拦截
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today.websites_blocked}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              应用拦截
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today.apps_blocked}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>专注进度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">今日目标</span>
              <Badge variant={stats.today.focus_duration_seconds >= 120 * 60 ? 'success' : 'default'}>
                {Math.round((stats.today.focus_duration_seconds / (120 * 60)) * 100)}%
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min((stats.today.focus_duration_seconds / (120 * 60)) * 100, 100)}%` 
                }}
              />
            </div>
            <p className="text-xs text-gray-500">
              目标：每天专注 2 小时
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>拦截详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm">网站屏蔽</span>
              </div>
              <span className="text-sm font-medium">{stats.today.websites_blocked} 次</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-md">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-red-600" />
                <span className="text-sm">应用关闭</span>
              </div>
              <span className="text-sm font-medium">{stats.today.apps_blocked} 次</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
