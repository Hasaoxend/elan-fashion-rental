import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import { paymentSchema, settingSchema, maintenanceSchema, createUserSchema } from '../validation';
import { toUtcDate } from '../lib/date';
import { AppError } from '../constants';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF', 'WAREHOUSE', 'ACCOUNTANT'));

adminRouter.get('/search', async (req, res, next) => {
  try {
    const query = String(req.query.q ?? '').trim();
    if (query.length < 2) { res.json({ products: [], bookings: [], customers: [] }); return; }
    const [products, bookings, customers] = await Promise.all([
      prisma.product.findMany({ where: { OR: [{ name: { contains: query } }, { sku: { contains: query } }] }, take: 8, select: { id: true, name: true, sku: true } }),
      prisma.booking.findMany({ where: { OR: [{ bookingCode: { contains: query } }, { customer: { fullName: { contains: query } } }, { customer: { phone: { contains: query } } }] }, take: 8, orderBy: { createdAt: 'desc' }, select: { id: true, bookingCode: true, status: true, customer: { select: { fullName: true } } } }),
      prisma.customer.findMany({ where: { OR: [{ fullName: { contains: query } }, { email: { contains: query } }, { phone: { contains: query } }] }, take: 8, select: { id: true, fullName: true, email: true, phone: true } }),
    ]);
    res.json({ products, bookings, customers });
  } catch (error) { next(error); }
});

adminRouter.get('/dashboard', async (_req, res, next) => {
  try {
    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const end = new Date(start.getTime() + 86_400_000);
    const [todayBookings, availableProducts, rentingItems, upcomingReturns, newCustomers, revenue, pendingBookings, recentBookings] = await Promise.all([
      prisma.booking.count({ where: { createdAt: { gte: start, lt: end }, status: { not: 'cancelled' } } }),
      prisma.productVariant.aggregate({ _sum: { stockTotal: true, stockBroken: true, stockReservedForMaintenance: true } }),
      prisma.bookingItem.aggregate({ _sum: { quantity: true }, where: { booking: { status: { in: ['confirmed', 'preparing', 'delivering', 'picked_up'] } } } }),
      prisma.booking.count({ where: { returnDate: { gte: start, lt: new Date(start.getTime() + 7 * 86_400_000) }, status: { in: ['picked_up', 'delivering'] } } }),
      prisma.customer.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.booking.aggregate({ _sum: { total: true }, where: { createdAt: { gte: start, lt: end }, status: { notIn: ['cancelled', 'rejected'] } } }),
      prisma.booking.count({ where: { status: 'pending' } }),
      prisma.booking.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { customer: true, items: { include: { product: true } } } }),
    ]);
    const stock = availableProducts._sum.stockTotal ?? 0;
    const unavailable = (availableProducts._sum.stockBroken ?? 0) + (availableProducts._sum.stockReservedForMaintenance ?? 0);
    res.json({
      kpis: {
        revenueToday: revenue._sum.total ?? 0, bookingsToday: todayBookings,
        renting: rentingItems._sum.quantity ?? 0, upcomingReturns, available: Math.max(0, stock - unavailable),
        newCustomers, pendingBookings,
      },
      recentBookings,
    });
  } catch (error) { next(error); }
});

/** Danh sách sản phẩm cho admin: gồm cả sản phẩm đã ngừng hoạt động, không giới hạn 48 như API public. */
adminRouter.get('/products', async (_req, res, next) => {
  try {
    const items = await prisma.product.findMany({ orderBy: { createdAt: 'desc' }, include: { images: { orderBy: { sortOrder: 'asc' } }, category: true, variants: true } });
    res.json({ items: items.map((p) => ({ ...p, availableStock: p.variants.reduce((s, v) => s + Math.max(0, v.stockTotal - v.stockBroken - v.stockReservedForMaintenance), 0) })) });
  } catch (error) { next(error); }
});

adminRouter.get('/bookings', async (req, res, next) => {
  try {
    // from/to (YYYY-MM-DD, to không bao gồm): lấy mọi đơn có khoảng thuê giao với [from, to),
    // để đơn bắt đầu từ tháng trước nhưng kéo sang tháng này vẫn hiện trên lịch.
    const from = req.query.from ? toUtcDate(String(req.query.from)) : undefined;
    const to = req.query.to ? toUtcDate(String(req.query.to)) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const bookings = await prisma.booking.findMany({ where: { ...(status ? { status } : {}), ...(to ? { pickupDate: { lt: to } } : {}), ...(from ? { returnDate: { gte: from } } : {}) }, orderBy: { pickupDate: 'asc' }, include: { customer: true, items: { include: { product: { include: { images: true } } } } } });
    res.json({ items: bookings });
  } catch (error) { next(error); }
});

adminRouter.get('/customers', async (req, res, next) => {
  try {
    const search = req.query.search ? String(req.query.search) : undefined;
    const customers = await prisma.customer.findMany({ where: search ? { OR: [{ fullName: { contains: search } }, { email: { contains: search } }, { phone: { contains: search } }] } : undefined, orderBy: { createdAt: 'desc' }, take: 100, include: { _count: { select: { bookings: true } } } });
    // Cột Customer.totalSpent không được cập nhật ở luồng đặt đơn → tính trực tiếp từ đơn hợp lệ.
    const spent = await prisma.booking.groupBy({ by: ['customerId'], _sum: { total: true }, where: { customerId: { in: customers.map((c) => c.id) }, status: { notIn: ['cancelled', 'rejected'] } } });
    res.json({ items: customers.map((c) => ({ ...c, totalSpent: spent.find((s) => s.customerId === c.id)?._sum.total ?? 0 })) });
  } catch (error) { next(error); }
});

adminRouter.get('/notifications', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({ where: { OR: [{ broadcast: true }, ...(req.authUser ? [{ userId: req.authUser.id }] : [])] }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ items: notifications });
  } catch (error) { next(error); }
});

adminRouter.patch('/notifications/:id/read', async (req, res, next) => {
  try { const item = await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } }); res.json(item); } catch (error) { next(error); }
});

adminRouter.get('/payments', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STAFF'), async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const method = req.query.method ? String(req.query.method) : undefined;
    const payments = await prisma.payment.findMany({
      where: { ...(status ? { status } : {}), ...(method ? { method } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { booking: { include: { customer: true, items: { include: { product: true } } } }, transactions: true },
    });
    res.json({ items: payments });
  } catch (error) { next(error); }
});

adminRouter.post('/payments', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STAFF'), async (req, res, next) => {
  try {
    const parsed = paymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Thông tin thanh toán không hợp lệ.', issues: parsed.error.issues });
      return;
    }
    const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
    if (!booking) throw new AppError('Không tìm thấy đơn hàng.', 404, 'BOOKING_NOT_FOUND');
    const payment = await prisma.payment.create({
      data: {
        bookingId: parsed.data.bookingId,
        type: parsed.data.type,
        amount: parsed.data.amount,
        method: parsed.data.method,
        status: parsed.data.status,
        provider: parsed.data.provider,
        providerTxnId: parsed.data.providerTxnId,
        paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : (parsed.data.status === 'paid' ? new Date() : null),
        note: parsed.data.note,
      },
      include: { booking: true },
    });
    if (parsed.data.status === 'paid') {
      await prisma.booking.update({ where: { id: booking.id }, data: { paymentStatus: 'paid' } });
    }
    res.status(201).json(payment);
  } catch (error) { next(error); }
});

adminRouter.patch('/payments/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STAFF'), async (req, res, next) => {
  try {
    const parsed = paymentSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Thông tin thanh toán không hợp lệ.', issues: parsed.error.issues });
      return;
    }
    const data: any = { ...parsed.data };
    if (parsed.data.paidAt) data.paidAt = new Date(parsed.data.paidAt);
    if (parsed.data.status === 'paid' && !data.paidAt) data.paidAt = new Date();
    const payment = await prisma.payment.update({ where: { id: req.params.id }, data, include: { booking: true } });
    if (parsed.data.status) {
      await prisma.booking.update({ where: { id: payment.bookingId }, data: { paymentStatus: parsed.data.status } });
    }
    res.json(payment);
  } catch (error) { next(error); }
});

adminRouter.get('/maintenance', requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF', 'WAREHOUSE'), async (_req, res, next) => {
  try {
    const items = await prisma.maintenance.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { product: { include: { images: true } } } });
    res.json({ items });
  } catch (error) { next(error); }
});

adminRouter.post('/maintenance', requireRole('SUPER_ADMIN', 'ADMIN', 'WAREHOUSE'), async (req, res, next) => {
  try {
    const parsed = maintenanceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Thông tin bảo trì không hợp lệ.', issues: parsed.error.issues });
      return;
    }
    if (toUtcDate(parsed.data.endDate) < toUtcDate(parsed.data.startDate)) throw new AppError('Ngày kết thúc phải từ ngày bắt đầu trở đi.', 400, 'INVALID_DATE_RANGE');
    const item = await prisma.maintenance.create({
      data: {
        productId: parsed.data.productId,
        variantId: parsed.data.variantId,
        reason: parsed.data.reason,
        startDate: toUtcDate(parsed.data.startDate),
        endDate: toUtcDate(parsed.data.endDate),
        cost: parsed.data.cost,
        note: parsed.data.note,
        status: parsed.data.status,
        createdById: req.authUser?.id,
      },
      include: { product: true },
    });
    res.status(201).json(item);
  } catch (error) { next(error); }
});

adminRouter.patch('/maintenance/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'WAREHOUSE'), async (req, res, next) => {
  try {
    const parsed = maintenanceSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Thông tin bảo trì không hợp lệ.', issues: parsed.error.issues });
      return;
    }
    const data: any = { ...parsed.data };
    if (data.startDate) data.startDate = toUtcDate(data.startDate);
    if (data.endDate) data.endDate = toUtcDate(data.endDate);
    if (parsed.data.status === 'done') data.completedAt = new Date();
    const item = await prisma.maintenance.update({ where: { id: req.params.id }, data, include: { product: true } });
    res.json(item);
  } catch (error) { next(error); }
});

adminRouter.get('/reports', requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), async (req, res, next) => {
  try {
    const days = Math.min(90, Math.max(1, Number(req.query.days ?? 30)));
    const from = new Date(Date.now() - days * 86_400_000);
    const [revenueByDay, topProducts, topCustomers, statusCounts, maintenanceCost, utilization] = await Promise.all([
      prisma.booking.findMany({
        where: { createdAt: { gte: from }, status: { notIn: ['cancelled', 'rejected'] } },
        select: { total: true, createdAt: true },
      }),
      prisma.bookingItem.groupBy({
        by: ['productId'],
        where: { booking: { createdAt: { gte: from }, status: { notIn: ['cancelled', 'rejected'] } } },
        _sum: { quantity: true, lineSubtotal: true },
        _count: { _all: true },
        orderBy: { _sum: { lineSubtotal: 'desc' } },
        take: 10,
      }),
      prisma.booking.groupBy({
        by: ['customerId'],
        where: { createdAt: { gte: from }, status: { notIn: ['cancelled', 'rejected'] } },
        _sum: { total: true },
        _count: { _all: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 10,
      }),
      prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.maintenance.aggregate({ _sum: { cost: true }, where: { createdAt: { gte: from } } }),
      prisma.bookingItem.aggregate({ _sum: { quantity: true }, where: { booking: { createdAt: { gte: from } } } }),
    ]);
    const byDay: Record<string, number> = {};
    for (const row of revenueByDay) {
      const key = row.createdAt.toISOString().slice(0, 10);
      byDay[key] = (byDay[key] ?? 0) + row.total;
    }
    const products = await prisma.product.findMany({ where: { id: { in: topProducts.map((p) => p.productId) } }, select: { id: true, name: true, sku: true } });
    const customers = await prisma.customer.findMany({ where: { id: { in: topCustomers.map((c) => c.customerId) } }, select: { id: true, fullName: true, phone: true } });
    res.json({
      period: { days, from },
      revenueByDay: byDay,
      topProducts: topProducts.map((p) => ({ ...p, product: products.find((x) => x.id === p.productId) })),
      topCustomers: topCustomers.map((c) => ({ ...c, customer: customers.find((x) => x.id === c.customerId) })),
      statusCounts,
      maintenanceCost: maintenanceCost._sum.cost ?? 0,
      utilization: utilization._sum.quantity ?? 0,
    });
  } catch (error) { next(error); }
});

adminRouter.get('/settings', requireRole('SUPER_ADMIN', 'ADMIN'), async (_req, res, next) => {
  try {
    const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
    res.json({ items: settings });
  } catch (error) { next(error); }
});

adminRouter.put('/settings', requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const parsed = settingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Thông tin cấu hình không hợp lệ.', issues: parsed.error.issues });
      return;
    }
    const item = await prisma.setting.upsert({
      where: { key: parsed.data.key },
      update: { value: parsed.data.value, group: parsed.data.group },
      create: parsed.data,
    });
    res.json(item);
  } catch (error) { next(error); }
});

// Không bao giờ trả passwordHash / thông tin khóa đăng nhập ra API.
/** Trang quản trị chỉ cấp vai trò nội bộ; vai trò CUSTOMER dành cho khách tự đăng ký trên website. */
async function assertStaffRole(roleId: string) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role || role.name === 'CUSTOMER') throw new AppError('Vai trò không hợp lệ cho tài khoản nhân viên.', 400, 'INVALID_ROLE');
}

const userSelect = { id: true, email: true, fullName: true, roleId: true, isActive: true, mustChangePassword: true, createdAt: true, role: true } as const;

adminRouter.get('/users', requireRole('SUPER_ADMIN'), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ where: { role: { name: { not: 'CUSTOMER' } } }, select: userSelect, orderBy: { createdAt: 'desc' } });
    res.json({ items: users });
  } catch (error) { next(error); }
});

adminRouter.get('/users/:id', requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: userSelect });
    if (!user) throw new AppError('Không tìm thấy người dùng.', 404, 'USER_NOT_FOUND');
    res.json(user);
  } catch (error) { next(error); }
});

adminRouter.post('/users', requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Thông tin người dùng không hợp lệ.', issues: parsed.error.issues });
      return;
    }
    const { password, ...data } = parsed.data;
    await assertStaffRole(data.roleId);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email đã được sử dụng.', 409, 'EMAIL_TAKEN');
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { ...data, passwordHash }, select: userSelect });
    res.status(201).json(user);
  } catch (error) { next(error); }
});

adminRouter.patch('/users/:id', requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { fullName, roleId, isActive, mustChangePassword } = req.body ?? {};
    const data: any = {};
    if (typeof fullName === 'string') data.fullName = fullName;
    if (typeof roleId === 'string') { await assertStaffRole(roleId); data.roleId = roleId; }
    if (typeof isActive === 'boolean') data.isActive = isActive;
    if (req.params.id === req.authUser?.id && isActive === false) throw new AppError('Không thể tự khóa tài khoản đang đăng nhập.', 409, 'CANNOT_DEACTIVATE_SELF');
    if (typeof mustChangePassword === 'boolean') data.mustChangePassword = mustChangePassword;
    const user = await prisma.user.update({ where: { id: req.params.id }, data, select: userSelect });
    res.json(user);
  } catch (error) { next(error); }
});

adminRouter.delete('/users/:id', requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    if (req.params.id === req.authUser?.id) throw new AppError('Không thể tự xóa tài khoản đang đăng nhập.', 409, 'CANNOT_DELETE_SELF');
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

adminRouter.get('/roles', requireRole('SUPER_ADMIN'), async (_req, res, next) => {
  try {
    const roles = await prisma.role.findMany({ where: { name: { not: 'CUSTOMER' } }, orderBy: { createdAt: 'asc' }, include: { permissions: { include: { permission: true } } } });
    res.json({ items: roles });
  } catch (error) { next(error); }
});

adminRouter.patch('/roles/:id/permissions', requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { permissionIds } = req.body ?? {};
    if (!Array.isArray(permissionIds)) throw new AppError('Danh sách quyền không hợp lệ.', 400, 'INVALID_INPUT');
    await prisma.rolePermission.deleteMany({ where: { roleId: req.params.id } });
    const rows = permissionIds.filter((id: unknown): id is string => typeof id === 'string')
      .map((permissionId) => ({ roleId: req.params.id, permissionId }));
    if (rows.length) await prisma.rolePermission.createMany({ data: rows });
    const role = await prisma.role.findUnique({ where: { id: req.params.id }, include: { permissions: { include: { permission: true } } } });
    res.json(role);
  } catch (error) { next(error); }
});
