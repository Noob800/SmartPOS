import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { 
  users, products, sales, saleItems, stockAdjustments, settings,
  type User, type Product, type Sale, type SaleItem, type StockAdjustment, type Setting,
  type InsertUser, type InsertProduct, type InsertSale, type InsertSaleItem, 
  type InsertStockAdjustment, type InsertSetting
} from "@shared/schema";
import { sql } from "drizzle-orm";

class Storage {
  async initializeData() {
    // Check if we already have data
    const existingUsers = await this.getAllUsers();
    if (existingUsers.length > 0) return;

    // Create default admin user
    await this.createUser({
      name: "Admin",
      pin: "1234",
      role: "admin",
      isActive: true
    });

    // Create default cashier user
    await this.createUser({
      name: "Cashier",
      pin: "0000",
      role: "cashier",
      isActive: true
    });

    // Create sample products
    await this.createProduct({
      name: "Coca Cola 500ml",
      sku: "CC500",
      barcode: "1234567890123",
      category: "Beverages",
      price: "50.00",
      costPrice: "35.00",
      stock: 24,
      minStock: 5,
      isActive: true
    });

    await this.createProduct({
      name: "Bread Loaf",
      sku: "BL001",
      barcode: "2345678901234",
      category: "Bakery",
      price: "45.00",
      costPrice: "30.00",
      stock: 3,
      minStock: 5,
      isActive: true
    });

    await this.createProduct({
      name: "Milk 1L",
      sku: "MLK1L",
      barcode: "3456789012345",
      category: "Dairy",
      price: "75.00",
      costPrice: "55.00",
      stock: 12,
      minStock: 3,
      isActive: true
    });

    // Set default settings
    await this.setSetting("store_name", "MiniMart Express");
    await this.setSetting("store_address", "123 Main Street, Nairobi, Kenya");
    await this.setSetting("store_phone", "+254 700 123456");
    await this.setSetting("currency", "KSH");
    await this.setSetting("tax_rate", "16");
    await this.setSetting("receipt_header", "Thank you for shopping with us!\nVisit again soon.");
    await this.setSetting("receipt_footer", "For support: +254 700 123456\nwww.minimartexpress.co.ke");
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByPin(pin: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(and(eq(users.pin, pin), eq(users.isActive, true)));
      return user || undefined;
    } catch (error) {
      console.error("Error getting user by PIN:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return user || undefined;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    try {
      const [product] = await db.select().from(products).where(eq(products.id, id));
      return product || undefined;
    } catch (error) {
      console.error("Error getting product:", error);
      return undefined;
    }
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    try {
      const [product] = await db.select().from(products).where(and(eq(products.barcode, barcode), eq(products.isActive, true)));
      return product || undefined;
    } catch (error) {
      console.error("Error getting product by barcode:", error);
      return undefined;
    }
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    try {
      const [product] = await db.select().from(products).where(and(eq(products.sku, sku), eq(products.isActive, true)));
      return product || undefined;
    } catch (error) {
      console.error("Error getting product by SKU:", error);
      return undefined;
    }
  }

  async getAllProducts(): Promise<Product[]> {
    try {
      return await db.select().from(products).where(eq(products.isActive, true));
    } catch (error) {
      console.error("Error getting all products:", error);
      return [];
    }
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    try {
      const [product] = await db.insert(products).values(insertProduct).returning();
      return product;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    try {
      const [product] = await db
        .update(products)
        .set(updates)
        .where(eq(products.id, id))
        .returning();
      return product || undefined;
    } catch (error) {
      console.error("Error updating product:", error);
      return undefined;
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      const [product] = await db
        .update(products)
        .set({ isActive: false })
        .where(eq(products.id, id))
        .returning();
      return !!product;
    } catch (error) {
      console.error("Error deleting product:", error);
      return false;
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    const searchTerm = query.toLowerCase();
    return await db.select()
      .from(products)
      .where(
        sql`LOWER(${products.name}) LIKE ${`%${searchTerm}%`} 
        OR LOWER(${products.sku}) LIKE ${`%${searchTerm}%`}
        OR LOWER(${products.barcode}) LIKE ${`%${searchTerm}%`}
        OR LOWER(${products.category}) LIKE ${`%${searchTerm}%`}`
      )
      .limit(20);
  }

  // Sales methods
  async createSale(insertSale: InsertSale): Promise<Sale> {
    try {
      const [sale] = await db.insert(sales).values(insertSale).returning();
      return sale;
    } catch (error) {
      console.error("Error creating sale:", error);
      throw error;
    }
  }

  async getSale(id: number): Promise<Sale | undefined> {
    try {
      const [sale] = await db.select().from(sales).where(eq(sales.id, id));
      return sale || undefined;
    } catch (error) {
      console.error("Error getting sale:", error);
      return undefined;
    }
  }

  async getAllSales(): Promise<Sale[]> {
    try {
      return await db.select().from(sales);
    } catch (error) {
      console.error("Error getting all sales:", error);
      return [];
    }
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    try {
      const allSales = await db.select().from(sales);
      return allSales.filter(sale => 
        sale.createdAt >= startDate && sale.createdAt <= endDate
      );
    } catch (error) {
      console.error("Error getting sales by date range:", error);
      return [];
    }
  }

  async updateSaleStatus(id: number, status: string): Promise<Sale | undefined> {
    try {
      const [sale] = await db
        .update(sales)
        .set({ status })
        .where(eq(sales.id, id))
        .returning();
      return sale || undefined;
    } catch (error) {
      console.error("Error updating sale status:", error);
      return undefined;
    }
  }

  // Sale Items methods
  async createSaleItem(insertSaleItem: InsertSaleItem): Promise<SaleItem> {
    try {
      const [saleItem] = await db.insert(saleItems).values(insertSaleItem).returning();
      return saleItem;
    } catch (error) {
      console.error("Error creating sale item:", error);
      throw error;
    }
  }

  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    try {
      return await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
    } catch (error) {
      console.error("Error getting sale items:", error);
      return [];
    }
  }

  // Stock Adjustments methods
  async createStockAdjustment(insertAdjustment: InsertStockAdjustment): Promise<StockAdjustment> {
    try {
      const [adjustment] = await db.insert(stockAdjustments).values(insertAdjustment).returning();
      return adjustment;
    } catch (error) {
      console.error("Error creating stock adjustment:", error);
      throw error;
    }
  }

  async getStockAdjustments(productId?: number): Promise<StockAdjustment[]> {
    try {
      if (productId) {
        return await db.select().from(stockAdjustments).where(eq(stockAdjustments.productId, productId));
      }
      return await db.select().from(stockAdjustments);
    } catch (error) {
      console.error("Error getting stock adjustments:", error);
      return [];
    }
  }

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    try {
      const [setting] = await db.select().from(settings).where(eq(settings.key, key));
      return setting || undefined;
    } catch (error) {
      console.error("Error getting setting:", error);
      return undefined;
    }
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    try {
      // Try to update first
      const [existing] = await db
        .update(settings)
        .set({ value })
        .where(eq(settings.key, key))
        .returning();

      if (existing) {
        return existing;
      }

      // If not exists, create new
      const [setting] = await db.insert(settings).values({ key, value }).returning();
      return setting;
    } catch (error) {
      console.error("Error setting setting:", error);
      throw error;
    }
  }

  async getAllSettings(): Promise<Setting[]> {
    try {
      return await db.select().from(settings);
    } catch (error) {
      console.error("Error getting all settings:", error);
      return [];
    }
  }
}

export const storage = new Storage();