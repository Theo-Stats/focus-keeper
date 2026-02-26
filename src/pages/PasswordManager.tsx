import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Unlock, Key, Shield } from 'lucide-react'

interface LockResult {
  success: boolean
  message: string
}

interface LockState {
  is_locked: boolean
  remaining_seconds: number | null
  has_password: boolean
}

export function PasswordManager() {
  const [lockState, setLockState] = useState<LockState | null>(null)
  const [showUnlock, setShowUnlock] = useState(false)
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  useEffect(() => {
    loadLockState()
  }, [])

  useEffect(() => {
    if (lockState?.is_locked && lockState.remaining_seconds) {
      setCountdown(lockState.remaining_seconds)
      const timer = setInterval(async () => {
        setCountdown(prev => {
          if (prev && prev > 0) {
            return prev - 1
          }
          return null
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [lockState?.is_locked])

  const loadLockState = async () => {
    try {
      const state = await invoke<LockState>('get_lock_state')
      setLockState(state)
    } catch (error) {
      console.error('Failed to load lock state:', error)
    }
  }

  const handleSetPassword = async () => {
    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: '密码至少需要 4 位' })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的密码不一致' })
      return
    }

    try {
      const result = await invoke<LockResult>('set_password', { password: newPassword })
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setPassword('')
        setNewPassword('')
        setConfirmPassword('')
        loadLockState()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: String(error) })
    } finally {
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleUnlock = async () => {
    try {
      const result = await invoke<LockResult>('unlock', { password })
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setShowUnlock(false)
        setPassword('')
        loadLockState()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: String(error) })
    } finally {
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleLock = async (minutes: number) => {
    try {
      const result = await invoke<LockResult>('lock_focus', { minutes })
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        loadLockState()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: String(error) })
    } finally {
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!lockState) {
    return <div className="text-center py-4">加载中...</div>
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {lockState.is_locked ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Lock className="w-5 h-5" />
              专注锁定中
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 font-mono">
                {countdown ? formatTime(countdown) : '--:--'}
              </div>
              <p className="text-sm text-red-600 mt-2">锁定期间无法修改屏蔽设置</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={() => setShowUnlock(true)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Unlock className="w-4 h-4 mr-2" />
                输入密码解锁
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                密码保护
              </CardTitle>
              {lockState.has_password && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowUnlock(true)}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  锁定专注模式
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!lockState.has_password ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  设置密码后，可以锁定专注模式，防止自己随意修改屏蔽设置
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">设置密码（至少 4 位）</div>
                    <Input
                      type="password"
                      placeholder="输入密码"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">确认密码</div>
                    <Input
                      type="password"
                      placeholder="再次输入密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={handleSetPassword}
                    className="w-full"
                    disabled={!newPassword || !confirmPassword}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    设置密码
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  密码已设置，可以选择锁定专注模式
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleLock(25)}
                    className="flex-1"
                  >
                    专注 25 分钟
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleLock(45)}
                    className="flex-1"
                  >
                    专注 45 分钟
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleLock(60)}
                    className="flex-1"
                  >
                    专注 60 分钟
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showUnlock && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5" />
              输入密码解锁
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleUnlock} className="flex-1">
                解锁
              </Button>
              <Button variant="outline" onClick={() => setShowUnlock(false)} className="flex-1">
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
