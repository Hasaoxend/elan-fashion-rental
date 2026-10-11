import { Router } from 'express';
import { prisma } from '../db';
import { availabilitySchema, productSchema, productVariantSchema, maintenanceSchema } from '../validation';
import { toUtcDate, addDays } from '../lib/date';
import { checkAvailability, getProductCalendar } from '../lib/availability';
import { requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../constants';

export const productRouter = Router();

/**
 * GET /products — danh sách sản phẩm có filter, sort, phân trang.
 * Chỉ trả sản phẩm đang hoạt động.
 */
productRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(48, Math.max(1, Number(req.query.pageSize ?? 12)));
    const { category, minPrice, maxPrice, size, color, status, brand, search, sort } = req.query as Record<string, string>;

    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = { slug: category };
    if (status) where.status = status;
    if (brand) where.brand = brand;
    if (search) where.OR = [{ name: { contains: search } }, { sku: { contains: search } }];
    if (minPrice || maxPrice) {
      where.pricePerDay = {
        ...(minPrice ? { gte: Number(minPrice) } : {}),
        ...(maxPrice ? { lte: Number(maxPrice) } : {}),
      };
    }
    if (size || color) {
      where.variants = { some: { ...(size ? { size } : {}), ...(color ? { color } : {}) } };
    }

    const orderBy = (() => {
      switch (sort) {
        case 'price_asc': return { pricePerDay: 'asc' as const };
        case 'price_desc': return { pricePerDay: 'desc' as const };
        case 'popular': return { rentalCount: 'desc' as const };
        case 'rating': return { ratingAvg: 'desc' as const };
        default: return { createdAt: 'desc' as const };
      }
    })();

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where, orderBy, skip: (page - 1) * pageSize, take: pageSize,
        include: { images: { orderBy: { sortOrder: 'asc' } }, category: true, variants: true },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      items: items.map((p) => ({
        ...p,
        availableStock: p.variants.reduce((s, v) => s + Math.max(0, v.stockTotal - v.stockBroken - v.stockReservedForMaintenance), 0),
      })),
      total, page, pageSize, totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) { next(error); }
});

productRouter.get('/meta', async (_req, res, next) => {
  try {
    const [categories, brands, sizes] = await Promise.all([
      prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, include: { _count: { select: { products: true } } } }),
      prisma.product.findMany({ where: { brand: { not: null } }, distinct: ['brand'], select: { brand: true } }),
      prisma.productVariant.findMany({ distinct: ['size'], select: { size: true } }),
    ]);
    res.json({ categories, brands: brands.map((b) => b.brand).filter(Boolean), sizes: sizes.map((s) => s.size).sort() });
  } catch (error) { next(error); }
});

/**
 * GET /products/:id/availability — kiểm tra khả dụng realtime cho khoảng ngày.
 * Frontend gọi ngay khi khách chọn ngày, trước khi cho phép đặt.
 */
productRouter.get('/:id/availability', async (req, res, next): Promise<void> => {
  try {
    const parsed = availabilitySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Tham số ngày không hợp lệ.', issues: parsed.error.issues });
      return;
    }
    const { startDate, endDate, quantity, variantId } = parsed.data;
    if (toUtcDate(endDate) <= toUtcDate(startDate)) {
      res.status(400).json({ code: 'INVALID_DATE_RANGE', message: 'Ngày trả phải sau ngày nhận.' });
      return;
    }

    const result = await checkAvailability(prisma, { productId: req.params.id, startDate: toUtcDate(startDate), endDate: toUtcDate(endDate), quantity, variantId });
    res.json(result);
  } catch (error) { next(error); }
});

/** GET /products/:id/calendar — dữ liệu lịch thuê cho Calendar UI. */
productRouter.get('/:id/calendar', async (req, res, next) => {
  try {
    const from = req.query.from ? toUtcDate(String(req.query.from)) : toUtcDate(new Date());
    const to = req.query.to ? toUtcDate(String(req.query.to)) : addDays(from, 90);
    const days = await getProductCalendar(prisma, req.params.id, undefined, from, to);
    res.json({ productId: req.params.id, from, to, days });
  } catch (error) { next(error); }
});

productRouter.get('/:id', async (req, res, next): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } }, category: true, variants: true,
        reviews: { where: { isApproved: true }, include: { customer: { select: { fullName: true } } }, take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!product) {
      res.status(404).json({ code: 'PRODUCT_NOT_FOUND', message: 'Không tìm thấy trang phục.' });
      return;
    }
    res.json({ ...product, availableStock: product.variants.reduce((s, v) => s + Math.max(0, v.stockTotal - v.stockBroken - v.stockReservedForMaintenance), 0) });
  } catch (error) { next(error); }
});

productRouter.post('/', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Thông tin sản phẩm không hợp lệ.', issues: parsed.error.issues });
      return;
    }
    const { images, variants, ...data } = parsed.data as any;
    const product = await prisma.product.create({
      data: {
        ...data,
        images: images?.length ? { create: images } : undefined,
        variants: variants?.length ? { create: variants } : { create: [{ size: 'M', color: 'default', stockTotal: 0 }] },
      },
      include: { images: true, category: true, variants: true },
    });
    res.status(201).json(product);
  } catch (error) { next(error); }
});

productRouter.put('/:id', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Thông tin sản phẩm không hợp lệ.', issues: parsed.error.issues });
      return;
    }
    const { images, variants, ...data } = parsed.data as any;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...data,
        images: images ? { deleteMany: {}, create: images } : undefined,
        variants: variants ? { deleteMany: {}, create: variants } : undefined,
      },
      include: { images: true, category: true, variants: true },
    });
    res.json(product);
  } catch (error) { next(error); }
});

productRouter.delete('/:id', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

productRouter.post('/:id/variants/:variantId', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN', 'WAREHOUSE'), async (req, res, next) => {
  try {
    const parsed = productVariantSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Thông tin biến thể không hợp lệ.', issues: parsed.error.issues });
      return;
    }
    const variant = await prisma.productVariant.update({
      where: { id: req.params.variantId, productId: req.params.id },
      data: parsed.data,
    });
    res.json(variant);
  } catch (error) { next(error); }
});

productRouter.post('/:id/maintenance', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN', 'WAREHOUSE'), async (req, res, next) => {
  try {
    const parsed = maintenanceSchema.safeParse({ ...req.body, productId: req.params.id });
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Thông tin bảo trì không hợp lệ.', issues: parsed.error.issues });
      return;
    }
    const item = await prisma.maintenance.create({
      data: {
        productId: parsed.data?.productId,
        variantId: parsed.data.variantId,
        reason: parsed.data.reason,
        startDate: toUtcDate(parsed.data.startDate),
        endDate: toUtcDate(parsed.data.endDate),
        cost: parsed.data.cost,
        note: parsed.data.note,
        status: parsed.data.status,
        createdById: req.authUser?.id,
      },
    });
    res.status(201).json(item);
  } catch (error) { next(error); }
});

productRouter.get('/:id/maintenance', requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.maintenance.findMany({ where: { productId: req.params.id }, orderBy: { createdAt: 'desc' } });
    res.json({ items });
  } catch (error) { next(error); }
});

productRouter.patch('/maintenance/:id', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN', 'WAREHOUSE'), async (req, res, next) => {
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
    const item = await prisma.maintenance.update({ where: { id: req.params.id }, data });
    res.json(item);
  } catch (error) { next(error); }
});
