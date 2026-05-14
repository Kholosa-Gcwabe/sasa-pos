# 🍽️ Sasa POS - South African Kitchen Management System

A full-stack Point of Sale system built for South African kitchens, featuring real-time order management, role-based access control, and a modern responsive UI.

## ✨ Features

### Core Functionality
- **Digital Order Flow**: Counter → Kitchen → Completion
- **Real-time Updates**: Socket.io for live kitchen notifications
- **Role-Based Access**: Cashier, Chef, Manager permissions
- **Automated Receipts**: VAT calculation, order numbering
- **Order Lifecycle**: Pending → Preparing → Ready → Completed

### South African Menu
- Staples & Sides (Pap, Chakalaka, Dombolo, Morogo)
- Proteins (Peri-Peri Chicken, Oxtail, Boerewors)
- Vegetarian Options (Bean Stew, Pumpkin Curry)
- Street Food (Bunny Chow, Kota/Gatsby, Vetkoek)
- Desserts (Malva Pudding, Koeksisters, Milk Tart)
- Traditional Drinks (Mageu, Rooibos, Amasi)

## 🏗️ Architecture

```
sasa-pos/
├── backend/
│   ├── src/
│   │   ├── config/         # Database & JWT config
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth & error handling
│   │   ├── routes/         # API endpoints
│   │   ├── utils/          # Helpers
│   │   └── server.js       # Entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.js         # Demo data
│   └── .env                # Environment variables
├── frontend/
│   ├── index.html          # Main UI
│   ├── style.css           # Design system
│   └── script.js           # Frontend logic
└── package.json            # Root orchestration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Install Dependencies
```bash
# Root (installs concurrently)
npm install

# Backend
cd backend
npm install

# Generate Prisma client
npx prisma generate
```

### 2. Setup Database
```bash
# Run migrations (creates SQLite database)
npx prisma migrate dev --name init

# Seed with demo data
npx prisma db seed
```

### 3. Start Development Servers
```bash
# From root directory - starts both frontend and backend
npm run dev
```

Or separately:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npx serve . -p 5500
```

### 4. Access the App
- **Frontend**: http://localhost:5500
- **Backend API**: http://localhost:3000/api
- **Prisma Studio** (DB GUI): `npx prisma studio`

## 🔑 Demo Credentials

| Username | Password | Role     | Access                          |
|----------|----------|----------|---------------------------------|
| admin    | admin123 | Manager  | Full system access              |
| cashier  | cashier123| Cashier | POS only                        |
| chef     | chef123  | Chef     | Kitchen view only               |

## 📡 API Endpoints

### Authentication
```
POST /api/auth/login          - Login
POST /api/auth/register       - Create user (Manager only)
GET  /api/auth/me             - Get current user
PUT  /api/auth/password       - Change password
```

### Orders
```
POST   /api/orders            - Create order
GET    /api/orders            - List orders (with filters)
GET    /api/orders/active     - Active orders (Kitchen view)
GET    /api/orders/stats/today- Today's statistics
GET    /api/orders/:id        - Get single order
PUT    /api/orders/:id/status- Update status
PUT    /api/orders/:id/cancel- Cancel order
```

### Users (Manager only)
```
GET    /api/users             - List all users
GET    /api/users/:id         - Get user details
PUT    /api/users/:id         - Update user
DELETE /api/users/:id         - Delete user
```

### Menu
```
GET    /api/menu              - List menu items
POST   /api/menu              - Create item (Manager)
PUT    /api/menu/:id          - Update item (Manager)
DELETE /api/menu/:id          - Delete item (Manager)
```

## 🗄️ Database Schema

### Users
- `id`, `username`, `password`, `role` (Cashier/Chef/Manager)
- `isActive`, `createdAt`, `updatedAt`

### Orders
- `id`, `orderNumber`, `status`, `total`
- `createdBy` → User, `createdAt`, `completedAt`
- Related: `OrderItem[]`

### OrderItems
- `id`, `orderId` → Order, `name`, `price`, `quantity`

### MenuItems
- `id`, `name`, `price`, `category`, `description`, `available`

## 🔒 Security Features

- **JWT Authentication**: Stateless token-based auth
- **Password Hashing**: bcrypt with salt rounds 12
- **Role Authorization**: Route-level permission checks
- **Input Validation**: express-validator on all inputs
- **CORS Protection**: Configured for frontend origin
- **SQL Injection Safe**: Prisma ORM parameterized queries

## 🔄 Real-Time Features

Socket.io events:
- `order:created` - New order notification
- `order:updated` - Status change notification
- `join:kitchen` - Subscribe to kitchen updates
- `leave:kitchen` - Unsubscribe from updates

## 🛠️ Development Commands

```bash
# Reset database
npm run db:reset

# Open database GUI
npm run db:studio

# Run migrations
npm run server -- db:migrate
```

## 📦 Production Deployment

### Environment Variables
```env
DATABASE_URL="postgresql://user:pass@host:5432/sasapos"
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=production
FRONTEND_URL="https://yourdomain.com"
```

### Steps
1. Set up PostgreSQL database
2. Update `DATABASE_URL` in `.env`
3. Change schema provider to `postgresql` in `prisma/schema.prisma`
4. Run `npx prisma migrate deploy`
5. Build and start: `npm start`

## 📝 License

MIT License - Built for learning full-stack development.

## 🙏 Credits

Built with Node.js, Express, Prisma, Socket.io, and vanilla JavaScript.
