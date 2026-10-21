"use client"

import { Suspense } from 'react'
import { SettingsForm } from './settings-form'

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950"><div className="text-slate-400">Loading...</div></div>}>
      <SettingsForm />
    </Suspense>
  )
}