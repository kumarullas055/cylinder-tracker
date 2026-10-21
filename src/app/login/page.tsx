"use client"

import { Suspense } from 'react'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950"><div className="text-slate-400">Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  )
}