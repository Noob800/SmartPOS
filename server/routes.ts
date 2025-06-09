import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertProductSchema, insertSaleSchema, 
  insertSaleItemSchema, insertStockAdjustmentSchema, insertSettingSchema 
} from "@shared/schema";

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

      // Create the sale
      const createdSale = await storage.createSale(saleData);

      // Create sale items and update stock
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

      res.json(createdSale);
    } catch (error) {
      res.status(400).json({ message: "Invalid sale data" });
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

  const httpServer = createServer(app);
  return httpServer;
}