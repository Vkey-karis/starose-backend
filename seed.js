import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Item from './models/Item.js';
import Sale from './models/Sale.js';
import Expense from './models/Expense.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

// Reset function
const resetData = async () => {
  try {
    console.log('🚨 Clearing all collections...');
    await User.deleteMany();
    await Item.deleteMany();
    await Sale.deleteMany();
    await Expense.deleteMany();

    console.log('✅ All data cleared successfully.');

    // Create fresh admin user
    const adminUser = await User.create({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log(`👑 Admin user created: ${adminUser.email}`);

    console.log('✨ System is now clean. You can start entering fresh records.');
    process.exit();
  } catch (error) {
    console.error(`❌ Error during reset: ${error.message}`);
    process.exit(1);
  }
};

// Optional sample seeding
const seedSampleData = async () => {
  try {
    console.log('🧩 Resetting and seeding sample data...');
    await User.deleteMany();
    await Item.deleteMany();
    await Sale.deleteMany();
    await Expense.deleteMany();

    // Create Admin User
    const adminUser = await User.create({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log('👑 Admin user created');

    // Create sample items
    const sampleItems = [
      { name: 'Printing A4 B&W', category: 'Services', buyingPrice: 1, defaultSellingPrice: 10, quantity: 10000, lowStockThreshold: 0 },
      { name: 'Photocopy A4', category: 'Services', buyingPrice: 1, defaultSellingPrice: 5, quantity: 10000, lowStockThreshold: 0 },
      { name: 'Scanning per Page', category: 'Services', buyingPrice: 0, defaultSellingPrice: 20, quantity: 1000, lowStockThreshold: 0 },
      { name: 'Coca-Cola 500ml', category: 'Drinks', buyingPrice: 40, defaultSellingPrice: 60, quantity: 24, lowStockThreshold: 6 },
      { name: 'Fanta 500ml', category: 'Drinks', buyingPrice: 40, defaultSellingPrice: 60, quantity: 18, lowStockThreshold: 6 },
      { name: 'K-Gas Refill 6kg', category: 'Supplies', buyingPrice: 1300, defaultSellingPrice: 1600, quantity: 3, lowStockThreshold: 1 },
    ];
    const createdItems = await Item.insertMany(sampleItems);
    console.log('📦 Sample items created');

    // Sample sales
    const sampleSales = [
      {
        itemId: createdItems[0]._id,
        itemName: createdItems[0].name,
        quantitySold: 10,
        actualSellingPrice: 10,
        totalSale: 100,
        buyingPriceAtSale: createdItems[0].buyingPrice,
        profit: (10 - createdItems[0].buyingPrice) * 10,
        paymentMethod: 'Cash',
        attendant: 'John Doe',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        itemId: createdItems[3]._id,
        itemName: createdItems[3].name,
        quantitySold: 2,
        actualSellingPrice: 60,
        totalSale: 120,
        buyingPriceAtSale: createdItems[3].buyingPrice,
        profit: (60 - createdItems[3].buyingPrice) * 2,
        paymentMethod: 'Mpesa',
        attendant: 'Jane Smith',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];
    await Sale.insertMany(sampleSales);
    await Item.findByIdAndUpdate(createdItems[0]._id, { $inc: { quantity: -10 } });
    await Item.findByIdAndUpdate(createdItems[3]._id, { $inc: { quantity: -2 } });
    console.log('💰 Sample sales created and stock adjusted');

    // Sample expenses
    const sampleExpenses = [
      { amount: 20000, category: 'rent', description: 'January Rent', date: new Date(new Date().setDate(1)) },
      { amount: 500, category: 'utilities', description: 'Internet Bill', date: new Date(new Date().setDate(5)) },
      { amount: 3000, category: 'wages', description: 'Weekly wages for staff', date: new Date(new Date().setDate(7)) },
    ];
    await Expense.insertMany(sampleExpenses);
    console.log('🧾 Sample expenses created');

    console.log('✅ Sample data seeded successfully.');
    process.exit();
  } catch (error) {
    console.error(`❌ Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

// Choose action based on command
if (process.argv[2] === '-reset') {
  resetData();
} else if (process.argv[2] === '-seed') {
  seedSampleData();
} else {
  console.log('⚙️ Usage: node seed.js [-reset | -seed]');
  process.exit();
}
