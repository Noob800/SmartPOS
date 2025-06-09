import { 
  users, products, sales, saleItems, stockAdjustments, settings,
  type User, type InsertUser, type Product, type InsertProduct,
  type Sale, type InsertSale, type SaleItem, type InsertSaleItem,
  type StockAdjustment, type InsertStockAdjustment,
  type Setting, type InsertSetting
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByPin(pin: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Products
  getProduct(id: number): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  searchProducts(query: string): Promise<Product[]>;

  // Sales
  createSale(sale: InsertSale): Promise<Sale>;
  getSale(id: number): Promise<Sale | undefined>;
  getAllSales(): Promise<Sale[]>;
  getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]>;
  updateSaleStatus(id: number, status: string): Promise<Sale | undefined>;

  // Sale Items
  createSaleItem(saleItem: InsertSaleItem): Promise<SaleItem>;
  getSaleItems(saleId: number): Promise<SaleItem[]>;

  // Stock Adjustments
  createStockAdjustment(adjustment: InsertStockAdjustment): Promise<StockAdjustment>;
  getStockAdjustments(productId?: number): Promise<StockAdjustment[]>;

  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string): Promise<Setting>;
  getAllSettings(): Promise<Setting[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPin(pin: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.pin, pin));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode));
    return product || undefined;
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product || undefined;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async searchProducts(query: string): Promise<Product[]> {
    // For PostgreSQL, we'll need to use ilike for case-insensitive search
    const allProducts = await db.select().from(products).where(eq(products.isActive, true));
    const lowerQuery = query.toLowerCase();
    return allProducts.filter(product => 
      product.name.toLowerCase().includes(lowerQuery) ||
      product.sku.toLowerCase().includes(lowerQuery) ||
      product.barcode?.includes(query)
    );
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const [sale] = await db
      .insert(sales)
      .values(insertSale)
      .returning();
    return sale;
  }

  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale || undefined;
  }

  async getAllSales(): Promise<Sale[]> {
    return await db.select().from(sales);
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    // For now, we'll get all sales and filter in memory
    // In production, this should use proper date range queries
    const allSales = await db.select().from(sales);
    return allSales.filter(sale => 
      sale.createdAt >= startDate && sale.createdAt <= endDate
    );
  }

  async updateSaleStatus(id: number, status: string): Promise<Sale | undefined> {
    const [sale] = await db
      .update(sales)
      .set({ status })
      .where(eq(sales.id, id))
      .returning();
    return sale || undefined;
  }

  async createSaleItem(insertSaleItem: InsertSaleItem): Promise<SaleItem> {
    const [saleItem] = await db
      .insert(saleItems)
      .values(insertSaleItem)
      .returning();
    return saleItem;
  }

  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    return await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
  }

  async createStockAdjustment(insertAdjustment: InsertStockAdjustment): Promise<StockAdjustment> {
    const [adjustment] = await db
      .insert(stockAdjustments)
      .values(insertAdjustment)
      .returning();
    return adjustment;
  }

  async getStockAdjustments(productId?: number): Promise<StockAdjustment[]> {
    if (productId) {
      return await db.select().from(stockAdjustments).where(eq(stockAdjustments.productId, productId));
    }
    return await db.select().from(stockAdjustments);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [setting] = await db
        .update(settings)
        .set({ value })
        .where(eq(settings.key, key))
        .returning();
      return setting;
    } else {
      const [setting] = await db
        .insert(settings)
        .values({ key, value })
        .returning();
      return setting;
    }
  }

  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private sales: Map<number, Sale>;
  private saleItems: Map<number, SaleItem>;
  private stockAdjustments: Map<number, StockAdjustment>;
  private settings: Map<string, Setting>;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.sales = new Map();
    this.saleItems = new Map();
    this.stockAdjustments = new Map();
    this.settings = new Map();
    this.currentId = {
      users: 1,
      products: 1,
      sales: 1,
      saleItems: 1,
      stockAdjustments: 1,
      settings: 1
    };
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create default admin and cashier users
    this.createUser({
      name: "Admin User",
      pin: "1234",
      role: "admin",
      isActive: true
    });

    this.createUser({
      name: "Cashier User", 
      pin: "0000",
      role: "cashier",
      isActive: true
    });

    // Create sample products
    this.createProduct({
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

    this.createProduct({
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

    this.createProduct({
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
    this.setSetting("store_name", "MiniMart Express");
    this.setSetting("store_address", "123 Main Street, Nairobi, Kenya");
    this.setSetting("store_phone", "+254 700 123456");
    this.setSetting("currency", "KSH");
    this.setSetting("tax_rate", "16");
    this.setSetting("receipt_header", "Thank you for shopping with us!\nVisit again soon.");
    this.setSetting("receipt_footer", "For support: +254 700 123456\nwww.minimartexpress.co.ke");
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPin(pin: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.pin === pin && user.isActive);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = {
      ...insertUser,
      id,
      lastLogin: null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(product => product.barcode === barcode && product.isActive);
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(product => product.sku === sku && product.isActive);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.isActive);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentId.products++;
    const product: Product = {
      ...insertProduct,
      id,
      createdAt: new Date()
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) return false;
    // Soft delete
    await this.updateProduct(id, { isActive: false });
    return true;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(product => 
      product.isActive && (
        product.name.toLowerCase().includes(lowerQuery) ||
        product.sku.toLowerCase().includes(lowerQuery) ||
        product.barcode?.includes(query)
      )
    );
  }

  // Sales methods
  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.currentId.sales++;
    const sale: Sale = {
      ...insertSale,
      id,
      createdAt: new Date()
    };
    this.sales.set(id, sale);
    return sale;
  }

  async getSale(id: number): Promise<Sale | undefined> {
    return this.sales.get(id);
  }

  async getAllSales(): Promise<Sale[]> {
    return Array.from(this.sales.values());
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return Array.from(this.sales.values()).filter(sale => 
      sale.createdAt >= startDate && sale.createdAt <= endDate
    );
  }

  async updateSaleStatus(id: number, status: string): Promise<Sale | undefined> {
    const sale = this.sales.get(id);
    if (!sale) return undefined;
    const updatedSale = { ...sale, status };
    this.sales.set(id, updatedSale);
    return updatedSale;
  }

  // Sale Items methods
  async createSaleItem(insertSaleItem: InsertSaleItem): Promise<SaleItem> {
    const id = this.currentId.saleItems++;
    const saleItem: SaleItem = {
      ...insertSaleItem,
      id
    };
    this.saleItems.set(id, saleItem);
    return saleItem;
  }

  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    return Array.from(this.saleItems.values()).filter(item => item.saleId === saleId);
  }

  // Stock Adjustments methods
  async createStockAdjustment(insertAdjustment: InsertStockAdjustment): Promise<StockAdjustment> {
    const id = this.currentId.stockAdjustments++;
    const adjustment: StockAdjustment = {
      ...insertAdjustment,
      id,
      createdAt: new Date()
    };
    this.stockAdjustments.set(id, adjustment);
    return adjustment;
  }

  async getStockAdjustments(productId?: number): Promise<StockAdjustment[]> {
    const adjustments = Array.from(this.stockAdjustments.values());
    return productId ? adjustments.filter(adj => adj.productId === productId) : adjustments;
  }

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    return this.settings.get(key);
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existing = this.settings.get(key);
    if (existing) {
      const updated = { ...existing, value };
      this.settings.set(key, updated);
      return updated;
    } else {
      const id = this.currentId.settings++;
      const setting: Setting = { id, key, value };
      this.settings.set(key, setting);
      return setting;
    }
  }

  async getAllSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }
}

// Initialize database and create sample data
async function initializeDatabase() {
  try {
    // Create sample data for database
    const storage = new DatabaseStorage();
    
    // Check if users exist, if not create sample data
    const existingUsers = await storage.getAllUsers();
    if (existingUsers.length === 0) {
      // Create default users
      await storage.createUser({
        name: "Admin User",
        pin: "1234",
        role: "admin",
        isActive: true
      });

      await storage.createUser({
        name: "Cashier User", 
        pin: "0000",
        role: "cashier",
        isActive: true
      });

      // Create sample products
      await storage.createProduct({
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

      await storage.createProduct({
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

      await storage.createProduct({
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
      await storage.setSetting("store_name", "MiniMart Express");
      await storage.setSetting("store_address", "123 Main Street, Nairobi, Kenya");
      await storage.setSetting("store_phone", "+254 700 123456");
      await storage.setSetting("currency", "KSH");
      await storage.setSetting("tax_rate", "16");
      await storage.setSetting("receipt_header", "Thank you for shopping with us!\nVisit again soon.");
      await storage.setSetting("receipt_footer", "For support: +254 700 123456\nwww.minimartexpress.co.ke");
    }
    
    return storage;
  } catch (error) {
    console.warn("Database connection failed, falling back to in-memory storage:", error);
    return new MemStorage();
  }
}

// Use dynamic import to handle async initialization
let storageInstance: IStorage;

async function getStorage(): Promise<IStorage> {
  if (!storageInstance) {
    storageInstance = await initializeDatabase();
  }
  return storageInstance;
}

export { getStorage as storage };
