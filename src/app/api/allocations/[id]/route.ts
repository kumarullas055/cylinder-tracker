import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { fullCylindersSold, fullCylindersReturned, emptyCylindersCollected, expectedCash } = body

    // Validate
    if (fullCylindersSold === undefined || fullCylindersReturned === undefined || emptyCylindersCollected === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (fullCylindersSold < 0 || fullCylindersReturned < 0 || emptyCylindersCollected < 0) {
      return NextResponse.json({ error: 'Values cannot be negative' }, { status: 400 })
    }

    // Get existing allocation
    const existing = await prisma.dailyAllocation.findUnique({
      where: { id },
      include: { driver: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Allocation not found' }, { status: 404 })
    }

    // Validate cylinder tally
    if (fullCylindersSold + fullCylindersReturned !== existing.fullCylindersIssued) {
      return NextResponse.json({ 
        error: `Cylinder tally mismatch: Sold (${fullCylindersSold}) + Returned (${fullCylindersReturned}) ≠ Issued (${existing.fullCylindersIssued})` 
      }, { status: 400 })
    }

    if (emptyCylindersCollected > fullCylindersSold) {
      return NextResponse.json({ 
        error: `Empties collected (${emptyCylindersCollected}) cannot exceed cylinders sold (${fullCylindersSold})` 
      }, { status: 400 })
    }

    // Update allocation
    const updated = await prisma.dailyAllocation.update({
      where: { id },
      data: {
        fullCylindersSold,
        fullCylindersReturned,
        emptyCylindersCollected,
        expectedCash,
        status: 'CLOSED',
        closedAt: new Date(),
        closedById: (session.user as any).id,
      },
    })

    // Create stock movements for returns
    await prisma.$transaction([
      // Full cylinders returned to stock
      prisma.stockMovement.create({
        data: {
          type: 'FULL',
          movementType: 'RETURNED_FROM_DRIVER',
          quantity: fullCylindersReturned,
          date: existing.date,
          referenceId: id,
          referenceType: 'ALLOCATION',
          notes: `Returned by ${existing.driver.name} (${existing.driver.code})`,
          recordedById: (session.user as any).id,
        },
      }),
      // Empty cylinders collected
      prisma.stockMovement.create({
        data: {
          type: 'EMPTY',
          movementType: 'RETURNED_FROM_DRIVER',
          quantity: emptyCylindersCollected,
          date: existing.date,
          referenceId: id,
          referenceType: 'ALLOCATION',
          notes: `Empties collected by ${existing.driver.name} (${existing.driver.code})`,
          recordedById: (session.user as any).id,
        },
      }),
    ])

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'DailyAllocation',
        entityId: id,
        action: 'CLOSE',
        oldValues: JSON.stringify({ status: existing.status }),
        newValues: JSON.stringify({ status: 'CLOSED', fullCylindersSold, fullCylindersReturned, emptyCylindersCollected, expectedCash }),
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update allocation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}