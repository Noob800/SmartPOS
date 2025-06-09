import { Product, Sale, SaleItem, User, Setting } from "@shared/schema";

const DB_NAME = "MiniMartPOS";
const DB_VERSION = 1;

interface POSDatabase extends IDBDatabase {
  // Type-safe database interface
}

class IndexedDBManager {
  private db: POSDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result as POSDatabase;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains("products")) {
          const productStore = db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
          productStore.createIndex("sku", "sku", { unique: true });
          productStore.createIndex("barcode", "barcode", { unique: false });
          productStore.createIndex("category", "category", { unique: false });
        }

        if (!db.objectStoreNames.contains("sales")) {
          const salesStore = db.createObjectStore("sales", { keyPath: "id", autoIncrement: true });
          salesStore.createIndex("userId", "userId", { unique: false });
          salesStore.createIndex("createdAt", "createdAt", { unique: false });
          salesStore.createIndex("status", "status", { unique: false });
        }

        if (!db.objectStoreNames.contains("saleItems")) {
          const saleItemsStore = db.createObjectStore("saleItems", { keyPath: "id", autoIncrement: true });
          saleItemsStore.createIndex("saleId", "saleId", { unique: false });
          saleItemsStore.createIndex("productId", "productId", { unique: false });
        }

        if (!db.objectStoreNames.contains("users")) {
          const usersStore = db.createObjectStore("users", { keyPath: "id", autoIncrement: true });
          usersStore.createIndex("pin", "pin", { unique: true });
        }

        if (!db.objectStoreNames.contains("settings")) {
          const settingsStore = db.createObjectStore("settings", { keyPath: "key" });
        }

        if (!db.objectStoreNames.contains("pendingSync")) {
          db.createObjectStore("pendingSync", { keyPath: "id", autoIncrement: true });
        }
      };
    });
  }

  private getObjectStore(storeName: string, mode: IDBTransactionMode = "readonly"): IDBObjectStore {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Products
  async saveProduct(product: Product): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("products", "readwrite");
      const request = store.put(product);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getProducts(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("products");
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("products");
      const index = store.index("barcode");
      const request = index.get(barcode);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProduct(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("products", "readwrite");
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sales
  async saveSale(sale: Sale): Promise<number> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("sales", "readwrite");
      const request = store.add(sale);
      
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getSales(): Promise<Sale[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("sales");
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("sales");
      const index = store.index("createdAt");
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Sale Items
  async saveSaleItem(saleItem: SaleItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("saleItems", "readwrite");
      const request = store.add(saleItem);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("saleItems");
      const index = store.index("saleId");
      const request = index.getAll(saleId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Users
  async saveUser(user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("users", "readwrite");
      const request = store.put(user);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUsers(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("users");
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUserByPin(pin: string): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("users");
      const index = store.index("pin");
      const request = index.get(pin);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Settings
  async saveSetting(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("settings", "readwrite");
      const request = store.put({ key, value });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key: string): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("settings");
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSettings(): Promise<Setting[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("settings");
      const request = store.getAll();
      
      request.onsuccess = () => {
        const settings = request.result.map((item: any) => ({
          id: 0, // IndexedDB doesn't use this field
          key: item.key,
          value: item.value
        }));
        resolve(settings);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Management
  async addPendingSync(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("pendingSync", "readwrite");
      const request = store.add({ ...data, timestamp: Date.now() });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSync(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("pendingSync");
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearPendingSync(): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("pendingSync", "readwrite");
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    const storeNames = ["products", "sales", "saleItems", "users", "settings", "pendingSync"];
    
    for (const storeName of storeNames) {
      await new Promise<void>((resolve, reject) => {
        const store = this.getObjectStore(storeName, "readwrite");
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}

// Export a singleton instance
export const indexedDBManager = new IndexedDBManager();

// Initialize the database when the module loads
indexedDBManager.init().catch(console.error);
