import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Enums as constants for SQLite compatibility
const Role = { ADMIN: 'ADMIN', STAFF: 'STAFF' }
const AllocationStatus = { PENDING: 'PENDING', CLOSED: 'CLOSED', FLAGGED: 'FLAGGED' }
const StockType = { FULL: 'FULL', EMPTY: 'EMPTY' }
const MovementType = { 
  ISSUED_TO_DRIVER: 'ISSUED_TO_DRIVER', 
  RETURNED_FROM_DRIVER: 'RETURNED_FROM_DRIVER', 
  REFILL_RECEIVED: 'REFILL_RECEIVED', 
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT', 
  DAMAGED_LOST: 'DAMAGED_LOST' 
}
const PaymentMethod = { CASH: 'CASH', UPI: 'UPI', BANK_TRANSFER: 'BANK_TRANSFER', CHEQUE: 'CHEQUE', OTHER: 'OTHER' }

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data (in development)
  if (process.env.NODE_ENV === 'development') {
    await prisma.auditLog.deleteMany()
    await prisma.deliveryProof.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.dailyAllocation.deleteMany()
    await prisma.stockMovement.deleteMany()
    await prisma.pricePeriod.deleteMany()
    await prisma.driver.deleteMany()
    await prisma.user.deleteMany()
    await prisma.setting.deleteMany()
    console.log('🗑️  Cleared existing data')
  }

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@cylintrack.com',
      passwordHash,
      name: 'Admin User',
      role: Role.ADMIN,
      isActive: true,
    },
  })
  console.log('👤 Created admin user:', admin.email)

  // Create staff user
  const staffPasswordHash = await bcrypt.hash('staff123', 12)
  const staff = await prisma.user.create({
    data: {
      email: 'staff@cylintrack.com',
      passwordHash: staffPasswordHash,
      name: 'Staff User',
      role: Role.STAFF,
      isActive: true,
    },
  })
  console.log('👤 Created staff user:', staff.email)

  // Create price periods
  const pricePeriods = await Promise.all([
    prisma.pricePeriod.create({
      data: {
        effectiveFrom: new Date('2026-01-01'),
        cylinderPrice: 89000, // ₹890
        costPrice: 84000,     // ₹840
        margin: 5000,         // ₹50
        notes: 'Initial pricing',
        isActive: false,
        createdById: admin.id,
      },
    }),
    prisma.pricePeriod.create({
      data: {
        effectiveFrom: new Date('2026-10-01'),
        cylinderPrice: 91700, // ₹917
        costPrice: 86700,     // ₹867
        margin: 5000,         // ₹50
        notes: 'Current pricing effective Oct 2026',
        isActive: true,
        createdById: admin.id,
      },
    }),
  ])
  console.log('💰 Created price periods')

  // Create drivers
  const driversData = [
    { code: 'DRV-001', name: 'Rajesh Kumar', phone: '9876543210', vehicleNumber: 'MH-12-AB-1234', vehicleType: 'TATA ACE', joiningDate: new Date('2025-01-15') },
    { code: 'DRV-002', name: 'Suresh Singh', phone: '9876543211', vehicleNumber: 'MH-12-AB-1235', vehicleType: 'MAHINDRA MAXX', joiningDate: new Date('2025-02-20') },
    { code: 'DRV-003', name: 'Mahesh Patel', phone: '9876543212', vehicleNumber: 'MH-12-AB-1236', vehicleType: 'TATA ACE', joiningDate: new Date('2025-03-10') },
    { code: 'DRV-004', name: 'Dinesh Yadav', phone: '9876543213', vehicleNumber: 'MH-12-AB-1237', vehicleType: 'ASHOK LEYLAND', joiningDate: new Date('2025-04-05') },
    { code: 'DRV-005', name: 'Ramesh Gupta', phone: '9876543214', vehicleNumber: 'MH-12-AB-1238', vehicleType: 'TATA ACE', joiningDate: new Date('2025-05-12') },
    { code: 'DRV-006', name: 'Vikram Sharma', phone: '9876543215', vehicleNumber: 'MH-12-AB-1239', vehicleType: 'MAHINDRA MAXX', joiningDate: new Date('2025-06-18') },
    { code: 'DRV-007', name: 'Ajay Verma', phone: '9876543216', vehicleNumber: 'MH-12-AB-1240', vehicleType: 'TATA ACE', joiningDate: new Date('2025-07-22') },
    { code: 'DRV-008', name: 'Sanjay Mishra', phone: '9876543217', vehicleNumber: 'MH-12-AB-1241', vehicleType: 'TATA ACE', joiningDate: new Date('2025-08-30') },
    { code: 'DRV-009', name: 'Prakash Joshi', phone: '9876543218', vehicleNumber: 'MH-12-AB-1242', vehicleType: 'MAHINDRA MAXX', joiningDate: new Date('2025-09-14') },
    { code: 'DRV-010', name: 'Manoj Tiwari', phone: '9876543219', vehicleNumber: 'MH-12-AB-1243', vehicleType: 'TATA ACE', joiningDate: new Date('2025-10-01') },
  ]

  const drivers = await Promise.all(
    driversData.map(d => prisma.driver.create({
      data: {
        ...d,
        duesThreshold: 500000, // ₹5,000 in paise
        isActive: true,
      },
    }))
  )
  console.log(`🚛 Created ${drivers.length} drivers`)

  // Create initial stock movements (opening stock)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.stockMovement.createMany({
    data: [
      {
        type: StockType.FULL,
        movementType: MovementType.REFILL_RECEIVED,
        quantity: 500,
        date: today,
        referenceType: 'INITIAL',
        notes: 'Opening stock - full cylinders',
        recordedById: admin.id,
      },
      {
        type: StockType.EMPTY,
        movementType: MovementType.MANUAL_ADJUSTMENT,
        quantity: 200,
        date: today,
        referenceType: 'INITIAL',
        notes: 'Opening stock - empty cylinders',
        recordedById: admin.id,
      },
    ],
  })
  console.log('📦 Created initial stock movements')

  // Create sample allocations for the last 7 days
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const allocDate = new Date(today)
    allocDate.setDate(allocDate.getDate() - dayOffset)
    allocDate.setHours(0, 0, 0, 0)

    // Pick 4-5 drivers per day
    const driversForDay = drivers.slice(0, 4 + (dayOffset % 2))
    
    for (let i = 0; i < driversForDay.length; i++) {
      const driver = driversForDay[i]
      const issued = 30
      const sold = dayOffset === 0 && i === 2 ? 0 : 25 + Math.floor(Math.random() * 5) // Today driver 3 pending
      const returned = issued - sold
      const empties = sold - Math.floor(Math.random() * 3)
      const expectedCash = sold * 91700
      const status = dayOffset === 0 
        ? (i === 2 ? AllocationStatus.PENDING : (i === 3 ? AllocationStatus.FLAGGED : AllocationStatus.CLOSED))
        : AllocationStatus.CLOSED

      const allocation = await prisma.dailyAllocation.create({
        data: {
          driverId: driver.id,
          date: allocDate,
          fullCylindersIssued: issued,
          fullCylindersSold: sold,
          fullCylindersReturned: returned,
          emptyCylindersCollected: empties,
          expectedCash,
          status,
          createdById: admin.id,
          closedAt: status !== AllocationStatus.PENDING ? new Date(allocDate.getTime() + 14 * 60 * 60 * 1000) : null,
          closedById: status !== AllocationStatus.PENDING ? admin.id : null,
        },
      })

      // Create stock movements for this allocation
      await prisma.stockMovement.createMany({
        data: [
          {
            type: StockType.FULL,
            movementType: MovementType.ISSUED_TO_DRIVER,
            quantity: issued,
            date: allocDate,
            referenceId: allocation.id,
            referenceType: 'ALLOCATION',
            notes: `Issued to ${driver.name} (${driver.code})`,
            recordedById: admin.id,
          },
          {
            type: StockType.FULL,
            movementType: MovementType.RETURNED_FROM_DRIVER,
            quantity: returned,
            date: allocDate,
            referenceId: allocation.id,
            referenceType: 'ALLOCATION',
            notes: `Returned by ${driver.name} (${driver.code})`,
            recordedById: admin.id,
          },
          {
            type: StockType.EMPTY,
            movementType: MovementType.RETURNED_FROM_DRIVER,
            quantity: empties,
            date: allocDate,
            referenceId: allocation.id,
            referenceType: 'ALLOCATION',
            notes: `Empties collected by ${driver.name} (${driver.code})`,
            recordedById: admin.id,
          },
        ],
      })

      // Create payments for closed allocations
      if (status === AllocationStatus.CLOSED) {
        // Full payment
        await prisma.payment.create({
          data: {
            driverId: driver.id,
            allocationId: allocation.id,
            date: allocDate,
            amount: expectedCash,
            method: PaymentMethod.CASH,
            notes: 'Full day collection',
            recordedById: admin.id,
          },
        })
      } else if (status === AllocationStatus.FLAGGED) {
        // Partial payment (shortfall)
        await prisma.payment.create({
          data: {
            driverId: driver.id,
            allocationId: allocation.id,
            date: allocDate,
            amount: expectedCash - 100000, // ₹1,000 short
            method: PaymentMethod.CASH,
            notes: 'Partial collection - shortfall',
            recordedById: admin.id,
          },
        })
      }
    }
  }
  console.log('📋 Created sample allocations for last 7 days')

  // Create some historical payments
  const historicalPayments = [
    { driverId: drivers[1].id, amount: 500000, date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), method: PaymentMethod.UPI, notes: 'Previous dues payment' },
    { driverId: drivers[3].id, amount: 300000, date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), method: PaymentMethod.CASH, notes: 'Previous dues payment' },
    { driverId: drivers[0].id, amount: 200000, date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), method: PaymentMethod.BANK_TRANSFER, notes: 'Advance payment' },
  ]

  await prisma.payment.createMany({
    data: historicalPayments.map(p => ({ ...p, recordedById: admin.id })),
  })
  console.log('💳 Created historical payments')

  // Create settings
  await prisma.setting.createMany({
    data: [
      { key: 'low_stock_threshold_full', value: '200', category: 'STOCK' },
      { key: 'low_stock_threshold_empty', value: '100', category: 'STOCK' },
      { key: 'default_dues_threshold', value: '500000', category: 'DRIVERS' },
      { key: 'default_cylinders_per_driver', value: '30', category: 'ALLOCATIONS' },
      { key: 'auto_close_time', value: '20:00', category: 'ALLOCATIONS' },
      { key: 'company_name', value: 'CylinTrack Gas Distribution', category: 'GENERAL' },
      { key: 'company_phone', value: '+91-22-12345678', category: 'GENERAL' },
      { key: 'company_address', value: 'Mumbai, Maharashtra', category: 'GENERAL' },
    ],
  })
  console.log('⚙️  Created default settings')

  // Create audit log entries for seeding
  await prisma.auditLog.createMany({
    data: [
      { entityType: 'User', entityId: admin.id, action: 'CREATE', newValues: JSON.stringify({ email: admin.email, role: admin.role }), userId: admin.id },
      { entityType: 'User', entityId: staff.id, action: 'CREATE', newValues: JSON.stringify({ email: staff.email, role: staff.role }), userId: admin.id },
      { entityType: 'PricePeriod', entityId: pricePeriods[1].id, action: 'CREATE', newValues: JSON.stringify({ cylinderPrice: 91700, margin: 5000 }), userId: admin.id },
    ],
  })
  console.log('📝 Created initial audit logs')

  console.log('✅ Database seed completed successfully!')
  console.log('')
  console.log('🔑 Login credentials:')
  console.log('   Admin:  admin@cylintrack.com / admin123')
  console.log('   Staff:  staff@cylintrack.com / staff123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })