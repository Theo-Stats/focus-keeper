import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Play, Pause, StopCircle, Clock, Target } from 'lucide-react'

interface FocusState {
  is_running: boolean
  elapsed: number
  target: number
  is_strict_mode: boolean
}

export function FocusMode() {
  const [focusState, setFocusState] = useState<FocusState>({
    is_running: false,
    elapsed: 0,
    target: 25 * 60,
    is_strict_mode: false,
  })
  const [strictMode, setStrictMode] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState(25)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = focusState.target > 0 
    ? (focusState.elapsed / focusState.target) * 100 
    : 0

  useEffect(() => {
    const unlisten = listen<FocusState>('focus-tick', (event) => {
      setFocusState(event.payload)
    })

    const unlistenComplete = listen<{ duration: number }>('focus-complete', async (event) => {
      await invoke('add_focus_time', { seconds: event.payload.duration })
      await invoke('add_block', { website: false })
      setFocusState(prev => ({ ...prev, is_running: false }))
    })

    return () => {
      unlisten.then(f => f())
      unlistenComplete.then(f => f())
    }
  }, [])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    if (focusState.is_running) {
      interval = setInterval(async () => {
        const state = await invoke<FocusState>('get_focus_state')
        setFocusState(state)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [focusState.is_running])

  const startFocus = async () => {
    const state = await invoke<FocusState>('start_focus', {
      targetMinutes: selectedDuration,
      strictMode,
    })
    setFocusState(state)
    invoke('run_focus_timer')
  }

  const pauseFocus = async () => {
    const state = await invoke<FocusState>('pause_focus')
    setFocusState(state)
  }

  const resumeFocus = async () => {
    const state = await invoke<FocusState>('resume_focus')
    setFocusState(state)
    invoke('run_focus_timer')
  }

  const stopFocus = async () => {
    const state = await invoke<FocusState>('stop_focus')
    setFocusState(state)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            专注模式
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="relative w-64 h-64">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={strictMode ? '#dc2626' : '#3b82f6'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Clock className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-4xl font-bold text-gray-900">
                  {formatTime(focusState.target - focusState.elapsed)}
                </span>
                <span className="text-sm text-gray-500 mt-1">
                  {selectedDuration} 分钟
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            {[15, 25, 45, 60].map((mins) => (
              <Button
                key={mins}
                variant={selectedDuration === mins ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedDuration(mins)}
                disabled={focusState.is_running}
              >
                {mins}m
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">严格模式</span>
              <Switch
                checked={strictMode}
                onCheckedChange={setStrictMode}
                disabled={focusState.is_running}
              />
            </div>
            {strictMode && (
              <Badge variant="destructive">开启后将屏蔽所有干扰</Badge>
            )}
          </div>

          <div className="flex justify-center gap-4">
            {!focusState.is_running ? (
              focusState.elapsed > 0 ? (
                <>
                  <Button variant="primary" size="lg" onClick={resumeFocus}>
                    <Play className="w-5 h-5 mr-2" />
                    继续
                  </Button>
                  <Button variant="destructive" size="lg" onClick={stopFocus}>
                    <StopCircle className="w-5 h-5 mr-2" />
                    停止
                  </Button>
                </>
              ) : (
                <Button variant="primary" size="lg" onClick={startFocus}>
                  <Play className="w-5 h-5 mr-2" />
                  开始专注
                </Button>
              )
            ) : (
              <Button variant="secondary" size="lg" onClick={pauseFocus}>
                <Pause className="w-5 h-5 mr-2" />
                暂停
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
