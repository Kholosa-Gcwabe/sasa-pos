generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  username  String   @unique
  password  String
  role      Role     @default(Cashier)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orders    Order[]

  @@map("users")
}

model MenuItem {
  id          String   @id @default(uuid())
  name        String   @unique
  price       Float
  category    Category
  description String?
  available   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("menu_items")
}

model Order {
  id          String      @id @default(uuid())
  orderNumber String      @unique
  status      OrderStatus @default(PENDING)
  total       Float       @default(0)
  createdBy   String
  user        User        @relation(fields: [createdBy], references: [id])
  items       OrderItem[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  completedAt DateTime?

  @@map("orders")
}

model OrderItem {
  id       String @id @default(uuid())
  orderId  String
  order    Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)
  name     String
  price    Float
  quantity Int    @default(1)

  @@map("order_items")
}

enum Role {
  Cashier
  Chef
  Manager
}

enum Category {
  Staples
  Proteins
  Vegetarian
  StreetFood
  Desserts
  Drinks
}

enum OrderStatus {
  PENDING
  PREPARING
  READY
  COMPLETED
  CANCELLED
}
