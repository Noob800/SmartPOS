import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pin: text("pin").notNull(),
  role: text("role").notNull(), // 'admin' | 'cashier'
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(5),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // 'cash' | 'mpesa' | 'credit'
  mpesaRef: text("mpesa_ref"),
  status: text("status").notNull().default("completed"), // 'completed' | 'void' | 'held'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const stockAdjustments = pgTable("stock_adjustments", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'restock' | 'spoilage' | 'theft' | 'correction'
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  subtype: text("subtype"), // 'current_asset' | 'fixed_asset' | 'current_liability' | 'long_term_liability' | 'operating_expense' | 'cogs'
  normalBalance: text("normal_balance").notNull(), // 'debit' | 'credit'
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  isSystem: boolean("is_system").notNull().default(false),
  parentAccountId: integer("parent_account_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  entryNumber: text("entry_number").notNull().unique(),
  entryDate: timestamp("entry_date").notNull().defaultNow(),
  description: text("description").notNull(),
  referenceType: text("reference_type"), // 'sale' | 'purchase' | 'payment' | 'adjustment' | 'opening_balance' | 'manual'
  referenceId: integer("reference_id"),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("posted"), // 'draft' | 'posted' | 'void'
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ledgerEntries = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id").notNull(),
  accountId: integer("account_id").notNull(),
  debit: decimal("debit", { precision: 15, scale: 2 }).notNull().default("0.00"),
  credit: decimal("credit", { precision: 15, scale: 2 }).notNull().default("0.00"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
});

export const insertStockAdjustmentSchema = createInsertSchema(stockAdjustments).omit({
  id: true,
  createdAt: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLedgerEntrySchema = createInsertSchema(ledgerEntries).omit({
  id: true,
  createdAt: true,
});

export const createJournalEntrySchema = z.object({
  description: z.string().min(1, "Description is required"),
  entryDate: z.string().datetime().optional(),
  referenceType: z.string().optional(),
  referenceId: z.number().optional(),
  userId: z.number(),
  notes: z.string().optional(),
  entries: z.array(z.object({
    accountId: z.number(),
    debit: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid debit amount"),
    credit: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid credit amount"),
    description: z.string().optional(),
  })).min(2, "At least 2 entries required"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;

export type StockAdjustment = typeof stockAdjustments.$inferSelect;
export type InsertStockAdjustment = z.infer<typeof insertStockAdjustmentSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;

// Cart item type for frontend
export type CartItem = {
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
};
