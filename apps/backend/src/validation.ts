import { z } from 'zod';

// Thông báo lỗi validation bằng tiếng Việt cho mọi schema (hiển thị trực tiếp trên UI).
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return { message: issue.received === 'undefined' || issue.received === 'null' ? 'Bắt buộc nhập.' : 'Sai kiểu dữ liệu.' };
    case z.ZodIssueCode.too_small:
      return { message: issue.type === 'string' ? `Tối thiểu ${issue.minimum} ký tự.` : issue.type === 'array' ? `Tối thiểu ${issue.minimum} mục.` : `Giá trị tối thiểu là ${issue.minimum}.` };
    case z.ZodIssueCode.too_big:
      return { message: issue.type === 'string' ? `Tối đa ${issue.maximum} ký tự.` : issue.type === 'array' ? `Tối đa ${issue.maximum} mục.` : `Giá trị tối đa là ${issue.maximum}.` };
    case z.ZodIssueCode.invalid_string:
      return { message: issue.validation === 'email' ? 'Email không hợp lệ.' : issue.validation === 'url' ? 'URL không hợp lệ.' : 'Chuỗi không hợp lệ.' };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: 'Giá trị không hợp lệ.' };
    default:
      return { message: ctx.defaultError };
  }
});

/** Cột nullable: chuỗi rỗng từ form được lưu là null. */
const nullableText = (max: number) => z.string().trim().max(max).nullish().transform((value) => (value === '' ? null : value));

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().email(),
  phone: z.string().trim().min(8).max(20),
  password: z.string().min(8).max(100),
});

export const availabilitySchema = z.object({
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  quantity: z.coerce.number().int().min(1).max(50).default(1),
  variantId: z.string().optional(),
});

export const createBookingSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  size: z.string().trim().min(1).max(30),
  color: z.string().trim().min(1).max(50).default('default'),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  pickupDate: z.string().min(8),
  returnDate: z.string().min(8),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  email: z.string().email(),
  address: z.string().trim().max(300).optional(),
  note: z.string().trim().max(1000).optional(),
  deliveryMethod: z.enum(['store_pickup', 'home_delivery']).default('store_pickup'),
  paymentMethod: z.enum(['cod', 'bank_transfer', 'qr', 'ewallet', 'online']).default('cod'),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'delivering', 'picked_up', 'returned', 'completed', 'cancelled', 'rejected']),
  note: z.string().trim().max(500).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const productVariantSchema = z.object({
  size: z.string().trim().min(1).max(10),
  color: z.string().trim().min(1).max(30).default('default'),
  stockTotal: z.coerce.number().int().min(0).default(0),
  pricePerDay: z.coerce.number().int().min(1000).nullish(),
});

export const productSchema = z.object({
  sku: z.string().trim().min(2).max(50),
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(220),
  description: z.string().trim().min(10).max(4000),
  shortDescription: nullableText(400),
  categoryId: z.string().min(1),
  pricePerDay: z.coerce.number().int().min(1000),
  price3Days: z.coerce.number().int().min(1000).optional(),
  price7Days: z.coerce.number().int().min(1000).optional(),
  depositAmount: z.coerce.number().int().min(0).default(0),
  serviceFeeRate: z.coerce.number().min(0).max(1).default(0.05),
  brand: nullableText(100),
  material: nullableText(100),
  colorName: nullableText(50),
  sizeLabel: nullableText(30),
  videoUrl: z.string().url().nullish(),
  status: z.enum(['available', 'reserved', 'rented', 'maintenance', 'inactive']).default('available'),
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  images: z.array(z.object({
    url: z.string().url(),
    altText: nullableText(200),
    sortOrder: z.coerce.number().int().min(0).default(0),
  })).max(20).optional(),
  variants: z.array(productVariantSchema).max(20)
    .refine((variants) => new Set(variants.map((v) => `${v.size}|${v.color}`)).size === variants.length, 'Biến thể bị trùng size và màu.')
    .optional(),
});

export const maintenanceSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  reason: z.string().trim().min(3).max(300),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  cost: z.coerce.number().int().min(0).default(0),
  note: z.string().trim().max(500).optional(),
  status: z.enum(['open', 'in_progress', 'done', 'cancelled']).default('open'),
});

export const paymentSchema = z.object({
  bookingId: z.string().min(1),
  type: z.enum(['deposit', 'rental_fee', 'shipping', 'refund']).default('rental_fee'),
  amount: z.coerce.number().int().min(1000),
  method: z.enum(['cod', 'bank_transfer', 'qr', 'ewallet', 'online']).default('cod'),
  status: z.enum(['pending', 'paid', 'partial', 'refunded', 'failed', 'cancelled']).default('pending'),
  provider: z.string().optional(),
  providerTxnId: z.string().optional(),
  paidAt: z.string().optional(),
  note: z.string().trim().max(500).optional(),
});

export const settingSchema = z.object({
  key: z.string().trim().min(2).max(120),
  value: z.string().max(2000),
  group: z.string().trim().max(50).default('general'),
});

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  fullName: z.string().trim().min(2).max(100),
  password: z.string().min(8).max(100),
  roleId: z.string().min(1),
  isActive: z.boolean().default(true),
  mustChangePassword: z.boolean().default(false),
});
