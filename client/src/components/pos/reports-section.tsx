import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Search, TrendingUp, DollarSign, ShoppingCart, Package, Star } from "lucide-react";
import { Sale, Product } from "@shared/schema";

const ReportsSection = () => {
  const [dateRange, setDateRange] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Get sales data
  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales", startDate, endDate],
    queryFn: async () => {
      let url = "/api/sales";
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch sales');
      return response.json();
    },
  });

  // Get products for top selling analysis
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Calculate date range based on selection
  const getDateRange = () => {
    const today = new Date();
    const start = new Date();
    const end = new Date();

    switch (dateRange) {
      case "today":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        start.setDate(today.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(today.getDate() - 1);
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
      default:
        if (startDate && endDate) {
          return {
            start: new Date(startDate),
            end: new Date(endDate)
          };
        }
        break;
    }

    return { start, end };
  };

  // Filter sales by date range
  const { start: rangeStart, end: rangeEnd } = getDateRange();
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt);
    return saleDate >= rangeStart && saleDate <= rangeEnd;
  });

  // Calculate metrics
  const totalSales = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
  const totalTransactions = filteredSales.length;
  const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // Calculate profit margin (simplified - would need cost data from sale items)
  const totalSubtotal = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.subtotal), 0);
  const profitMargin = totalSubtotal > 0 ? ((totalSales - totalSubtotal) / totalSales) * 100 : 0;

  const generateReport = () => {
    // This would generate a more detailed report
    console.log("Generating report for", { rangeStart, rangeEnd });
  };

  const { data: settings = [] } = useQuery({
    queryKey: ["/api/settings"],
  });

  const exportReport = async (format: string) => {
    if (format === 'csv') {
      const csvContent = [
        ["Date", "Total", "Payment Method", "Status"],
        ...filteredSales.map(sale => [
          new Date(sale.createdAt).toLocaleDateString(),
          sale.total,
          sale.paymentMethod,
          sale.status
        ])
      ].map(row => row.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-report-${rangeStart.toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      const { PDFGenerator } = await import('@/lib/pdf-generator');
      const pdfGen = new PDFGenerator();
      
      const settingsMap = settings.reduce((acc: Record<string, string>, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      const reportData = {
        title: `Sales Report - ${dateRange === 'today' ? 'Today' : 
                              dateRange === 'yesterday' ? 'Yesterday' :
                              dateRange === 'this-week' ? 'This Week' :
                              dateRange === 'this-month' ? 'This Month' : 'Custom Period'}`,
        dateRange: { start: rangeStart, end: rangeEnd },
        storeName: settingsMap.store_name || 'MiniMart Express',
        storeAddress: settingsMap.store_address || '123 Main Street, Nairobi',
        storePhone: settingsMap.store_phone || '+254 700 123456',
        sales: filteredSales,
        products: [],
        totalSales,
        totalTransactions,
        averageTransaction,
        taxAmount: filteredSales.reduce((sum, sale) => sum + parseFloat(sale.tax), 0)
      };

      const pdf = pdfGen.generateSalesReport(reportData);
      pdf.save(`sales-report-${rangeStart.toISOString().split('T')[0]}.pdf`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Sales Reports</h2>
      </div>

      {/* Report Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={dateRange !== "custom"}
            />
            
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={dateRange !== "custom"}
            />
            
            <Button onClick={generateReport}>
              <Search className="w-4 h-4 mr-2" />
              Generate Report
            </Button>

            <Button variant="outline" onClick={() => exportReport('csv')}>
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  KSH {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
                <p className="text-2xl font-bold text-gray-900">
                  KSH {averageTransaction.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-gray-900">{profitMargin.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Sales chart visualization</p>
                <p className="text-sm">Would display daily/hourly sales trends</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['cash', 'mpesa', 'credit'].map(method => {
                const methodSales = filteredSales.filter(sale => sale.paymentMethod === method);
                const methodTotal = methodSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
                const percentage = totalSales > 0 ? (methodTotal / totalSales) * 100 : 0;
                
                return (
                  <div key={method} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${
                        method === 'cash' ? 'bg-green-500' :
                        method === 'mpesa' ? 'bg-blue-500' : 'bg-orange-500'
                      }`}></div>
                      <span className="capitalize font-medium">{method}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">KSH {methodTotal.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No transactions found for selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Date & Time
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Payment
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSales.slice(0, 10).map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(sale.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        KSH {parseFloat(sale.total).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">
                        {sale.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                          sale.status === 'void' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsSection;
