import { useState } from 'react'
import { FocusMode } from '@/pages/FocusMode'
import { WebsiteBlocker } from '@/pages/WebsiteBlocker'
import { AppBlocker } from '@/pages/AppBlocker'
import { Statistics } from '@/pages/Statistics'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Target, Shield, Smartphone, BarChart3 } from 'lucide-react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('focus')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Focus Keeper</h1>
              <p className="text-sm text-gray-500">不做手机控 - 专注时间管理</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start mb-6">
            <TabsTrigger value="focus" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              专注模式
            </TabsTrigger>
            <TabsTrigger value="websites" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              网站屏蔽
            </TabsTrigger>
            <TabsTrigger value="apps" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              应用屏蔽
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              数据统计
            </TabsTrigger>
          </TabsList>

          <TabsContent value="focus">
            <FocusMode />
          </TabsContent>

          <TabsContent value="websites">
            <WebsiteBlocker />
          </TabsContent>

          <TabsContent value="apps">
            <AppBlocker />
          </TabsContent>

          <TabsContent value="stats">
            <Statistics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App
