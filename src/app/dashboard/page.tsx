'use client'

import { FormBuilder } from '@/components/FormBuilder'
import { CmdKPrompt } from '@/components/CmdKPrompt'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6">
        <h1 className="text-lg font-semibold">My workspace</h1>
        <Button variant="default" size="sm">
          + New form
        </Button>
      </header>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <FormBuilder />
          <CmdKPrompt />
        </div>
      </div>
    </div>
  )
}
