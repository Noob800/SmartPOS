import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3,
  FileText,
  Download,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface FinancialReport {
  revenue?: { accounts: any[]; total: number };
  expenses?: { accounts: any[]; total: number };
  netIncome?: number;
  assets?: { accounts: any[]; total: number };
  liabilities?: { accounts: any[]; total: number };
  equity?: { accounts: any[]; total: number };
  operatingActivities?: { items: any[]; total: number };
  investingActivities?: { items: any[]; total: number };
  financingActivities?: { items: any[]; total: number };
  netCashFlow?: number;
  period?: { startDate: Date; endDate: Date };
  asOfDate?: Date;
}

const FinanceManagerSection = () => {
  const [dateRange, setDateRange] = useState("this-month");
  const [activeReport, setActiveReport] = useState("overview");

  const getDateRange = () => {
    const today = new Date();
    const start = new Date();
    const end = new Date();

    switch (dateRange) {
      case "today":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "this-week":
        const dayOfWeek = today.getDay();
        start.setDate(today.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "this-month":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(today.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "this-year":
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  };

  const { start, end } = getDateRange();

  const { data: profitLoss, isLoading: plLoading } = useQuery<FinancialReport>({
    queryKey: ["/api/accounting/reports/profit-loss", start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const response = await fetch(
        `/api/accounting/reports/profit-loss?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch P&L");
      return response.json();
    },
  });

  const { data: balanceSheet, isLoading: bsLoading } = useQuery<FinancialReport>({
    queryKey: ["/api/accounting/reports/balance-sheet", end.toISOString()],
    queryFn: async () => {
      const response = await fetch(
        `/api/accounting/reports/balance-sheet?asOfDate=${end.toISOString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch balance sheet");
      return response.json();
    },
  });

  const { data: cashFlow, isLoading: cfLoading } = useQuery<FinancialReport>({
    queryKey: ["/api/accounting/reports/cash-flow", start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const response = await fetch(
        `/api/accounting/reports/cash-flow?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch cash flow");
      return response.json();
    },
  });

  const formatCurrency = (amount: number) => {
    return `KSH ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
  };

  const downloadReport = (reportType: string) => {
    console.log(`Downloading ${reportType} report`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Finance Manager Dashboard</h2>
          <p className="text-muted-foreground">Real-time financial insights and reports</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plLoading ? "..." : formatCurrency(profitLoss?.revenue?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateRange.replace("-", " ")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plLoading ? "..." : formatCurrency(profitLoss?.expenses?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateRange.replace("-", " ")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(profitLoss?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {plLoading ? "..." : formatCurrency(profitLoss?.netIncome || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Profit margin: {profitLoss?.revenue?.total ? ((profitLoss.netIncome || 0) / profitLoss.revenue.total * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bsLoading ? "..." : formatCurrency(balanceSheet?.assets?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              As of {format(end, "MMM d, yyyy")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeReport} onValueChange={setActiveReport} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Gross Profit Margin</span>
                  <span className="text-sm font-bold">
                    {profitLoss?.revenue?.total ? ((profitLoss.netIncome || 0) / profitLoss.revenue.total * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Operating Ratio</span>
                  <span className="text-sm font-bold">
                    {profitLoss?.revenue?.total ? ((profitLoss.expenses?.total || 0) / profitLoss.revenue.total * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Ratio</span>
                  <span className="text-sm font-bold">
                    {balanceSheet?.liabilities?.total ? ((balanceSheet.assets?.total || 0) / balanceSheet.liabilities.total).toFixed(2) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Net Cash Flow</span>
                  <span className="text-sm font-bold">
                    {formatCurrency(cashFlow?.netCashFlow || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet Snapshot</CardTitle>
                <CardDescription>As of {format(end, "MMMM d, yyyy")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Assets</span>
                    <span className="text-sm font-bold">{formatCurrency(balanceSheet?.assets?.total || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Liabilities</span>
                    <span className="text-sm font-bold">{formatCurrency(balanceSheet?.liabilities?.total || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Equity</span>
                    <span className="text-sm font-bold">{formatCurrency(balanceSheet?.equity?.total || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Check (Assets - Liabilities - Equity)</span>
                    <span className="text-sm font-bold">
                      {formatCurrency((balanceSheet?.assets?.total || 0) - (balanceSheet?.liabilities?.total || 0) - (balanceSheet?.equity?.total || 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profit-loss" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Profit & Loss Statement</CardTitle>
                <CardDescription>
                  {format(start, "MMM d, yyyy")} - {format(end, "MMM d, yyyy")}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadReport("profit-loss")}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 text-green-600">Revenue</h3>
                {profitLoss?.revenue?.accounts.map((account: any) => (
                  <div key={account.id} className="flex justify-between items-center py-2">
                    <span className="text-sm">{account.name}</span>
                    <span className="text-sm font-medium">{formatCurrency(account.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 border-t font-semibold">
                  <span>Total Revenue</span>
                  <span>{formatCurrency(profitLoss?.revenue?.total || 0)}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-red-600">Expenses</h3>
                {profitLoss?.expenses?.accounts.map((account: any) => (
                  <div key={account.id} className="flex justify-between items-center py-2">
                    <span className="text-sm">{account.name}</span>
                    <span className="text-sm font-medium">{formatCurrency(account.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 border-t font-semibold">
                  <span>Total Expenses</span>
                  <span>{formatCurrency(profitLoss?.expenses?.total || 0)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-t-2 text-lg font-bold">
                <span>Net Income</span>
                <span className={(profitLoss?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(profitLoss?.netIncome || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Balance Sheet</CardTitle>
                <CardDescription>As of {format(end, "MMMM d, yyyy")}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadReport("balance-sheet")}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Assets</h3>
                {balanceSheet?.assets?.accounts.map((account: any) => (
                  <div key={account.id} className="flex justify-between items-center py-2">
                    <span className="text-sm">{account.name}</span>
                    <span className="text-sm font-medium">{formatCurrency(account.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 border-t font-semibold">
                  <span>Total Assets</span>
                  <span>{formatCurrency(balanceSheet?.assets?.total || 0)}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Liabilities</h3>
                {balanceSheet?.liabilities?.accounts.map((account: any) => (
                  <div key={account.id} className="flex justify-between items-center py-2">
                    <span className="text-sm">{account.name}</span>
                    <span className="text-sm font-medium">{formatCurrency(account.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 border-t font-semibold">
                  <span>Total Liabilities</span>
                  <span>{formatCurrency(balanceSheet?.liabilities?.total || 0)}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Equity</h3>
                {balanceSheet?.equity?.accounts.map((account: any) => (
                  <div key={account.id} className="flex justify-between items-center py-2">
                    <span className="text-sm">{account.name}</span>
                    <span className="text-sm font-medium">{formatCurrency(account.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 border-t font-semibold">
                  <span>Total Equity</span>
                  <span>{formatCurrency(balanceSheet?.equity?.total || 0)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-t-2 text-lg font-bold">
                <span>Total Liabilities & Equity</span>
                <span>{formatCurrency((balanceSheet?.liabilities?.total || 0) + (balanceSheet?.equity?.total || 0))}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cash Flow Statement</CardTitle>
                <CardDescription>
                  {format(start, "MMM d, yyyy")} - {format(end, "MMM d, yyyy")}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadReport("cash-flow")}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Operating Activities</h3>
                {cashFlow?.operatingActivities?.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <span className="text-sm">{item.description}</span>
                    <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 border-t font-semibold">
                  <span>Net Cash from Operating Activities</span>
                  <span>{formatCurrency(cashFlow?.operatingActivities?.total || 0)}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Investing Activities</h3>
                {cashFlow?.investingActivities?.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No investing activities</p>
                ) : (
                  cashFlow?.investingActivities?.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <span className="text-sm">{item.description}</span>
                      <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between items-center py-2 border-t font-semibold">
                  <span>Net Cash from Investing Activities</span>
                  <span>{formatCurrency(cashFlow?.investingActivities?.total || 0)}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Financing Activities</h3>
                {cashFlow?.financingActivities?.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No financing activities</p>
                ) : (
                  cashFlow?.financingActivities?.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <span className="text-sm">{item.description}</span>
                      <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between items-center py-2 border-t font-semibold">
                  <span>Net Cash from Financing Activities</span>
                  <span>{formatCurrency(cashFlow?.financingActivities?.total || 0)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-t-2 text-lg font-bold">
                <span>Net Change in Cash</span>
                <span className={(cashFlow?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(cashFlow?.netCashFlow || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceManagerSection;
