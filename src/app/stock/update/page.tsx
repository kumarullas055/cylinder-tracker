"use client"

import { Suspense } from 'react'
import { StockUpdateForm } from './stock-update-form'

export default function StockUpdatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950"><div className="text-slate-400">Loading...</div></div>}>
      <StockUpdateForm />
    </Suspense>
  )
}