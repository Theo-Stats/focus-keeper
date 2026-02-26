import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Smartphone, Trash2, Plus, RefreshCw } from 'lucide-react'

interface ProcessInfo {
  name: string
  pid: number
  exe?: string
}

interface ProcessResult {
  success: boolean
  message: string
  processes?: ProcessInfo[]
  killed_count?: number
}

export function AppBlocker() {
  const [blockedApps, setBlockedApps] = useState<string[]>([])
  const [newApp, setNewApp] = useState('')
  const [runningApps, setRunningApps] = useState<ProcessInfo[]>([])
  const [autoKill, setAutoKill] = useState(true)
  const [monitoring, setMonitoring] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('blockedApps')
    if (saved) {
      setBlockedApps(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('blockedApps', JSON.stringify(blockedApps))
  }, [blockedApps])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    if (monitoring && autoKill) {
      interval = setInterval(async () => {
        for (const appName of blockedApps) {
          try {
            const result = await invoke<ProcessResult>('is_app_running_cmd', { name: appName })
            if (result.success && result.message.includes('is running')) {
              await invoke<ProcessResult>('kill_app_processes', { name: appName })
              await invoke('add_block', { website: false })
            }
          } catch (error) {
            console.error(`Error monitoring ${appName}:`, error)
          }
        }
      }, 2000)
    }

    return () => clearInterval(interval)
  }, [monitoring, autoKill, blockedApps])

  const addApp = async () => {
    if (!newApp.trim()) return

    const appNames = newApp.trim().split(',').map(a => a.trim()).filter(a => a)
    setBlockedApps(prev => [...new Set([...prev, ...appNames])])
    setNewApp('')
  }

  const removeApp = (appName: string) => {
    setBlockedApps(prev => prev.filter(a => a !== appName))
  }

  const checkRunningApps = async () => {
    setLoading(true)
    try {
      const result = await invoke<ProcessResult>('check_processes', { names: blockedApps })
      if (result.success && result.processes) {
        setRunningApps(result.processes)
      }
    } catch (error) {
      console.error('Failed to check running apps:', error)
    } finally {
      setLoading(false)
    }
  }

  const killApp = async (pid: number) => {
    try {
      await invoke<ProcessResult>('kill_process_cmd', { pid })
      await invoke('add_block', { website: false })
      checkRunningApps()
    } catch (error) {
      console.error('Failed to kill process:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addApp()
    }
  }

  const commonApps = [
    'WeChat',
    'QQ',
    'dingtalk',
    'Telegram',
    'Discord',
    'Steam',
    'Spotify',
    '网易云音乐'
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            应用屏蔽
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">自动关闭</span>
              <Switch checked={autoKill} onCheckedChange={setAutoKill} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">实时监控</span>
              <Switch checked={monitoring} onCheckedChange={setMonitoring} />
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="输入要屏蔽的应用名称，多个用逗号分隔"
              value={newApp}
              onChange={(e) => setNewApp(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button variant="primary" onClick={addApp}>
              <Plus className="w-4 h-4 mr-2" />
              添加
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {commonApps.map((app) => (
              <Button
                key={app}
                variant="outline"
                size="sm"
                onClick={() => setNewApp(app)}
                disabled={blockedApps.includes(app)}
              >
                {app}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>已屏蔽的应用</CardTitle>
            <Button variant="outline" size="sm" onClick={checkRunningApps} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              检查运行状态
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {blockedApps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无屏蔽的应用
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {blockedApps.map((appName) => {
                const isRunning = runningApps.some(app => 
                  app.name.toLowerCase().includes(appName.toLowerCase())
                )
                return (
                  <div
                    key={appName}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className={`w-4 h-4 ${isRunning ? 'text-green-600' : 'text-gray-400'}`} />
                      <span>{appName}</span>
                      {isRunning && <Badge variant="destructive">运行中</Badge>}
                      {!isRunning && <Badge variant="success">未运行</Badge>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeApp(appName)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {runningApps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>正在运行的进程</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {runningApps.map((app) => (
                <div
                  key={app.pid}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-red-600" />
                    <div>
                      <span className="font-medium">{app.name}</span>
                      <span className="text-xs text-gray-500 ml-2">PID: {app.pid}</span>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => killApp(app.pid)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    关闭
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
