import { z } from 'zod';

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
  pricePerDay: z.coerce.number().int().min(1000).optional(),
});

export const productSchema = z.object({
  sku: z.string().trim().min(2).max(50),
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(220),
  description: z.string().trim().min(10).max(4000),
  shortDescription: z.string().trim().max(400).optional(),
  categoryId: z.string().min(1),
  pricePerDay: z.coerce.number().int().min(1000),
  price3Days: z.coerce.number().int().min(1000).optional(),
  price7Days: z.coerce.number().int().min(1000).optional(),
  depositAmount: z.coerce.number().int().min(0).default(0),
  serviceFeeRate: z.coerce.number().min(0).max(1).default(0.05),
  brand: z.string().trim().max(100).optional(),
  material: z.string().trim().max(100).optional(),
  colorName: z.string().trim().max(50).optional(),
  sizeLabel: z.string().trim().max(30).optional(),
  videoUrl: z.string().url().optional(),
  status: z.string().default('available'),
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  images: z.array(z.object({
    url: z.string().url(),
    altText: z.string().trim().max(200).optional(),
    sortOrder: z.coerce.number().int().min(0).default(0),
  })).max(20).optional(),
  variants: z.array(productVariantSchema).max(20).optional(),
});

export const maintenanceSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  reason: z.string().trim().min(3).max(300),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  cost: z.coerce.number().int().min(0).default(0),
  note: z.string().trim().max(500).optional(),
  status: z.string().default('open'),
});

export const paymentSchema = z.object({
  bookingId: z.string().min(1),
  type: z.string().default('rental_fee'),
  amount: z.coerce.number().int().min(1000),
  method: z.string().default('cod'),
  status: z.string().default('pending'),
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
