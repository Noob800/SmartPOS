import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePOSStore } from "@/hooks/use-pos-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Printer, Plus, Download } from "lucide-react";

const ReceiptModal = () => {
  const {
    showReceiptModal,
    setShowReceiptModal,
    lastSale,
    currentUser,
    setCurrentSection
  } = usePOSStore();

  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  // Fetch sale items and settings
  const { data: fetchedSaleItems = [] } = useQuery({
    queryKey: ["/api/sales", lastSale?.id, "items"],
    queryFn: async () => {
      if (!lastSale?.id) return [];
      const response = await fetch(`/api/sales/${lastSale.id}/items`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!lastSale?.id && showReceiptModal,
  });

  const { data: fetchedSettings = [] } = useQuery({
    queryKey: ["/api/settings"],
    enabled: showReceiptModal,
  });

  useEffect(() => {
    if (fetchedSaleItems.length > 0) {
      setSaleItems(fetchedSaleItems);
    }
  }, [fetchedSaleItems]);

  useEffect(() => {
    if (fetchedSettings.length > 0) {
      const settingsMap = fetchedSettings.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
      setSettings(settingsMap);
    }
  }, [fetchedSettings]);

  const handlePrint = () => {
    window.print();
  };

  const handleNewSale = () => {
    setShowReceiptModal(false);
    setCurrentSection("sales");
  };

  const downloadReceipt = () => {
    const receiptContent = generateReceiptText();
    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${lastSale?.id || Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateReceiptText = () => {
    const storeName = settings.store_name || "MiniMart Express";
    const storeAddress = settings.store_address || "123 Main Street, Nairobi";
    const storePhone = settings.store_phone || "+254 700 123456";
    const receiptHeader = settings.receipt_header || "Thank you for shopping with us!";
    const receiptFooter = settings.receipt_footer || "Visit again soon.";

    const date = new Date(lastSale?.createdAt || Date.now()).toLocaleString();
    
    let receipt = `${storeName}\n`;
    receipt += `${storeAddress}\n`;
    receipt += `Tel: ${storePhone}\n`;
    receipt += `${"=".repeat(40)}\n`;
    receipt += `Receipt #: ${lastSale?.id || "N/A"}\n`;
    receipt += `Date: ${date}\n`;
    receipt += `Cashier: ${currentUser?.name || "System"}\n`;
    receipt += `${"=".repeat(40)}\n`;
    
    saleItems.forEach((item: any) => {
      const product = item.product || { name: "Unknown Product" };
      receipt += `${product.name}\n`;
      receipt += `  ${item.quantity} x ${parseFloat(item.unitPrice).toFixed(2)} = ${parseFloat(item.total).toFixed(2)}\n`;
    });
    
    receipt += `${"-".repeat(40)}\n`;
    receipt += `Subtotal: KSH ${parseFloat(lastSale?.subtotal || 0).toFixed(2)}\n`;
    receipt += `VAT (16%): KSH ${parseFloat(lastSale?.tax || 0).toFixed(2)}\n`;
    receipt += `${"=".repeat(40)}\n`;
    receipt += `TOTAL: KSH ${parseFloat(lastSale?.total || 0).toFixed(2)}\n`;
    receipt += `Payment: ${(lastSale?.paymentMethod || "").toUpperCase()}\n`;
    
    if (lastSale?.mpesaRef) {
      receipt += `M-Pesa Ref: ${lastSale.mpesaRef}\n`;
    }
    
    receipt += `${"=".repeat(40)}\n`;
    receipt += `${receiptHeader}\n`;
    receipt += `${receiptFooter}\n`;
    
    return receipt;
  };

  if (!showReceiptModal || !lastSale) return null;

  return (
    <>
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Transaction Complete</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Success Message */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-medium text-gray-800">Payment Successful!</p>
              <p className="text-sm text-gray-600">Receipt #: {lastSale.id}</p>
            </div>

            {/* Receipt Preview */}
            <Card className="receipt-print">
              <CardContent className="p-4 text-sm">
                <div className="text-center mb-4">
                  <h4 className="font-bold text-base">
                    {settings.store_name || "MINIMART EXPRESS"}
                  </h4>
                  <p className="text-xs">
                    {settings.store_address || "123 Main Street, Nairobi"}
                  </p>
                  <p className="text-xs">
                    Tel: {settings.store_phone || "+254 700 123456"}
                  </p>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-xs">
                    <span>Receipt #: {lastSale.id}</span>
                    <span>{new Date(lastSale.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs">Cashier: {currentUser?.name || "System"}</p>
                </div>

                <Separator className="my-3" />

                <div className="space-y-2">
                  {saleItems.map((item: any, index: number) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.product?.name || "Product"}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>{item.quantity} x KSH {parseFloat(item.unitPrice).toFixed(2)}</span>
                        <span>KSH {parseFloat(item.total).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-3" />

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>KSH {parseFloat(lastSale.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (16%):</span>
                    <span>KSH {parseFloat(lastSale.tax).toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-base">
                    <span>TOTAL:</span>
                    <span>KSH {parseFloat(lastSale.total).toFixed(2)}</span>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="text-center text-xs space-y-1">
                  <p>Payment Method: {lastSale.paymentMethod?.toUpperCase()}</p>
                  {lastSale.mpesaRef && (
                    <p>M-Pesa Ref: {lastSale.mpesaRef}</p>
                  )}
                  <p>Date: {new Date(lastSale.createdAt).toLocaleDateString()}</p>
                </div>

                <Separator className="my-3" />

                <div className="text-center text-xs">
                  <p>{settings.receipt_header || "Thank you for shopping with us!"}</p>
                  <p>{settings.receipt_footer || "Visit again soon."}</p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={downloadReceipt}>
                <Download className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleNewSale} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                New Sale
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-print,
          .receipt-print * {
            visibility: visible;
          }
          .receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
          }
        }
      `}</style>
    </>
  );
};

export default ReceiptModal;
