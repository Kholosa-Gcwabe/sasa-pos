#!/bin/bash

echo "🍽️  Sasa POS Setup Script"
echo "========================"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🗄️  Setting up database..."
npx prisma migrate dev --name init

# Seed database
echo "🌱 Seeding database..."
npx prisma db seed

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Start the app with:"
echo "  npm run dev"
echo ""
echo "Demo credentials:"
echo "  Manager:  admin / admin123"
echo "  Cashier:  cashier / cashier123"
echo "  Chef:     chef / chef123"
