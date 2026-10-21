import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const driverId = searchParams.get('driverId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const targetDate = new Date(date + 'T00:00:00.000Z')
    const endDate = new Date(targetDate.getTime() + 24*60*60*1000)

    const where: any = {
      date: { gte: targetDate, lt: endDate },
    }
    if (driverId) where.driverId = driverId
    if (status) where.status = status

    const [allocations, total] = await Promise.all([
      prisma.dailyAllocation.findMany({
        where,
        include: {
          driver: { select: { id: true, code: true, name: true, phone: true } },
          payments: { select: { amount: true } },
        },
        orderBy: { driver: { code: 'asc' } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dailyAllocation.count({ where }),
    ])

    return NextResponse.json({
      allocations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Allocations GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, allocations } = body

    if (!date || !allocations || !Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const targetDate = new Date(date + 'T00:00:00.000Z')

    // Get current price for expected cash calculation
    const currentPrice = await prisma.pricePeriod.findFirst({
      where: { effectiveFrom: { lte: targetDate }, isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    })
    const pricePerCylinder = currentPrice?.cylinderPrice || 91700

    // Create allocations in transaction
    const created = await prisma.$transaction(async (tx) => {
      const results = []
      for (const alloc of allocations) {
        const { driverId, fullCylindersIssued } = alloc
        if (!driverId || !fullCylindersIssued || fullCylindersIssued <= 0) continue

        // Check if allocation already exists
        const existing = await tx.dailyAllocation.findUnique({
          where: { driverId_date: { driverId, date: targetDate } },
        })
        if (existing) continue

        // Create allocation
        const allocation = await tx.dailyAllocation.create({
          data: {
            driverId,
            date: targetDate,
            fullCylindersIssued,
            fullCylindersSold: 0,
            fullCylindersReturned: 0,
            emptyCylindersCollected: 0,
            expectedCash: 0, // Will be updated at closeout
            status: 'PENDING',
            createdById: (session.user as any).id,
          },
        })

        // Create stock movement for issued cylinders
        await tx.stockMovement.create({
          data: {
            type: 'FULL',
            movementType: 'ISSUED_TO_DRIVER',
            quantity: fullCylindersIssued,
            date: targetDate,
            referenceId: allocation.id,
            referenceType: 'ALLOCATION',
            notes: `Morning issue to driver`,
            recordedById: (session.user as any).id,
          },
        })

        results.push(allocation)
      }
      return results
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'DailyAllocation',
        entityId: 'bulk',
        action: 'CREATE',
        newValues: JSON.stringify({ date, count: created.length }),
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json({ created: created.length, allocations: created }, { status: 201 })
  } catch (error) {
    console.error('Create allocations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}