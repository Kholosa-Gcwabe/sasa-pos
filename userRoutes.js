const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const menuItems = [
  // Staples & Sides
  { name: 'Pap', price: 20, category: 'Staples', description: 'Traditional maize porridge' },
  { name: 'Chakalaka', price: 25, category: 'Staples', description: 'Spicy vegetable relish' },
  { name: 'Dombolo', price: 30, category: 'Staples', description: 'Steamed bread' },
  { name: 'Morogo', price: 25, category: 'Staples', description: 'Wild spinach' },
  { name: 'Pap & Chakalaka', price: 40, category: 'Staples', description: 'Classic combo' },

  // Proteins
  { name: 'Grilled Meats', price: 60, category: 'Proteins', description: 'Assorted grilled meat platter' },
  { name: 'Peri-Peri Chicken', price: 55, category: 'Proteins', description: 'Spicy Portuguese-style chicken' },
  { name: 'Oxtail Stew', price: 80, category: 'Proteins', description: 'Slow-cooked oxtail in rich gravy' },
  { name: 'Tripe (Mogodu)', price: 70, category: 'Proteins', description: 'Traditional tripe stew' },
  { name: 'Boerewors', price: 65, category: 'Proteins', description: 'Traditional farmer's sausage' },

  // Vegetarian
  { name: 'Bean Stew', price: 40, category: 'Vegetarian', description: 'Hearty bean and vegetable stew' },
  { name: 'Pumpkin Curry', price: 35, category: 'Vegetarian', description: 'Creamy pumpkin curry' },
  { name: 'Lentil Bobotie', price: 45, category: 'Vegetarian', description: 'Vegetarian version of classic bobotie' },
  { name: 'Chakalaka & Pap', price: 40, category: 'Vegetarian', description: 'Vegetarian favorite' },

  // Street Food
  { name: 'Vetkoek', price: 25, category: 'StreetFood', description: 'Deep-fried dough with filling' },
  { name: 'Samosa', price: 20, category: 'StreetFood', description: 'Crispy pastry with spiced filling' },
  { name: 'Bunny Chow', price: 45, category: 'StreetFood', description: 'Hollow bread filled with curry' },
  { name: 'Kota (Gatsby)', price: 50, category: 'StreetFood', description: 'Quarter loaf filled with chips, meat & sauce' },

  // Desserts
  { name: 'Malva Pudding', price: 30, category: 'Desserts', description: 'Warm caramelized pudding' },
  { name: 'Koeksisters', price: 25, category: 'Desserts', description: 'Syrup-soaked twisted doughnuts' },
  { name: 'Milk Tart', price: 20, category: 'Desserts', description: 'Cinnamon-dusted custard tart' },
  { name: 'Peppermint Crisp Tart', price: 35, category: 'Desserts', description: 'No-bake fridge tart' },

  // Drinks
  { name: 'Mageu', price: 15, category: 'Drinks', description: 'Fermented maize drink' },
  { name: 'Rooibos Iced Tea', price: 20, category: 'Drinks', description: 'Refreshing iced rooibos' },
  { name: 'Ginger Beer', price: 25, category: 'Drinks', description: 'Homemade spicy ginger beer' },
  { name: 'Amasi', price: 18, category: 'Drinks', description: 'Traditional fermented milk' }
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const cashierPassword = await bcrypt.hash('cashier123', 12);
  const chefPassword = await bcrypt.hash('chef123', 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: adminPassword,
        role: 'Manager'
      }
    }),
    prisma.user.upsert({
      where: { username: 'cashier' },
      update: {},
      create: {
        username: 'cashier',
        password: cashierPassword,
        role: 'Cashier'
      }
    }),
    prisma.user.upsert({
      where: { username: 'chef' },
      update: {},
      create: {
        username: 'chef',
        password: chefPassword,
        role: 'Chef'
      }
    })
  ]);

  console.log('✅ Created users:', users.map(u => u.username).join(', '));

  // Create menu items
  const createdItems = [];
  for (const item of menuItems) {
    const created = await prisma.menuItem.upsert({
      where: { name: item.name },
      update: {},
      create: item
    });
    createdItems.push(created);
  }

  console.log(`✅ Created ${createdItems.length} menu items`);
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
