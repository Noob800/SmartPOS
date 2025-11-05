
import { db } from "./db";
import { 
  users, products, sales, saleItems, stockAdjustments, 
  settings, accounts, journalEntries, ledgerEntries,
  type InsertUser, type InsertProduct, type InsertSale, 
  type InsertSaleItem, type InsertStockAdjustment,
  type InsertAccount, type InsertJournalEntry, type InsertLedgerEntry
} from "@shared/schema";

export async function seedMockData() {
  console.log("Starting mock data seeding...");

  // Clear existing data (in reverse order of dependencies)
  await db.delete(ledgerEntries);
  await db.delete(journalEntries);
  await db.delete(saleItems);
  await db.delete(sales);
  await db.delete(stockAdjustments);
  await db.delete(products);
  await db.delete(users);
  await db.delete(accounts);
  await db.delete(settings);

  // Seed Users
  const mockUsers: InsertUser[] = [
    { name: "Admin User", pin: "1234", role: "admin", isActive: true },
    { name: "John Manager", pin: "5678", role: "admin", isActive: true },
    { name: "Sarah Cashier", pin: "0000", role: "cashier", isActive: true },
    { name: "Mike Cashier", pin: "1111", role: "cashier", isActive: true },
    { name: "Emma Worker", pin: "2222", role: "cashier", isActive: false },
  ];

  const insertedUsers = await db.insert(users).values(mockUsers).returning();
  console.log(`✓ Seeded ${insertedUsers.length} users`);

  // Seed Products (50 diverse products)
  const mockProducts: InsertProduct[] = [
    // Beverages
    { name: "Coca Cola 500ml", sku: "BEV001", barcode: "1234567890123", category: "Beverages", price: "50.00", costPrice: "35.00", stock: 48, minStock: 10 },
    { name: "Pepsi 500ml", sku: "BEV002", barcode: "1234567890124", category: "Beverages", price: "50.00", costPrice: "35.00", stock: 36, minStock: 10 },
    { name: "Sprite 500ml", sku: "BEV003", barcode: "1234567890125", category: "Beverages", price: "50.00", costPrice: "35.00", stock: 24, minStock: 10 },
    { name: "Fanta Orange 500ml", sku: "BEV004", barcode: "1234567890126", category: "Beverages", price: "50.00", costPrice: "35.00", stock: 30, minStock: 10 },
    { name: "Water 500ml", sku: "BEV005", barcode: "1234567890127", category: "Beverages", price: "30.00", costPrice: "20.00", stock: 100, minStock: 20 },
    { name: "Energy Drink", sku: "BEV006", barcode: "1234567890128", category: "Beverages", price: "120.00", costPrice: "85.00", stock: 24, minStock: 5 },
    { name: "Juice 1L", sku: "BEV007", barcode: "1234567890129", category: "Beverages", price: "150.00", costPrice: "110.00", stock: 18, minStock: 5 },
    { name: "Iced Tea 500ml", sku: "BEV008", barcode: "1234567890130", category: "Beverages", price: "60.00", costPrice: "42.00", stock: 20, minStock: 8 },

    // Dairy
    { name: "Milk 1L", sku: "DAIRY001", barcode: "2345678901234", category: "Dairy", price: "75.00", costPrice: "55.00", stock: 24, minStock: 8 },
    { name: "Yogurt 500g", sku: "DAIRY002", barcode: "2345678901235", category: "Dairy", price: "80.00", costPrice: "60.00", stock: 15, minStock: 5 },
    { name: "Cheese 250g", sku: "DAIRY003", barcode: "2345678901236", category: "Dairy", price: "200.00", costPrice: "150.00", stock: 12, minStock: 4 },
    { name: "Butter 500g", sku: "DAIRY004", barcode: "2345678901237", category: "Dairy", price: "180.00", costPrice: "140.00", stock: 10, minStock: 3 },

    // Bakery
    { name: "Bread Loaf", sku: "BAK001", barcode: "3456789012345", category: "Bakery", price: "45.00", costPrice: "30.00", stock: 20, minStock: 5 },
    { name: "Baguette", sku: "BAK002", barcode: "3456789012346", category: "Bakery", price: "35.00", costPrice: "22.00", stock: 15, minStock: 5 },
    { name: "Croissant Pack", sku: "BAK003", barcode: "3456789012347", category: "Bakery", price: "120.00", costPrice: "85.00", stock: 8, minStock: 3 },
    { name: "Donuts 6pk", sku: "BAK004", barcode: "3456789012348", category: "Bakery", price: "150.00", costPrice: "100.00", stock: 12, minStock: 4 },

    // Snacks
    { name: "Chips 150g", sku: "SNK001", barcode: "4567890123456", category: "Snacks", price: "65.00", costPrice: "45.00", stock: 40, minStock: 10 },
    { name: "Chocolate Bar", sku: "SNK002", barcode: "4567890123457", category: "Snacks", price: "50.00", costPrice: "35.00", stock: 50, minStock: 15 },
    { name: "Cookies Pack", sku: "SNK003", barcode: "4567890123458", category: "Snacks", price: "80.00", costPrice: "55.00", stock: 30, minStock: 8 },
    { name: "Nuts Mix 200g", sku: "SNK004", barcode: "4567890123459", category: "Snacks", price: "180.00", costPrice: "130.00", stock: 20, minStock: 5 },
    { name: "Popcorn", sku: "SNK005", barcode: "4567890123460", category: "Snacks", price: "40.00", costPrice: "28.00", stock: 25, minStock: 8 },

    // Household
    { name: "Dish Soap 500ml", sku: "HH001", barcode: "5678901234567", category: "Household", price: "120.00", costPrice: "85.00", stock: 15, minStock: 5 },
    { name: "Laundry Detergent 1kg", sku: "HH002", barcode: "5678901234568", category: "Household", price: "280.00", costPrice: "200.00", stock: 10, minStock: 3 },
    { name: "Toilet Paper 4pk", sku: "HH003", barcode: "5678901234569", category: "Household", price: "150.00", costPrice: "110.00", stock: 20, minStock: 5 },
    { name: "Paper Towels", sku: "HH004", barcode: "5678901234570", category: "Household", price: "90.00", costPrice: "65.00", stock: 18, minStock: 5 },
    { name: "Garbage Bags", sku: "HH005", barcode: "5678901234571", category: "Household", price: "100.00", costPrice: "70.00", stock: 15, minStock: 5 },

    // Personal Care
    { name: "Toothpaste", sku: "PC001", barcode: "6789012345678", category: "Personal Care", price: "120.00", costPrice: "85.00", stock: 25, minStock: 8 },
    { name: "Shampoo 400ml", sku: "PC002", barcode: "6789012345679", category: "Personal Care", price: "180.00", costPrice: "130.00", stock: 20, minStock: 5 },
    { name: "Soap Bar", sku: "PC003", barcode: "6789012345680", category: "Personal Care", price: "50.00", costPrice: "35.00", stock: 30, minStock: 10 },
    { name: "Deodorant", sku: "PC004", barcode: "6789012345681", category: "Personal Care", price: "150.00", costPrice: "110.00", stock: 15, minStock: 5 },
    { name: "Tissue Box", sku: "PC005", barcode: "6789012345682", category: "Personal Care", price: "60.00", costPrice: "42.00", stock: 20, minStock: 8 },

    // Canned Goods
    { name: "Canned Beans 400g", sku: "CAN001", barcode: "7890123456789", category: "Canned Goods", price: "90.00", costPrice: "65.00", stock: 30, minStock: 10 },
    { name: "Canned Tomatoes 400g", sku: "CAN002", barcode: "7890123456790", category: "Canned Goods", price: "85.00", costPrice: "60.00", stock: 25, minStock: 8 },
    { name: "Canned Tuna", sku: "CAN003", barcode: "7890123456791", category: "Canned Goods", price: "120.00", costPrice: "85.00", stock: 20, minStock: 8 },
    { name: "Canned Corn 400g", sku: "CAN004", barcode: "7890123456792", category: "Canned Goods", price: "75.00", costPrice: "52.00", stock: 22, minStock: 8 },

    // Frozen
    { name: "Ice Cream 1L", sku: "FRZ001", barcode: "8901234567890", category: "Frozen", price: "250.00", costPrice: "180.00", stock: 12, minStock: 4 },
    { name: "Frozen Pizza", sku: "FRZ002", barcode: "8901234567891", category: "Frozen", price: "350.00", costPrice: "250.00", stock: 8, minStock: 3 },
    { name: "Frozen Vegetables 500g", sku: "FRZ003", barcode: "8901234567892", category: "Frozen", price: "120.00", costPrice: "85.00", stock: 15, minStock: 5 },

    // Grains & Pasta
    { name: "Rice 2kg", sku: "GRN001", barcode: "9012345678901", category: "Grains", price: "180.00", costPrice: "130.00", stock: 20, minStock: 5 },
    { name: "Pasta 500g", sku: "GRN002", barcode: "9012345678902", category: "Grains", price: "95.00", costPrice: "68.00", stock: 25, minStock: 8 },
    { name: "Flour 2kg", sku: "GRN003", barcode: "9012345678903", category: "Grains", price: "150.00", costPrice: "110.00", stock: 18, minStock: 5 },
    { name: "Cooking Oil 1L", sku: "GRN004", barcode: "9012345678904", category: "Grains", price: "220.00", costPrice: "165.00", stock: 15, minStock: 5 },

    // Condiments
    { name: "Ketchup 500g", sku: "CND001", barcode: "0123456789012", category: "Condiments", price: "120.00", costPrice: "85.00", stock: 20, minStock: 5 },
    { name: "Mayonnaise 500g", sku: "CND002", barcode: "0123456789013", category: "Condiments", price: "150.00", costPrice: "110.00", stock: 15, minStock: 5 },
    { name: "Mustard", sku: "CND003", barcode: "0123456789014", category: "Condiments", price: "80.00", costPrice: "58.00", stock: 12, minStock: 4 },
    { name: "Hot Sauce", sku: "CND004", barcode: "0123456789015", category: "Condiments", price: "95.00", costPrice: "68.00", stock: 18, minStock: 5 },

    // Candy
    { name: "Gummy Bears 200g", sku: "CND001", barcode: "1123456789012", category: "Candy", price: "85.00", costPrice: "60.00", stock: 35, minStock: 10 },
    { name: "Lollipops Pack", sku: "CND002", barcode: "1123456789013", category: "Candy", price: "60.00", costPrice: "42.00", stock: 40, minStock: 12 },
    { name: "Mints", sku: "CND003", barcode: "1123456789014", category: "Candy", price: "35.00", costPrice: "25.00", stock: 50, minStock: 15 },
    { name: "Chocolate Box", sku: "CND004", barcode: "1123456789015", category: "Candy", price: "280.00", costPrice: "200.00", stock: 10, minStock: 3 },
  ];

  const insertedProducts = await db.insert(products).values(mockProducts).returning();
  console.log(`✓ Seeded ${insertedProducts.length} products`);

  // Seed Chart of Accounts
  const mockAccounts: InsertAccount[] = [
    // Assets
    { code: "1000", name: "Cash", type: "asset", subtype: "current_asset", normalBalance: "debit", description: "Cash on hand and in bank", isSystem: true },
    { code: "1100", name: "Accounts Receivable", type: "asset", subtype: "current_asset", normalBalance: "debit", description: "Money owed by customers", isSystem: true },
    { code: "1200", name: "Inventory", type: "asset", subtype: "current_asset", normalBalance: "debit", description: "Products available for sale", isSystem: true },
    { code: "1500", name: "Equipment", type: "asset", subtype: "fixed_asset", normalBalance: "debit", description: "Store equipment and fixtures", isSystem: true },
    
    // Liabilities
    { code: "2000", name: "Accounts Payable", type: "liability", subtype: "current_liability", normalBalance: "credit", description: "Money owed to suppliers", isSystem: true },
    { code: "2100", name: "Sales Tax Payable", type: "liability", subtype: "current_liability", normalBalance: "credit", description: "VAT/Tax collected from sales", isSystem: true },
    
    // Equity
    { code: "3000", name: "Owner's Capital", type: "equity", subtype: null, normalBalance: "credit", description: "Owner's investment in business", isSystem: true },
    { code: "3100", name: "Retained Earnings", type: "equity", subtype: null, normalBalance: "credit", description: "Accumulated profits", isSystem: true },
    
    // Revenue
    { code: "4000", name: "Sales Revenue", type: "revenue", subtype: null, normalBalance: "credit", description: "Revenue from product sales", isSystem: true },
    
    // Expenses
    { code: "5000", name: "Cost of Goods Sold", type: "expense", subtype: "cogs", normalBalance: "debit", description: "Direct cost of products sold", isSystem: true },
    { code: "6000", name: "Rent Expense", type: "expense", subtype: "operating_expense", normalBalance: "debit", description: "Store rent", isSystem: false },
    { code: "6100", name: "Utilities Expense", type: "expense", subtype: "operating_expense", normalBalance: "debit", description: "Electricity, water, internet", isSystem: false },
    { code: "6200", name: "Salaries Expense", type: "expense", subtype: "operating_expense", normalBalance: "debit", description: "Employee salaries", isSystem: false },
    { code: "6300", name: "Supplies Expense", type: "expense", subtype: "operating_expense", normalBalance: "debit", description: "Office and store supplies", isSystem: false },
  ];

  const insertedAccounts = await db.insert(accounts).values(mockAccounts).returning();
  console.log(`✓ Seeded ${insertedAccounts.length} accounts`);

  // Helper to get account by code
  const getAccountByCode = (code: string) => insertedAccounts.find(a => a.code === code)!;

  // Seed Sales (30 sales over the past 30 days)
  const mockSalesData: Array<{
    sale: InsertSale;
    items: Array<{ productId: number; quantity: number }>;
  }> = [];

  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const saleDate = new Date(today);
    saleDate.setDate(today.getDate() - i);
    
    // Random number of sales per day (1-5)
    const salesPerDay = Math.floor(Math.random() * 5) + 1;
    
    for (let j = 0; j < salesPerDay; j++) {
      const numItems = Math.floor(Math.random() * 5) + 1;
      const items: Array<{ productId: number; quantity: number }> = [];
      let subtotal = 0;
      
      // Select random products
      for (let k = 0; k < numItems; k++) {
        const randomProduct = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        items.push({ productId: randomProduct.id, quantity });
        subtotal += parseFloat(randomProduct.price) * quantity;
      }
      
      const tax = subtotal * 0.16; // 16% VAT
      const total = subtotal + tax;
      const paymentMethods = ['cash', 'mpesa', 'credit'];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      mockSalesData.push({
        sale: {
          userId: insertedUsers[Math.floor(Math.random() * 3)].id, // Random cashier
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          total: total.toFixed(2),
          paymentMethod,
          mpesaRef: paymentMethod === 'mpesa' ? `MPE${Date.now()}${Math.random().toString(36).substr(2, 9)}` : null,
          status: 'completed',
        },
        items,
      });
    }
  }

  // Insert sales and related data
  let saleCount = 0;
  let journalEntryNumber = 1;

  for (const saleData of mockSalesData) {
    const [insertedSale] = await db.insert(sales).values(saleData.sale).returning();
    saleCount++;

    // Insert sale items
    for (const item of saleData.items) {
      const product = insertedProducts.find(p => p.id === item.productId)!;
      const unitPrice = parseFloat(product.price);
      const total = unitPrice * item.quantity;

      await db.insert(saleItems).values({
        saleId: insertedSale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: unitPrice.toFixed(2),
        total: total.toFixed(2),
      });

      // Update product stock
      await db.update(products)
        .set({ stock: product.stock - item.quantity })
        .where(eq(products.id, product.id));
    }

    // Create journal entry for the sale
    const [journalEntry] = await db.insert(journalEntries).values({
      entryNumber: `JE-${String(journalEntryNumber++).padStart(6, '0')}`,
      entryDate: insertedSale.createdAt,
      description: `Sale #${insertedSale.id} - ${saleData.sale.paymentMethod}`,
      referenceType: 'sale',
      referenceId: insertedSale.id,
      userId: insertedSale.userId,
      status: 'posted',
    }).returning();

    // Ledger entries for the sale
    const subtotal = parseFloat(insertedSale.subtotal);
    const tax = parseFloat(insertedSale.tax);
    const total = parseFloat(insertedSale.total);
    const cogs = subtotal * 0.7; // Approximate COGS at 70% of sales

    await db.insert(ledgerEntries).values([
      // Debit Cash/AR
      {
        journalEntryId: journalEntry.id,
        accountId: getAccountByCode('1000').id,
        debit: total.toFixed(2),
        credit: '0.00',
        description: 'Cash received from sale',
      },
      // Credit Sales Revenue
      {
        journalEntryId: journalEntry.id,
        accountId: getAccountByCode('4000').id,
        debit: '0.00',
        credit: subtotal.toFixed(2),
        description: 'Sales revenue',
      },
      // Credit Sales Tax Payable
      {
        journalEntryId: journalEntry.id,
        accountId: getAccountByCode('2100').id,
        debit: '0.00',
        credit: tax.toFixed(2),
        description: 'Sales tax collected',
      },
      // Debit COGS
      {
        journalEntryId: journalEntry.id,
        accountId: getAccountByCode('5000').id,
        debit: cogs.toFixed(2),
        credit: '0.00',
        description: 'Cost of goods sold',
      },
      // Credit Inventory
      {
        journalEntryId: journalEntry.id,
        accountId: getAccountByCode('1200').id,
        debit: '0.00',
        credit: cogs.toFixed(2),
        description: 'Inventory reduction',
      },
    ]);
  }

  console.log(`✓ Seeded ${saleCount} sales with items and journal entries`);

  // Seed Stock Adjustments
  const adjustmentTypes = ['restock', 'spoilage', 'theft', 'correction'];
  const mockAdjustments: InsertStockAdjustment[] = [];

  for (let i = 0; i < 20; i++) {
    const randomProduct = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
    const type = adjustmentTypes[Math.floor(Math.random() * adjustmentTypes.length)];
    const quantity = type === 'restock' ? Math.floor(Math.random() * 50) + 10 : -(Math.floor(Math.random() * 5) + 1);

    mockAdjustments.push({
      productId: randomProduct.id,
      userId: insertedUsers[Math.floor(Math.random() * 2)].id,
      type,
      quantity,
      reason: `${type.charAt(0).toUpperCase() + type.slice(1)} adjustment for ${randomProduct.name}`,
    });
  }

  const insertedAdjustments = await db.insert(stockAdjustments).values(mockAdjustments).returning();
  console.log(`✓ Seeded ${insertedAdjustments.length} stock adjustments`);

  // Seed Settings
  await db.insert(settings).values([
    { key: 'store_name', value: 'Mini Mart Store' },
    { key: 'tax_rate', value: '16' },
    { key: 'currency', value: 'KES' },
    { key: 'receipt_footer', value: 'Thank you for shopping with us!' },
    { key: 'low_stock_alert', value: 'true' },
    { key: 'auto_print', value: 'true' },
    { key: 'session_timeout', value: '30' },
  ]);

  console.log("✓ Seeded settings");
  console.log("✅ Mock data seeding completed successfully!");
}

// Helper function to import eq from drizzle-orm
import { eq } from "drizzle-orm";
