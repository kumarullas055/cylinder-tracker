import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const validSettings = [
  'low_stock_threshold_full',
  'low_stock_threshold_empty',
  'default_dues_threshold',
  'default_cylinders_per_driver',
  'auto_close_time',
  'company_name',
  'company_phone',
  'company_address',
]

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: validSettings } },
      orderBy: { category: 'asc' },
    })
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate keys
    const invalidKeys = Object.keys(body).filter(key => !validSettings.includes(key))
    if (invalidKeys.length > 0) {
      return NextResponse.json({ error: `Invalid settings: ${invalidKeys.join(', ')}` }, { status: 400 })
    }

    // Upsert each setting
    await Promise.all(
      Object.entries(body).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value), category: getCategory(key) },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings POST error:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}

function getCategory(key: string): string {
  const categories: Record<string, string> = {
    low_stock_threshold_full: 'STOCK',
    low_stock_threshold_empty: 'STOCK',
    default_dues_threshold: 'DRIVERS',
    default_cylinders_per_driver: 'ALLOCATIONS',
    auto_close_time: 'ALLOCATIONS',
    company_name: 'GENERAL',
    company_phone: 'GENERAL',
    company_address: 'GENERAL',
  }
  return categories[key] || 'GENERAL'
}