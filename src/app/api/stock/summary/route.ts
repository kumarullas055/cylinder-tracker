import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const movements = await prisma.stockMovement.groupBy({
      by: ['type'],
      _sum: { quantity: true },
    })

    const full = movements.find(m => m.type === 'FULL')?._sum.quantity || 0
    const empty = movements.find(m => m.type === 'EMPTY')?._sum.quantity || 0

    return NextResponse.json({ full, empty })
  } catch (error) {
    console.error('Stock summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}