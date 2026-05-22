const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12);
  const cashierPassword = await bcrypt.hash('cashier123', 12);
  const chefPassword = await bcrypt.hash('chef123', 12);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: adminPassword, role: 'Manager' }
  });

  await prisma.user.upsert({
    where: { username: 'cashier' },
    update: {},
    create: { username: 'cashier', password: cashierPassword, role: 'Cashier' }
  });

  await prisma.user.upsert({
    where: { username: 'chef' },
    update: {},
    create: { username: 'chef', password: chefPassword, role: 'Chef' }
  });

  console.log('✅ Users created: admin, cashier, chef');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
