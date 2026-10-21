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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'active'

    const where: any = {}
    if (status === 'active') where.isActive = true
    else if (status === 'inactive') where.isActive = false

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        include: {
          _count: { select: { allocations: true } },
        },
        orderBy: { code: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.driver.count({ where }),
    ])

    return NextResponse.json({
      drivers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Drivers API error:', error)
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
    const { code, name, phone, vehicleNumber, vehicleType, licenseNumber, licenseExpiry, joiningDate, duesThreshold } = body

    // Validate required fields
    if (!code || !name || !phone || !joiningDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const upperCode = code.toUpperCase()

    // Check for existing driver with same code (exact match)
    const existingByCode = await prisma.driver.findUnique({
      where: { code: upperCode },
    })

    // Check for existing driver with same phone
    const existingByPhone = await prisma.driver.findUnique({
      where: { phone },
    })

    // If code exists
    if (existingByCode) {
      if (!existingByCode.isActive) {
        // Reactivate inactive driver with same code
        const updated = await prisma.driver.update({
          where: { id: existingByCode.id },
          data: {
            name,
            phone,
            vehicleNumber: vehicleNumber?.toUpperCase() || null,
            vehicleType: vehicleType || null,
            licenseNumber: licenseNumber || null,
            licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
            joiningDate: new Date(joiningDate),
            duesThreshold: duesThreshold || 500000,
            isActive: true,
          },
        })
        await prisma.auditLog.create({
          data: {
            entityType: 'Driver',
            entityId: existingByCode.id,
            action: 'REACTIVATE',
            oldValues: JSON.stringify({ isActive: false, code: existingByCode.code, name: existingByCode.name }),
            newValues: JSON.stringify({ isActive: true, code: updated.code, name: updated.name }),
            userId: (session.user as any).id,
          },
        })
        return NextResponse.json({ ...updated, reactivated: true })
      }
      // Active driver with same code exists
      return NextResponse.json({ error: 'Driver code already exists' }, { status: 400 })
    }

    // If phone exists (different code but same phone)
    if (existingByPhone) {
      if (!existingByPhone.isActive) {
        // Reactivate inactive driver with same phone
        const updated = await prisma.driver.update({
          where: { id: existingByPhone.id },
          data: {
            code: upperCode,
            name,
            phone,
            vehicleNumber: vehicleNumber?.toUpperCase() || null,
            vehicleType: vehicleType || null,
            licenseNumber: licenseNumber || null,
            licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
            joiningDate: new Date(joiningDate),
            duesThreshold: duesThreshold || 500000,
            isActive: true,
          },
        })
        await prisma.auditLog.create({
          data: {
            entityType: 'Driver',
            entityId: existingByPhone.id,
            action: 'REACTIVATE',
            oldValues: JSON.stringify({ isActive: false, code: existingByPhone.code, name: existingByPhone.name, phone: existingByPhone.phone }),
            newValues: JSON.stringify({ isActive: true, code: updated.code, name: updated.name, phone: updated.phone }),
            userId: (session.user as any).id,
          },
        })
        return NextResponse.json({ ...updated, reactivated: true })
      }
      // Active driver with same phone exists
      return NextResponse.json({ error: 'Phone number already exists' }, { status: 400 })
    }

    // Create new driver
    const driver = await prisma.driver.create({
      data: {
        code: upperCode,
        name,
        phone,
        vehicleNumber: vehicleNumber?.toUpperCase() || null,
        vehicleType: vehicleType || null,
        licenseNumber: licenseNumber || null,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        joiningDate: new Date(joiningDate),
        duesThreshold: duesThreshold || 500000,
        isActive: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'Driver',
        entityId: driver.id,
        action: 'CREATE',
        newValues: JSON.stringify(driver),
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(driver, { status: 201 })
  } catch (error) {
    console.error('Create driver error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}