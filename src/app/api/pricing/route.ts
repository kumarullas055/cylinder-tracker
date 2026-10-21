import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const periods = await prisma.pricePeriod.findMany({
      orderBy: { effectiveFrom: 'desc' },
    })

    return NextResponse.json(periods)
  } catch (error) {
    console.error('Pricing GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { effectiveFrom, cylinderPrice, costPrice, margin, notes } = body

    if (!effectiveFrom || !cylinderPrice || !costPrice || margin === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (costPrice >= cylinderPrice) {
      return NextResponse.json({ error: 'Cost price must be less than selling price' }, { status: 400 })
    }

    // Deactivate other periods if this is set as active
    await prisma.pricePeriod.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    const period = await prisma.pricePeriod.create({
      data: {
        effectiveFrom: new Date(effectiveFrom + 'T00:00:00.000Z'),
        cylinderPrice,
        costPrice,
        margin,
        notes: notes || null,
        isActive: true,
        createdById: (session.user as any).id,
      },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'PricePeriod',
        entityId: period.id,
        action: 'CREATE',
        newValues: JSON.stringify(period),
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(period, { status: 201 })
  } catch (error) {
    console.error('Create pricing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}