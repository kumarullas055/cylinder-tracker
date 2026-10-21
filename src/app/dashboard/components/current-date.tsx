"use client"

import { useEffect, useState } from 'react'

export function CurrentDate() {
  const [date, setDate] = useState<string>('')

  useEffect(() => {
    const updateDate = () => {
      setDate(new Date().toLocaleDateString('en-IN', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }))
    }
    updateDate()
    const interval = setInterval(updateDate, 60000)
    return () => clearInterval(interval)
  }, [])

  return <time className="font-mono">{date}</time>
}