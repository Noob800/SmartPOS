import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { accountingService } from "./accounting";
import { 
  insertUserSchema, insertProductSchema, insertSaleSchema, 
  insertSaleItemSchema, insertStockAdjustmentSchema, insertSettingSchema,
  insertAccountSchema, createJournalEntrySchema
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize storage with default data
  try {
    await storage.initializeData();
    console.log("Storage initialized successfully");
  } catch (error) {
    console.error("Failed to initialize storage:", error);
  }

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { pin } = req.body;
      const user = await storage.getUserByPin(pin);

      if (!user) {
        return res.status(401).json({ message: "Invalid PIN" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

      res.json({ user: { id: user.id, name: user.name, role: user.role } });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const user = await storage.updateUser(id, updates);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { search } = req.query;
      let products;

      if (search) {
        products = await storage.searchProducts(search as string);
      } else {
        products = await storage.getAllProducts();
      }

      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/products/barcode/:barcode", async (req, res) => {
    try {
      const { barcode } = req.params;
      const product = await storage.getProductByBarcode(barcode);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const product = await storage.updateProduct(id, updates);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);

      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sales routes
  app.post("/api/sales", async (req, res) => {
    try {
      const { sale, items } = req.body;
      const saleData = insertSaleSchema.parse(sale);

      // Validate that all products exist and have sufficient stock before proceeding
      let totalCostOfGoodsSold = 0;
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.productId} not found` });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
        }
        totalCostOfGoodsSold += parseFloat(product.costPrice) * item.quantity;
      }

      // Create the sale
      const createdSale = await storage.createSale(saleData);

      // Create sale items and update stock
      try {
        for (const item of items) {
          const saleItemData = insertSaleItemSchema.parse({
            ...item,
            saleId: createdSale.id
          });
          await storage.createSaleItem(saleItemData);

          // Update product stock
          const product = await storage.getProduct(item.productId);
          if (product) {
            await storage.updateProduct(product.id, {
              stock: product.stock - item.quantity
            });
          }
        }

        // Create accounting journal entry for the sale
        // NOTE: In production, this should be wrapped in a database transaction with the sale creation
        await accountingService.recordSale({
          saleId: createdSale.id,
          userId: createdSale.userId,
          total: createdSale.total,
          costOfGoodsSold: totalCostOfGoodsSold.toFixed(2),
          paymentMethod: createdSale.paymentMethod,
        });

        res.json(createdSale);
      } catch (error) {
        // If accounting or inventory update fails after sale creation, log the error
        console.error("CRITICAL: Sale created but post-processing failed:", {
          saleId: createdSale.id,
          error: error instanceof Error ? error.message : error
        });
        
        // Update sale status to indicate issue
        await storage.updateSaleStatus(createdSale.id, "held");
        
        return res.status(500).json({ 
          message: "Sale created but processing incomplete. Please contact support.",
          saleId: createdSale.id
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  app.get("/api/sales", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      let sales;

      if (startDate && endDate) {
        sales = await storage.getSalesByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        sales = await storage.getAllSales();
      }

      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/sales/:id/items", async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const items = await storage.getSaleItems(saleId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Stock adjustment routes
  app.post("/api/stock-adjustments", async (req, res) => {
    try {
      const adjustmentData = insertStockAdjustmentSchema.parse(req.body);
      const adjustment = await storage.createStockAdjustment(adjustmentData);

      // Update product stock
      const product = await storage.getProduct(adjustmentData.productId);
      if (product) {
        const newStock = product.stock + adjustmentData.quantity;
        await storage.updateProduct(product.id, { stock: Math.max(0, newStock) });
      }

      res.json(adjustment);
    } catch (error) {
      res.status(400).json({ message: "Invalid adjustment data" });
    }
  });

  app.get("/api/stock-adjustments", async (req, res) => {
    try {
      const { productId } = req.query;
      const adjustments = await storage.getStockAdjustments(
        productId ? parseInt(productId as string) : undefined
      );
      res.json(adjustments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const { key, value } = req.body;
      const setting = await storage.setSetting(key, value);
      res.json(setting);
    } catch (error) {
      res.status(400).json({ message: "Invalid setting data" });
    }
  });

  // Environment configuration check
  app.get("/api/config/mpesa", async (req, res) => {
    try {
      const isConfigured = !!(
        process.env.MPESA_CONSUMER_KEY &&
        process.env.MPESA_CONSUMER_SECRET &&
        process.env.MPESA_BUSINESS_SHORT_CODE &&
        process.env.MPESA_PASSKEY
      );

      res.json({
        configured: isConfigured,
        environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
        businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE || ''
      });
    } catch (error) {
      console.error("Failed to check M-Pesa configuration:", error);
      res.status(500).json({ error: "Failed to check configuration" });
    }
  });

  // Payment processing routes
  app.post("/api/payments/mpesa", async (req, res) => {
    try {
      const { phoneNumber, amount, accountReference = "POS-Sale", transactionDesc = "POS Payment" } = req.body;

      const { mpesaService } = await import("./mpesa");

      if (!mpesaService.isConfigured()) {
        // Fallback to simulation if M-Pesa not configured
        setTimeout(() => {
          const mpesaRef = `SIM${Date.now()}`;
          res.json({ 
            success: true, 
            mpesaRef,
            message: "Payment simulated (M-Pesa not configured)",
            checkoutRequestID: `sim_${Date.now()}`
          });
        }, 2000);
        return;
      }

      const response = await mpesaService.initiateSTKPush({
        phoneNumber,
        amount,
        accountReference,
        transactionDesc
      });

      if (response.ResponseCode === "0") {
        res.json({
          success: true,
          message: response.CustomerMessage,
          checkoutRequestID: response.CheckoutRequestID,
          merchantRequestID: response.MerchantRequestID
        });
      } else {
        res.status(400).json({
          success: false,
          message: response.ResponseDescription
        });
      }
    } catch (error: any) {
      console.error("M-Pesa payment error:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Payment processing failed" 
      });
    }
  });

  // M-Pesa payment status query
  app.post("/api/payments/mpesa/status", async (req, res) => {
    try {
      const { checkoutRequestID } = req.body;

      const { mpesaService } = await import("./mpesa");

      if (!mpesaService.isConfigured()) {
        res.json({
          success: true,
          status: "completed",
          message: "Simulated payment completed"
        });
        return;
      }

      const response = await mpesaService.querySTKStatus(checkoutRequestID);

      res.json({
        success: true,
        status: response.ResultCode === "0" ? "completed" : "failed",
        message: response.ResultDesc,
        merchantRequestID: response.MerchantRequestID,
        checkoutRequestID: response.CheckoutRequestID
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to query payment status"
      });
    }
  });

  // M-Pesa callback endpoint
  app.post("/api/payments/mpesa/callback", async (req, res) => {
    try {
      const { mpesaService } = await import("./mpesa");
      const callbackResult = mpesaService.processCallback(req.body);

      // Here you would update your database with the payment result
      console.log("M-Pesa callback received:", callbackResult);

      // Always respond with success to acknowledge receipt
      res.json({ ResultCode: 0, ResultDesc: "Success" });
    } catch (error) {
      console.error("M-Pesa callback error:", error);
      res.status(200).json({ ResultCode: 1, ResultDesc: "Failed" });
    }
  });

  // Reports routes
  app.get("/api/reports/sales-summary", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date();
      const end = endDate ? new Date(endDate as string) : new Date();

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const sales = await storage.getSalesByDateRange(start, end);

      const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
      const totalTransactions = sales.length;

      res.json({
        totalSales,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
        period: { startDate: start, endDate: end }
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Accounting routes
  app.get("/api/accounting/accounts", async (req, res) => {
    try {
      const { type } = req.query;
      let accounts;
      
      if (type) {
        accounts = await accountingService.getAccountsByType(type as string);
      } else {
        accounts = await accountingService.getAllAccounts();
      }
      
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/accounting/accounts", async (req, res) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      const account = await accountingService.createAccount(accountData);
      res.json(account);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid account data", errors: error.errors });
      }
      console.error("Error creating account:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.put("/api/accounting/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await accountingService.updateAccount(id, req.body);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/accounting/accounts/:id/balance", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const balance = await accountingService.getAccountBalance(id);
      res.json(balance);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/accounting/accounts/:id/ledger", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { startDate, endDate } = req.query;
      
      const ledger = await accountingService.getAccountLedger(
        id,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(ledger);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/accounting/journal-entries", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const entries = await accountingService.getJournalEntries(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/accounting/journal-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await accountingService.getJournalEntry(id);
      
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      const ledgerEntries = await accountingService.getLedgerEntries(id);
      
      res.json({
        ...entry,
        ledgerEntries
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/accounting/journal-entries", async (req, res) => {
    try {
      const entryData = createJournalEntrySchema.parse(req.body);
      
      const totalDebits = entryData.entries.reduce((sum, e) => sum + parseFloat(e.debit), 0);
      const totalCredits = entryData.entries.reduce((sum, e) => sum + parseFloat(e.credit), 0);
      
      if (Math.abs(totalDebits - totalCredits) >= 0.01) {
        return res.status(400).json({ 
          message: "Journal entry not balanced",
          details: { debits: totalDebits, credits: totalCredits }
        });
      }
      
      const entry = await accountingService.createJournalEntry({
        ...entryData,
        entryDate: entryData.entryDate ? new Date(entryData.entryDate) : undefined,
      });
      res.json(entry);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid journal entry data", errors: error.errors });
      }
      console.error("Error creating journal entry:", error);
      res.status(400).json({ message: error.message || "Failed to create journal entry" });
    }
  });

  app.delete("/api/accounting/journal-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await accountingService.voidJournalEntry(id);
      
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/accounting/reports/profit-loss", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
      const end = endDate ? new Date(endDate as string) : new Date();

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const report = await accountingService.generateProfitAndLoss(start, end);
      
      res.json({
        ...report,
        period: { startDate: start, endDate: end }
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/accounting/reports/balance-sheet", async (req, res) => {
    try {
      const { asOfDate } = req.query;
      const date = asOfDate ? new Date(asOfDate as string) : new Date();
      date.setHours(23, 59, 59, 999);

      const report = await accountingService.generateBalanceSheet(date);
      
      res.json({
        ...report,
        asOfDate: date
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/accounting/reports/cash-flow", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
      const end = endDate ? new Date(endDate as string) : new Date();

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const report = await accountingService.generateCashFlowStatement(start, end);
      
      res.json({
        ...report,
        period: { startDate: start, endDate: end }
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}