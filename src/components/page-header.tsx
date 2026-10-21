"use client"

import Link from 'next/link'
import { Home } from 'lucide-react'
import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description: string
  actions?: ReactNode
  showHomeLink?: boolean
}

export function PageHeader({ title, description, actions, showHomeLink = true }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        {showHomeLink && (
          <Link href="/" className="btn-ghost p-2 hover:bg-slate-800/50 transition-colors" title="Dashboard">
            <Home className="w-5 h-5 text-slate-400 hover:text-white" />
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-slate-400 mt-1">{description}</p>
        </div>
      </div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  )
}