"use client"

import { Suspense } from 'react'
import { NewPricingForm } from './new-pricing-form'

export default function NewPricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950"><div className="text-slate-400">Loading...</div></div>}>
      <NewPricingForm />
    </Suspense>
  )
}