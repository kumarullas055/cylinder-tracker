"use client"

import { Suspense } from 'react'
import { NewAllocationForm } from './new-form'

export default function NewAllocationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950"><div className="text-slate-400">Loading...</div></div>}>
      <NewAllocationForm />
    </Suspense>
  )
}