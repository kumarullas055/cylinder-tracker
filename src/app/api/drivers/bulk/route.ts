import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { confirm, confirmText } = body

    // Double confirmation required
    if (!confirm || confirmText !== 'DELETE ALL DRIVERS') {
      return NextResponse.json({ 
        error: 'Double confirmation required. Send { "confirm": true, "confirmText": "DELETE ALL DRIVERS" }' 
      }, { status: 400 })
    }

    // Get all active drivers
    const drivers = await prisma.driver.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
    })

    if (drivers.length === 0) {
      return NextResponse.json({ success: true, message: 'No active drivers to delete', deleted: 0 })
    }

    // Soft delete all active drivers
    const result = await prisma.driver.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    // Audit log for each deleted driver
    await Promise.all(
      drivers.map(driver =>
        prisma.auditLog.create({
          data: {
            entityType: 'Driver',
            entityId: driver.id,
            action: 'BULK_DELETE',
            oldValues: JSON.stringify({ isActive: true, code: driver.code, name: driver.name }),
            newValues: JSON.stringify({ isActive: false }),
            userId: (session.user as any).id,
          },
        })
      )
    )

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${result.count} drivers`,
      deleted: result.count,
      drivers: drivers.map(d => ({ id: d.id, code: d.code, name: d.name }))
    })
  } catch (error) {
    console.error('Bulk delete drivers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}