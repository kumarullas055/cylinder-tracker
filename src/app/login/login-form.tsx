"use client"

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Cylinder, Lock, AlertCircle, Eye, EyeOff, Loader2, Shield, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [shake, setShake] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setShake(false)

    if (!email || !password) {
      setFormError('Please enter both email and password')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setFormError('Invalid email or password')
        setShake(true)
        setTimeout(() => setShake(false), 500)
      } else {
        // Success animation
        setFormError('')
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setFormError('Something went wrong. Please try again.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-slate-900/50" />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-slate-300/5 rounded-full blur-3xl animate-pulse-slow delay-2000" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      </div>

      {/* Main Content */}
      <main className="relative min-h-screen flex items-center justify-center p-4">
        <div className={cn(
          'w-full max-w-md relative z-10',
          shake && 'animate-shake'
        )}>
          
          {/* Logo & Brand */}
          <div className="text-center mb-10 animate-fade-in-down">
            <Link href="/login" className="inline-flex items-center gap-3 mb-6">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-xl shadow-orange-500/30">
                <Cylinder className="w-10 h-10 text-white" strokeWidth={2} />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-white tracking-tight">CylinTrack</h1>
                <p className="text-orange-200/80 text-sm font-medium">Every Cylinder Accounted For</p>
              </div>
            </Link>
            
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-orange-100/70">Sign in to manage your LPG distribution</p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 animate-fade-in-up">
            {/* Error Messages */}
            {(error || formError) && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-slide-in">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-red-300 text-sm">
                  <p className="font-medium">Authentication Failed</p>
                  <p className="mt-1 opacity-80">
                    {error === 'CredentialsSignin' ? 'Invalid email or password' : 
                     error === 'Callback' ? 'Authentication callback failed' :
                     formError || 'Please check your credentials'}
                  </p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-orange-100/80 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@cylintrack.com"
                    className="w-full px-4 py-3.5 pr-12 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                    disabled={isLoading}
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-orange-100/80">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-sm text-orange-400 hover:text-orange-300 transition-colors font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3.5 pr-12 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-orange-400 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-lg shadow-orange-500/25 active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Security Badge */}
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <div className="flex items-center justify-center gap-4 text-slate-500 text-sm">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Encrypted</span>
                </div>
                <div className="w-px h-4 bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Secure Session</span>
                </div>
                <div className="w-px h-4 bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <Cylinder className="w-4 h-4 text-orange-400" />
                  <span>CylinTrack</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-slate-500/60 text-sm animate-fade-in-up delay-200">
            <p>Built for LPG distributors who demand precision</p>
            <p className="mt-1 font-medium text-orange-400/70">CylinTrack v1.0</p>
          </div>
        </div>
      </main>

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.6s ease-out; }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out 0.2s both; }
        .animate-fade-in-up.delay-200 { animation-delay: 0.4s; }
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-pulse-slow.delay-1000 { animation-delay: 1s; }
        .animate-pulse-slow.delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  )
}