import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if driver exists
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        _count: { select: { allocations: true, payments: true } },
      },
    })

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    // Soft delete - set isActive to false instead of hard delete
    // This preserves historical data
    const updated = await prisma.driver.update({
      where: { id },
      data: { isActive: false },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'Driver',
        entityId: id,
        action: 'DELETE',
        oldValues: JSON.stringify({ isActive: true, code: driver.code, name: driver.name }),
        newValues: JSON.stringify({ isActive: false }),
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json({ success: true, driver: updated })
  } catch (error) {
    console.error('Delete driver error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, phone, vehicleNumber, vehicleType, licenseNumber, licenseExpiry, isActive, duesThreshold } = body

    const driver = await prisma.driver.findUnique({ where: { id } })
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    // Check for duplicate phone if changing
    if (phone && phone !== driver.phone) {
      const existing = await prisma.driver.findFirst({
        where: { phone, NOT: { id } },
      })
      if (existing) {
        return NextResponse.json({ error: 'Phone number already exists' }, { status: 400 })
      }
    }

    const updated = await prisma.driver.update({
      where: { id },
      data: {
        name: name ?? driver.name,
        phone: phone ?? driver.phone,
        vehicleNumber: vehicleNumber ?? driver.vehicleNumber,
        vehicleType: vehicleType ?? driver.vehicleType,
        licenseNumber: licenseNumber ?? driver.licenseNumber,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : driver.licenseExpiry,
        isActive: isActive ?? driver.isActive,
        duesThreshold: duesThreshold ?? driver.duesThreshold,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'Driver',
        entityId: id,
        action: 'UPDATE',
        oldValues: JSON.stringify({ name: driver.name, phone: driver.phone, isActive: driver.isActive }),
        newValues: JSON.stringify({ name: updated.name, phone: updated.phone, isActive: updated.isActive }),
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update driver error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        allocations: {
          orderBy: { date: 'desc' },
          include: { payments: { select: { amount: true, method: true } } },
        },
        payments: { orderBy: { date: 'desc' } },
        deliveryProofs: { orderBy: { deliveredAt: 'desc' } },
      },
    })

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    return NextResponse.json(driver)
  } catch (error) {
    console.error('Get driver error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}