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
    const driverId = searchParams.get('driverId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const targetDate = new Date(date + 'T00:00:00.000Z')
    const endDate = new Date(targetDate.getTime() + 24*60*60*1000)

    const where: any = { date: { gte: targetDate, lt: endDate } }
    if (driverId) where.driverId = driverId

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { driver: { select: { id: true, code: true, name: true } }, allocation: { select: { expectedCash: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ])

    return NextResponse.json({ payments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('Payments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { driverId, allocationId, date, amount, method, notes } = body

    if (!driverId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const payment = await prisma.payment.create({
      data: {
        driverId,
        allocationId: allocationId || null,
        date: new Date(date + 'T00:00:00.000Z'),
        amount,
        method: method || 'CASH',
        notes: notes || null,
        recordedById: (session.user as any).id,
      },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'Payment',
        entityId: payment.id,
        action: 'CREATE',
        newValues: JSON.stringify(payment),
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}