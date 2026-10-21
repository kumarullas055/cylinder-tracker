"use client"

import { Suspense } from 'react'
import { NewPaymentForm } from './new-payment-form'

export default function NewPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950"><div className="text-slate-400">Loading...</div></div>}>
      <NewPaymentForm />
    </Suspense>
  )
}