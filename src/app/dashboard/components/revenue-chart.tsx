"use client"

import { useEffect, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const chartData = [
  { date: 'Oct 15', expected: 2450000, collected: 2380000, profit: 122500 },
  { date: 'Oct 16', expected: 2680000, collected: 2610000, profit: 134000 },
  { date: 'Oct 17', expected: 2340000, collected: 2290000, profit: 117000 },
  { date: 'Oct 18', expected: 2890000, collected: 2820000, profit: 144500 },
  { date: 'Oct 19', expected: 2560000, collected: 2490000, profit: 128000 },
  { date: 'Oct 20', expected: 2750000, collected: 2680000, profit: 137500 },
  { date: 'Oct 21', expected: 2751000, collected: 1834000, profit: 91700 },
]

const totalExpected = chartData.reduce((sum, d) => sum + d.expected, 0)
const totalCollected = chartData.reduce((sum, d) => sum + d.collected, 0)
const totalProfit = chartData.reduce((sum, d) => sum + d.profit, 0)
const collectionRate = ((totalCollected / totalExpected) * 100).toFixed(1)

export function RevenueChart() {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Trigger reflow for responsive container
    if (chartRef.current) {
      chartRef.current.style.width = '100%'
    }
  }, [])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="font-medium text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="flex items-center gap-2 text-sm">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-300">{entry.name}:</span>
              <span className="font-medium text-white">{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="glass rounded-2xl border border-slate-700/50 p-6" ref={chartRef}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-brand-400" />
          <h3 className="text-lg font-semibold text-white">Revenue Trend (7 Days)</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span>Profit: {formatCurrency(totalProfit)}</span>
          </div>
          <div className="flex items-center gap-1 text-brand-400">
            <span>{collectionRate}%</span>
            <span className="text-slate-500">collected</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(71, 85, 105, 0.3)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="rgba(148, 163, 184, 0.5)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b' }}
            />
            <YAxis
              stroke="rgba(148, 163, 184, 0.5)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b' }}
              tickFormatter={(value) => formatCurrency(value).replace('₹', '').replace(/,/g, '') + 'K'}
              orientation="right"
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Expected Cash Area */}
            <Area
              type="monotone"
              dataKey="expected"
              stroke="rgba(234, 88, 12, 0.5)"
              fillOpacity={0.1}
              fill="rgba(234, 88, 12, 0.1)"
              strokeWidth={1}
            />
            {/* Collected Cash Area */}
            <Area
              type="monotone"
              dataKey="collected"
              stroke="rgba(16, 185, 129, 0.5)"
              fillOpacity={0.15}
              fill="rgba(16, 185, 129, 0.15)"
              strokeWidth={1}
            />
            {/* Expected Line */}
            <Line
              type="monotone"
              dataKey="expected"
              stroke="#ea580c"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 6, fill: '#ea580c', strokeWidth: 2 }}
            />
            {/* Collected Line */}
            <Line
              type="monotone"
              dataKey="collected"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2 }}
            />
            {/* Profit Line */}
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: '#f59e0b', strokeWidth: 2 }}
              yAxisId="right"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-1.5 bg-brand-500/50 border-t border-brand-500 border-dashed" />
          <span className="text-sm text-slate-400">Expected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-2.5 bg-emerald-500 rounded" />
          <span className="text-sm text-slate-400">Collected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1.5 bg-amber-500 rounded" />
          <span className="text-sm text-slate-400">Profit</span>
        </div>
      </div>
    </div>
  )
}