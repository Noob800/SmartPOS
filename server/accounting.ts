import { eq, and, sql, gte, lte, desc } from "drizzle-orm";
import { db } from "./db";
import {
  accounts,
  journalEntries,
  ledgerEntries,
  type Account,
  type JournalEntry,
  type LedgerEntry,
  type InsertAccount,
  type InsertJournalEntry,
  type InsertLedgerEntry,
} from "@shared/schema";

interface JournalEntryInput {
  description: string;
  entryDate?: Date;
  referenceType?: string;
  referenceId?: number;
  userId: number;
  notes?: string;
  entries: {
    accountId: number;
    debit: string;
    credit: string;
    description?: string;
  }[];
}

class AccountingService {
  async initializeChartOfAccounts() {
    const existingAccounts = await this.getAllAccounts();
    if (existingAccounts.length > 0) return;

    const defaultAccounts: InsertAccount[] = [
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
      { code: "4100", name: "Other Income", type: "revenue", subtype: null, normalBalance: "credit", description: "Miscellaneous income", isSystem: false },
      
      // Expenses
      { code: "5000", name: "Cost of Goods Sold", type: "expense", subtype: "cogs", normalBalance: "debit", description: "Direct cost of products sold", isSystem: true },
      { code: "6000", name: "Rent Expense", type: "expense", subtype: "operating_expense", normalBalance: "debit", description: "Store rent", isSystem: false },
      { code: "6100", name: "Utilities Expense", type: "expense", subtype: "operating_expense", normalBalance: "debit", description: "Electricity, water, internet", isSystem: false },
      { code: "6200", name: "Salaries Expense", type: "expense", subtype: "operating_expense", normalBalance: "debit", description: "Employee wages", isSystem: false },
      { code: "6300", name: "Marketing Expense", type: "expense", subtype: "operating_expense", normalBalance: "debit", description: "Advertising and promotions", isSystem: false },
      { code: "6400", name: "Supplies Expense", type: "expense", subtype: "operating_expense", normalBalance: "debit", description: "Office and store supplies", isSystem: false },
      { code: "6500", name: "Depreciation Expense", type: "expense", subtype: "operating_expense", normalBalance: "debit", description: "Asset depreciation", isSystem: false },
    ];

    for (const account of defaultAccounts) {
      await this.createAccount(account);
    }

    console.log("Chart of accounts initialized with", defaultAccounts.length, "accounts");
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const [account] = await db.insert(accounts).values(insertAccount).returning();
    return account;
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async getAccountByCode(code: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.code, code));
    return account || undefined;
  }

  async getAllAccounts(): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.isActive, true));
  }

  async getAccountsByType(type: string): Promise<Account[]> {
    return await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.type, type), eq(accounts.isActive, true)));
  }

  async updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined> {
    const [account] = await db
      .update(accounts)
      .set(updates)
      .where(eq(accounts.id, id))
      .returning();
    return account || undefined;
  }

  async createJournalEntry(input: JournalEntryInput): Promise<JournalEntry> {
    const totalDebits = input.entries.reduce((sum, entry) => sum + parseFloat(entry.debit), 0);
    const totalCredits = input.entries.reduce((sum, entry) => sum + parseFloat(entry.credit), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error(`Journal entry not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`);
    }

    const entryNumber = await this.generateEntryNumber();

    const [journalEntry] = await db
      .insert(journalEntries)
      .values({
        entryNumber,
        description: input.description,
        entryDate: input.entryDate || new Date(),
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        userId: input.userId,
        notes: input.notes,
        status: "posted",
      })
      .returning();

    for (const entry of input.entries) {
      await db.insert(ledgerEntries).values({
        journalEntryId: journalEntry.id,
        accountId: entry.accountId,
        debit: entry.debit,
        credit: entry.credit,
        description: entry.description || input.description,
      });
    }

    return journalEntry;
  }

  private async generateEntryNumber(): Promise<string> {
    const [lastEntry] = await db
      .select()
      .from(journalEntries)
      .orderBy(desc(journalEntries.id))
      .limit(1);

    if (!lastEntry) {
      return "JE-0001";
    }

    const lastNumber = parseInt(lastEntry.entryNumber.split("-")[1] || "0");
    return `JE-${String(lastNumber + 1).padStart(4, "0")}`;
  }

  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    return entry || undefined;
  }

  async getJournalEntries(startDate?: Date, endDate?: Date): Promise<JournalEntry[]> {
    let query = db.select().from(journalEntries).orderBy(desc(journalEntries.entryDate));

    if (startDate && endDate) {
      return await query;
    }
    return await query;
  }

  async getLedgerEntries(journalEntryId: number): Promise<LedgerEntry[]> {
    return await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.journalEntryId, journalEntryId));
  }

  async getAccountLedger(accountId: number, startDate?: Date, endDate?: Date): Promise<LedgerEntry[]> {
    return await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.accountId, accountId))
      .orderBy(desc(ledgerEntries.createdAt));
  }

  async getAccountBalance(accountId: number, asOfDate?: Date): Promise<{ balance: number; debitTotal: number; creditTotal: number }> {
    const result = await db
      .select({
        totalDebits: sql<string>`COALESCE(SUM(${ledgerEntries.debit}), 0)`,
        totalCredits: sql<string>`COALESCE(SUM(${ledgerEntries.credit}), 0)`,
      })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.accountId, accountId));

    const totalDebits = parseFloat(result[0].totalDebits);
    const totalCredits = parseFloat(result[0].totalCredits);

    const account = await this.getAccount(accountId);
    let balance = 0;

    if (account?.normalBalance === "debit") {
      balance = totalDebits - totalCredits;
    } else {
      balance = totalCredits - totalDebits;
    }

    return {
      balance,
      debitTotal: totalDebits,
      creditTotal: totalCredits,
    };
  }

  async recordSale(saleData: {
    saleId: number;
    userId: number;
    total: string;
    costOfGoodsSold: string;
    paymentMethod: string;
  }): Promise<JournalEntry> {
    const cashAccount = await this.getAccountByCode("1000");
    const salesRevenueAccount = await this.getAccountByCode("4000");
    const cogsAccount = await this.getAccountByCode("5000");
    const inventoryAccount = await this.getAccountByCode("1200");

    if (!cashAccount || !salesRevenueAccount || !cogsAccount || !inventoryAccount) {
      throw new Error("Required accounts not found in chart of accounts");
    }

    return await this.createJournalEntry({
      description: `Sale #${saleData.saleId} - ${saleData.paymentMethod}`,
      referenceType: "sale",
      referenceId: saleData.saleId,
      userId: saleData.userId,
      entries: [
        {
          accountId: cashAccount.id,
          debit: saleData.total,
          credit: "0.00",
          description: "Cash received from sale",
        },
        {
          accountId: salesRevenueAccount.id,
          debit: "0.00",
          credit: saleData.total,
          description: "Revenue from sale",
        },
        {
          accountId: cogsAccount.id,
          debit: saleData.costOfGoodsSold,
          credit: "0.00",
          description: "Cost of goods sold",
        },
        {
          accountId: inventoryAccount.id,
          debit: "0.00",
          credit: saleData.costOfGoodsSold,
          description: "Inventory reduction",
        },
      ],
    });
  }

  async generateProfitAndLoss(startDate: Date, endDate: Date): Promise<{
    revenue: { accounts: any[]; total: number };
    expenses: { accounts: any[]; total: number };
    netIncome: number;
  }> {
    const revenueAccounts = await this.getAccountsByType("revenue");
    const expenseAccounts = await this.getAccountsByType("expense");

    const revenueData = [];
    let totalRevenue = 0;

    for (const account of revenueAccounts) {
      const balance = await this.getAccountBalance(account.id);
      revenueData.push({
        ...account,
        balance: balance.balance,
      });
      totalRevenue += balance.balance;
    }

    const expenseData = [];
    let totalExpenses = 0;

    for (const account of expenseAccounts) {
      const balance = await this.getAccountBalance(account.id);
      expenseData.push({
        ...account,
        balance: balance.balance,
      });
      totalExpenses += balance.balance;
    }

    return {
      revenue: { accounts: revenueData, total: totalRevenue },
      expenses: { accounts: expenseData, total: totalExpenses },
      netIncome: totalRevenue - totalExpenses,
    };
  }

  async generateBalanceSheet(asOfDate: Date): Promise<{
    assets: { accounts: any[]; total: number };
    liabilities: { accounts: any[]; total: number };
    equity: { accounts: any[]; total: number };
  }> {
    const assetAccounts = await this.getAccountsByType("asset");
    const liabilityAccounts = await this.getAccountsByType("liability");
    const equityAccounts = await this.getAccountsByType("equity");

    const assetData = [];
    let totalAssets = 0;

    for (const account of assetAccounts) {
      const balance = await this.getAccountBalance(account.id, asOfDate);
      assetData.push({
        ...account,
        balance: balance.balance,
      });
      totalAssets += balance.balance;
    }

    const liabilityData = [];
    let totalLiabilities = 0;

    for (const account of liabilityAccounts) {
      const balance = await this.getAccountBalance(account.id, asOfDate);
      liabilityData.push({
        ...account,
        balance: balance.balance,
      });
      totalLiabilities += balance.balance;
    }

    const equityData = [];
    let totalEquity = 0;

    for (const account of equityAccounts) {
      const balance = await this.getAccountBalance(account.id, asOfDate);
      equityData.push({
        ...account,
        balance: balance.balance,
      });
      totalEquity += balance.balance;
    }

    return {
      assets: { accounts: assetData, total: totalAssets },
      liabilities: { accounts: liabilityData, total: totalLiabilities },
      equity: { accounts: equityData, total: totalEquity },
    };
  }

  async generateCashFlowStatement(startDate: Date, endDate: Date): Promise<{
    operatingActivities: { items: any[]; total: number };
    investingActivities: { items: any[]; total: number };
    financingActivities: { items: any[]; total: number };
    netCashFlow: number;
  }> {
    const pl = await this.generateProfitAndLoss(startDate, endDate);

    const operatingItems = [
      { description: "Net Income", amount: pl.netIncome },
    ];

    return {
      operatingActivities: {
        items: operatingItems,
        total: pl.netIncome,
      },
      investingActivities: {
        items: [],
        total: 0,
      },
      financingActivities: {
        items: [],
        total: 0,
      },
      netCashFlow: pl.netIncome,
    };
  }

  async voidJournalEntry(id: number): Promise<JournalEntry | undefined> {
    const [entry] = await db
      .update(journalEntries)
      .set({ status: "void" })
      .where(eq(journalEntries.id, id))
      .returning();
    return entry || undefined;
  }
}

export const accountingService = new AccountingService();
