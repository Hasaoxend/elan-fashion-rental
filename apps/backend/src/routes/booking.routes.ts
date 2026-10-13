import { Router } from 'express';
import { prisma } from '../db';
import { createBookingSchema, updateBookingStatusSchema } from '../validation';
import { normalizePhone, optionalAuth, requireAuth, requireRole } from '../middleware/auth';
import { createBooking, updateBookingStatus } from '../services/booking.service';
import { AppError } from '../constants';

export const bookingRouter = Router();

bookingRouter.post('/', optionalAuth, async (req, res, next): Promise<void> => {
  try {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Thông tin đặt lịch chưa hợp lệ.', issues: parsed.error.issues });
      return;
    }
    const booking = await createBooking(parsed.data, req.authUser?.customerId);
    res.status(201).json({ booking });
  } catch (error) { next(error); }
});

/** Tra cứu công khai: cần mã đơn và SĐT hoặc email của khách đặt đơn. */
bookingRouter.get('/lookup/:bookingCode', async (req, res, next): Promise<void> => {
  try {
    const contact = String(req.query.phone ?? '').trim();
    if (!contact) {
      res.status(400).json({ code: 'PHONE_REQUIRED', message: 'Vui lòng nhập số điện thoại hoặc email đặt đơn.' });
      return;
    }
    // Khách hay copy cả dấu "#" trong "#BK..." hoặc gõ chữ thường / có khoảng trắng.
    const bookingCode = req.params.bookingCode.replace(/[#\s]/g, '').toUpperCase();
    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        customer: { select: { fullName: true, phone: true, email: true } },
        items: { include: { product: { include: { images: true } } } },
        history: { orderBy: { createdAt: 'asc' } },
        payments: true,
      },
    });
    const matches = booking && (contact.includes('@')
      ? booking.customer.email.toLowerCase() === contact.toLowerCase()
      : normalizePhone(booking.customer.phone) === normalizePhone(contact));
    if (!booking || !matches) {
      res.status(404).json({ code: 'BOOKING_NOT_FOUND', message: 'Không tìm thấy đơn với mã và số điện thoại/email này.' });
      return;
    }
    res.json(booking);
  } catch (error) { next(error); }
});

bookingRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20)));
    const status = req.query.status ? String(req.query.status) : undefined;
    const customerId = req.authUser?.role === 'CUSTOMER' ? req.authUser.customerId : (req.query.customerId ? String(req.query.customerId) : undefined);
    const where = { ...(status ? { status } : {}), ...(customerId ? { customerId } : {}) };
    const [items, total] = await Promise.all([
      prisma.booking.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { customer: true, items: { include: { product: { include: { images: true } } } }, payments: true } }),
      prisma.booking.count({ where }),
    ]);
    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) { next(error); }
});

bookingRouter.get('/:id', requireAuth, async (req, res, next): Promise<void> => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include: { customer: true, items: { include: { product: { include: { images: true } }, variant: true } }, history: { orderBy: { createdAt: 'asc' }, include: { changedBy: { select: { fullName: true } } } }, payments: true } });
    if (!booking) {
      res.status(404).json({ code: 'BOOKING_NOT_FOUND', message: 'Không tìm thấy đơn hàng.' });
      return;
    }
    if (req.authUser?.role === 'CUSTOMER' && booking.customerId !== req.authUser.customerId) throw new AppError('Bạn không có quyền xem đơn hàng này.', 403, 'FORBIDDEN');
    res.json(booking);
  } catch (error) { next(error); }
});

bookingRouter.patch('/:id/status', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF'), async (req, res, next): Promise<void> => {
  try {
    const parsed = updateBookingStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Trạng thái không hợp lệ.' });
      return;
    }
    const booking = await updateBookingStatus(req.params.id, parsed.data.status, parsed.data.note, req.authUser?.id);
    res.json({ booking });
  } catch (error) { next(error); }
});

bookingRouter.post('/:id/cancel', optionalAuth, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include: { customer: true } });
    if (!booking) throw new AppError('Không tìm thấy đơn hàng.', 404, 'BOOKING_NOT_FOUND');
    if (req.authUser?.role === 'CUSTOMER' && booking.customerId !== req.authUser.customerId) throw new AppError('Bạn không có quyền hủy đơn này.', 403, 'FORBIDDEN');
    if (!req.authUser && normalizePhone(String(req.body?.phone ?? '')) !== normalizePhone(booking.customer.phone)) throw new AppError('Vui lòng xác thực bằng số điện thoại đặt đơn.', 403, 'FORBIDDEN');
    // Khách chỉ tự hủy được khi đơn chưa chuẩn bị; các trạng thái sau do cửa hàng xử lý.
    if (!['pending', 'confirmed'].includes(booking.status)) throw new AppError('Đơn đã được chuẩn bị nên không thể tự hủy. Vui lòng liên hệ cửa hàng.', 409, 'INVALID_STATUS');
    const updated = await updateBookingStatus(req.params.id, 'cancelled', String(req.body?.reason ?? 'Khách hàng yêu cầu hủy'), req.authUser?.id);
    res.json({ booking: updated });
  } catch (error) { next(error); }
});
