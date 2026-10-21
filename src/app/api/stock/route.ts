import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const type = searchParams.get('type')

    const targetDate = new Date(date + 'T00:00:00.000Z')
    const endDate = new Date(targetDate.getTime() + 24*60*60*1000)

    const where: any = { date: { gte: targetDate, lt: endDate } }
    if (type) where.type = type

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(movements)
  } catch (error) {
    console.error('Stock GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { type, movementType, quantity, notes, date } = body

    if (!type || !movementType || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const movement = await prisma.stockMovement.create({
      data: {
        type,
        movementType,
        quantity,
        notes: notes || null,
        date: new Date(date + 'T00:00:00.000Z'),
        recordedById: (session.user as any).id,
      },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'StockMovement',
        entityId: movement.id,
        action: 'CREATE',
        newValues: JSON.stringify(movement),
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(movement, { status: 201 })
  } catch (error) {
    console.error('Create stock movement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}