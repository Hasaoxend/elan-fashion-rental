import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [categories, products, customers, users, variants] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.customer.count(),
    prisma.user.count(),
    prisma.productVariant.count(),
  ]);
  console.log(JSON.stringify({ categories, products, customers, users, variants }, null, 2));
}

main().finally(() => prisma.$disconnect());