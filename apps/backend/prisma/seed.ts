import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categorySeeds = [
  ['Váy dự tiệc', 'vay-du-tiec', 'Thiết kế thanh lịch cho những buổi tiệc đáng nhớ.'],
  ['Váy cưới', 'vay-cuoi', 'Những khoảnh khắc đẹp nhất bắt đầu từ chiếc váy hoàn hảo.'],
  ['Áo dài', 'ao-dai', 'Nét đẹp truyền thống trong diện mạo hiện đại.'],
  ['Vest', 'vest', 'Phong thái chỉn chu cho sự kiện đặc biệt.'],
  ['Trang phục sự kiện', 'trang-phuc-su-kien', 'Tỏa sáng ở mọi sân khấu và sự kiện.'],
  ['Cosplay', 'cosplay', 'Biến hóa thành nhân vật bạn yêu thích.'],
  ['Trang phục biểu diễn', 'trang-phuc-bieu-dien', 'Thiết kế nổi bật, thoải mái chuyển động.'],
  ['Phụ kiện', 'phu-kien', 'Hoàn thiện phong cách bằng những điểm nhấn tinh tế.'],
];

const productNames = [
  'Váy Dạ Hội Aurora', 'Váy Lụa Champagne', 'Váy Đen Velvet', 'Váy Rose Garden',
  'Váy Pearl Muse', 'Váy Midnight Star', 'Váy Silk Serenity', 'Váy Golden Hour',
  'Váy Emerald Grace', 'Váy Blush Bloom', 'Áo Dài Ngọc Lan', 'Áo Dài Mộc Miên',
  'Vest Milano Classic', 'Vest Midnight Blue', 'Vest Sandstone', 'Crown Hairpiece',
];

async function main() {
  const permissions = [
    'dashboard.view', 'product.view', 'product.create', 'product.edit', 'product.delete',
    'booking.view', 'booking.create', 'booking.edit', 'booking.approve', 'booking.cancel',
    'inventory.view', 'inventory.edit', 'maintenance.create', 'payment.view', 'payment.refund',
    'customer.view', 'report.view', 'settings.edit',
  ];
  for (const code of permissions) {
    await prisma.permission.upsert({ where: { code }, update: {}, create: { code } });
  }

  const role = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { name: 'SUPER_ADMIN', description: 'Toàn quyền quản trị', isSystem: true },
  });
  const permissionRows = await prisma.permission.findMany();
  for (const permission of permissionRows) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {}, create: { roleId: role.id, permissionId: permission.id },
    });
  }
  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' }, update: {}, create: { name: 'CUSTOMER', description: 'Khách hàng' },
  });

  const passwordHash = await bcrypt.hash('Admin@123456', 12);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' }, update: {},
    create: { email: 'admin@example.com', fullName: 'Nguyễn Minh Anh', passwordHash, roleId: role.id, mustChangePassword: true },
  });

  const categories = [];
  for (const [name, slug, description] of categorySeeds) {
    categories.push(await prisma.category.upsert({
      where: { slug }, update: {}, create: { name, slug, description, imageUrl: `https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&q=80` },
    }));
  }

  for (let i = 0; i < 50; i += 1) {
    const name = productNames[i % productNames.length] + (i >= productNames.length ? ` ${Math.floor(i / productNames.length) + 1}` : '');
    const slug = `${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${i + 1}`;
    const category = categories[i % categories.length];
    const product = await prisma.product.upsert({
      where: { sku: `DRESS-${String(i + 1).padStart(4, '0')}` }, update: {},
      create: {
        sku: `DRESS-${String(i + 1).padStart(4, '0')}`, name, slug,
        description: `Thiết kế ${name} được tuyển chọn từ bộ sưu tập cao cấp, phù hợp cho những dịp đặc biệt. Chất liệu mềm mại, phom dáng tinh tế và được chăm sóc kỹ lưỡng sau mỗi lần thuê.`,
        shortDescription: 'Thiết kế thanh lịch cho những khoảnh khắc đáng nhớ.',
        categoryId: category.id, pricePerDay: 450000 + (i % 6) * 100000,
        price3Days: 1100000 + (i % 6) * 250000, price7Days: 2200000 + (i % 6) * 450000,
        depositAmount: 1000000 + (i % 4) * 500000, brand: 'Maison Élégance', material: i % 2 ? 'Lụa satin' : 'Ren cao cấp', colorName: ['Đen', 'Champagne', 'Đỏ ruby', 'Xanh midnight', 'Hồng phấn'][i % 5], sizeLabel: 'S / M / L', isFeatured: i < 8,
        images: { create: [
          { url: `https://images.unsplash.com/photo-${['1515372039744-b8f02a3ae446', '1566174053879-31528523f8ae', '1595777457583-95e059d581b8', '1539008835657-9e8e9680c956'][i % 4]}?auto=format&fit=crop&w=1000&q=85`, altText: name, sortOrder: 0 },
          { url: `https://images.unsplash.com/photo-${['1496747611176-843222e1e57c', '1525507119028-ed4c629a60a3', '1485230895905-ec40ba36b9bc'][i % 3]}?auto=format&fit=crop&w=1000&q=85`, altText: `${name} detail`, sortOrder: 1 },
        ] },
        variants: { create: [
          { size: 'S', color: 'default', stockTotal: 2 }, { size: 'M', color: 'default', stockTotal: 3 }, { size: 'L', color: 'default', stockTotal: 2 },
        ] },
      },
    });
    if (!product) throw new Error('Product seed failed');
  }

  for (let i = 1; i <= 30; i += 1) {
    const email = `customer${i}@example.com`;
    await prisma.customer.upsert({
      where: { email }, update: {}, create: { email, fullName: `Khách hàng ${i}`, phone: `090${String(1000000 + i).slice(-7)}`, address: 'Hồ Chí Minh' },
    });
  }

  for (const keyValue of [
    ['rental.bufferDays', '1', 'rental'], ['rental.minDays', '1', 'rental'], ['rental.maxDays', '30', 'rental'], ['store.name', 'Élan Rental', 'general'],
    ['payment.bankName', 'Vietcombank', 'payment'], ['payment.accountNumber', '0123456789', 'payment'], ['payment.accountName', 'ELAN RENTAL', 'payment'], ['payment.branch', 'Chi nhánh trung tâm', 'payment'], ['payment.qrUrl', '', 'payment'],
  ]) await prisma.setting.upsert({ where: { key: keyValue[0] }, update: { value: keyValue[1], group: keyValue[2] }, create: { key: keyValue[0], value: keyValue[1], group: keyValue[2] } });

  // Demo operational data: bookings, maintenance, payments and notifications.
  const demoCustomers = await prisma.customer.findMany({ take: 10 });
  const products = await prisma.product.findMany({ include: { variants: true }, take: 20 });
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
  const statuses = ['pending', 'confirmed', 'preparing', 'picked_up', 'returned', 'completed'];
  const now = new Date();

  for (let i = 0; i < 25; i += 1) {
    const customer = demoCustomers[i % demoCustomers.length];
    const product = products[i % products.length];
    const variant = product.variants[0];
    const start = new Date(now.getTime() + (i - 10) * 86_400_000);
    const end = new Date(start.getTime() + (2 + (i % 5)) * 86_400_000);
    const rentalDays = Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
    const lineSubtotal = product.pricePerDay * rentalDays;
    const lineDeposit = product.depositAmount;
    const serviceFee = Math.round(lineSubtotal * product.serviceFeeRate);
    const total = lineSubtotal + serviceFee;
    const dateCode = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
    const bookingCode = `BK${dateCode}${String(i + 1).padStart(4, '0')}`;

    if (!(await prisma.booking.findUnique({ where: { bookingCode } }))) {
      const booking = await prisma.booking.create({
        data: {
          bookingCode,
          customerId: customer.id,
          status: statuses[i % statuses.length],
          paymentStatus: i % 3 === 0 ? 'paid' : 'pending',
          pickupDate: start,
          returnDate: end,
          rentalDays,
          subtotal: lineSubtotal,
          serviceFee,
          deposit: lineDeposit,
          total,
          deliveryMethod: 'store_pickup',
          paymentMethod: 'cod',
          items: { create: { productId: product.id, variantId: variant?.id, size: variant?.size || 'M', color: variant?.color || 'default', quantity: 1, pricePerDay: product.pricePerDay, rentalDays, lineSubtotal, lineDeposit } },
          history: { create: { toStatus: statuses[i % statuses.length] } },
        },
      });
      if (i % 3 === 0) await prisma.payment.create({ data: { bookingId: booking.id, type: 'rental_fee', amount: total, status: 'paid', method: 'cod', paidAt: new Date() } });
    }
  }

  for (let i = 0; i < 10; i += 1) {
    const product = products[i % products.length];
    if (!(await prisma.maintenance.findFirst({ where: { productId: product.id, reason: `Định kỳ #${i + 1}` } }))) {
      await prisma.maintenance.create({ data: { productId: product.id, reason: `Định kỳ #${i + 1}`, startDate: now, endDate: new Date(now.getTime() + 3 * 86_400_000), cost: 50000 + i * 10000, note: 'Kiểm tra và giặt hấp', status: 'open', createdById: adminUser?.id } });
    }
  }

  for (let i = 0; i < 5; i += 1) {
    const code = `WELCOME${i + 1}`;
    if (!(await prisma.coupon.findUnique({ where: { code } }))) await prisma.coupon.create({ data: { code, description: 'Giảm giá đơn thuê đầu tiên', discountType: 'percent', discountValue: 10, minOrderAmount: 500000, startsAt: now, expiresAt: new Date(now.getTime() + 30 * 86_400_000) } });
  }

  if (demoCustomers.length > 0 && products.length > 0 && !(await prisma.review.findFirst())) {
    await prisma.review.create({ data: { productId: products[0].id, customerId: demoCustomers[0].id, rating: 5, comment: 'Dịch vụ rất tốt, trang phục đẹp.', isApproved: true } });
  }

  await prisma.lock.upsert({ where: { key: 'booking:global' }, update: {}, create: { key: 'booking:global' } });
  console.log('Seed completed: admin@example.com / Admin@123456');
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
