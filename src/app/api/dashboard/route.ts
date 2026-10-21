import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatNumber, getTodayString } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = getTodayString()
    const startOfToday = new Date(today + 'T00:00:00.000Z')
    const endOfToday = new Date(today + 'T23:59:59.999Z')
    
    // Get start of week (Monday)
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1)
    startOfWeek.setHours(0, 0, 0, 0)

    // Get start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Parallel queries for performance
    const [
      todayAllocations,
      todayPayments,
      activeDrivers,
      stockLevels,
      weeklyData,
      monthlyData,
      driverDues,
      unclosedAllocations,
    ] = await Promise.all([
      // Today's allocations
      prisma.dailyAllocation.findMany({
        where: { date: { gte: startOfToday, lte: endOfToday } },
        include: {
          driver: { select: { id: true, code: true, name: true, phone: true } },
          payments: { select: { amount: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),

      // Today's payments
      prisma.payment.findMany({
        where: { date: { gte: startOfToday, lte: endOfToday } },
        select: { amount: true, driverId: true },
      }),

      // Active drivers count
      prisma.driver.count({ where: { isActive: true } }),

      // Current stock levels
      prisma.stockMovement.groupBy({
        by: ['type'],
        where: {
          date: { lte: endOfToday },
        },
        _sum: { quantity: true },
      }),

      // Last 7 days for chart
      prisma.dailyAllocation.groupBy({
        by: ['date'],
        where: { date: { gte: startOfWeek } },
        _sum: { expectedCash: true, fullCylindersSold: true },
        orderBy: { date: 'asc' },
      }),

      // Last 30 days for monthly chart
      prisma.dailyAllocation.groupBy({
        by: ['date'],
        where: { date: { gte: startOfMonth } },
        _sum: { expectedCash: true, fullCylindersSold: true },
        orderBy: { date: 'asc' },
      }),

      // Drivers with outstanding dues
      prisma.driver.findMany({
        where: { isActive: true },
        include: {
          allocations: {
            where: { status: { in: ['CLOSED', 'FLAGGED'] } },
            select: { expectedCash: true },
          },
          payments: { select: { amount: true } },
        },
      }),

      // Unclosed allocations
      prisma.dailyAllocation.count({
        where: { status: 'PENDING' },
      }),
    ])

    // Calculate today's metrics
    const todayExpectedCash = todayAllocations.reduce((sum, a) => sum + a.expectedCash, 0)
    const todayCollectedCash = todayPayments.reduce((sum, p) => sum + p.amount, 0)
    const todayShortfall = todayExpectedCash - todayCollectedCash
    const todayCylindersSold = todayAllocations.reduce((sum, a) => sum + a.fullCylindersSold, 0)
    const todayCylindersReturned = todayAllocations.reduce((sum, a) => sum + a.fullCylindersReturned, 0)
    const todayEmptiesCollected = todayAllocations.reduce((sum, a) => sum + a.emptyCylindersCollected, 0)

    // Calculate stock
    const fullStockMovements = stockLevels.filter(s => s.type === 'FULL')
    const emptyStockMovements = stockLevels.filter(s => s.type === 'EMPTY')
    const fullStock = fullStockMovements.reduce((sum, s) => sum + (s._sum.quantity ?? 0), 0)
    const emptyStock = emptyStockMovements.reduce((sum, s) => sum + (s._sum.quantity ?? 0), 0)

    // Calculate driver dues
    const driversWithDues = driverDues
      .map(driver => {
        const totalExpected = driver.allocations.reduce((sum, a) => sum + a.expectedCash, 0)
        const totalCollected = driver.payments.reduce((sum, p) => sum + p.amount, 0)
        const outstanding = totalExpected - totalCollected
        return {
          id: driver.id,
          code: driver.code,
          name: driver.name,
          outstanding,
          isOverThreshold: outstanding > driver.duesThreshold,
        }
      })
      .filter(d => d.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding)

    // Weekly chart data (last 7 days)
    const weeklyChart = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(startOfWeek)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const dayData = weeklyData.find(d => d.date.toISOString().split('T')[0] === dateStr)
      weeklyChart.push({
        date: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        expected: dayData?._sum.expectedCash || 0,
        collected: 0, // Would need separate payment query per day
        sold: dayData?._sum.fullCylindersSold || 0,
      })
    }

    // Prepare allocation details for today
    const allocationDetails = todayAllocations.map(allocation => {
      const collectedCash = allocation.payments.reduce((sum, p) => sum + p.amount, 0)
      const shortfall = allocation.expectedCash - collectedCash
      let status = allocation.status
      if (status === 'PENDING' && shortfall > 0) status = 'FLAGGED'
      return {
        id: allocation.id,
        driver: allocation.driver,
        fullCylindersIssued: allocation.fullCylindersIssued,
        fullCylindersSold: allocation.fullCylindersSold,
        fullCylindersReturned: allocation.fullCylindersReturned,
        emptyCylindersCollected: allocation.emptyCylindersCollected,
        expectedCash: allocation.expectedCash,
        status,
        collectedCash,
        shortfall,
      }
    })

    return NextResponse.json({
      // KPI Cards
      kpis: {
        expectedCashToday: todayExpectedCash,
        collectedCashToday: todayCollectedCash,
        outstandingDues: driversWithDues.reduce((sum, d) => sum + d.outstanding, 0),
        activeDrivers,
        fullStock,
        emptyStock,
        cylindersSoldToday: todayCylindersSold,
        profitToday: todayCylindersSold * 5000, // ₹50 margin = 5000 paise
        collectionRate: todayExpectedCash > 0 ? ((todayCollectedCash / todayExpectedCash) * 100).toFixed(1) : 0,
      },
      // Today's allocations
      allocations: allocationDetails,
      // Alerts
      alerts: {
        unclosedCount: unclosedAllocations,
        flaggedCount: allocationDetails.filter(a => a.status === 'FLAGGED').length,
        lowStock: fullStock < 200,
        driversOverThreshold: driversWithDues.filter(d => d.isOverThreshold).length,
      },
      // Chart data
      charts: {
        weekly: weeklyChart,
      },
      // Driver dues
      driverDues: driversWithDues.slice(0, 10),
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}