import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePOSStore } from "@/hooks/use-pos-store";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Smartphone, CreditCard, DollarSign, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PaymentModal = () => {
  const {
    showPaymentModal,
    setShowPaymentModal,
    setShowReceiptModal,
    cart,
    currentUser,
    clearCart,
    setLastSale,
    isOnline,
    addPendingSale
  } = usePOSStore();

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0.16; // 16% VAT
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const processSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      if (!isOnline) {
        // Store sale locally when offline
        addPendingSale(saleData);
        return { id: Date.now(), ...saleData };
      }

      const response = await apiRequest("POST", "/api/sales", saleData);
      return response.json();
    },
    onSuccess: (sale) => {
      setLastSale(sale);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });

      toast({
        title: "Payment Successful",
        description: `Transaction completed successfully${!isOnline ? " (Saved offline)" : ""}`,
      });
    },
    onError: () => {
      setPaymentStatus("error");
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const mpesaPaymentMutation = useMutation({
    mutationFn: async ({ phoneNumber, amount }: { phoneNumber: string; amount: number }) => {
      if (!isOnline) {
        // Simulate M-Pesa when offline
        return { success: true, mpesaRef: `OFFLINE${Date.now()}` };
      }

      const response = await apiRequest("POST", "/api/payments/mpesa", { phoneNumber, amount });
      return response.json();
    },
    onSuccess: (mpesaResult) => {
      if (mpesaResult.success) {
        const saleData = createSaleData("mpesa", mpesaResult.mpesaRef);
        processSaleMutation.mutate(saleData);
      } else {
        setPaymentStatus("error");
        toast({
          title: "M-Pesa Failed",
          description: "M-Pesa payment was declined or cancelled.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setPaymentStatus("error");
      toast({
        title: "M-Pesa Error",
        description: "Failed to process M-Pesa payment.",
        variant: "destructive",
      });
    },
  });

  const createSaleData = (paymentMethod: string, mpesaRef?: string) => ({
    sale: {
      userId: currentUser?.id || 1,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      paymentMethod,
      mpesaRef,
      status: "completed"
    },
    items: cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      total: item.total.toFixed(2)
    }))
  });

  const handlePayment = async (method: string) => {
    setSelectedMethod(method);
    setPaymentStatus("processing");
    setIsProcessing(true);

    try {
      if (method === "mpesa") {
        if (!phoneNumber) {
          toast({
            title: "Phone Number Required",
            description: "Please enter a valid phone number for M-Pesa payment.",
            variant: "destructive",
          });
          setPaymentStatus("idle");
          setIsProcessing(false);
          return;
        }

        // Simulate STK push delay
        setTimeout(() => {
          mpesaPaymentMutation.mutate({ phoneNumber, amount: total });
        }, 2000);

      } else if (method === "cash") {
        const cashAmountNum = parseFloat(cashAmount);
        if (cashAmountNum < total) {
          toast({
            title: "Insufficient Cash",
            description: "Cash amount is less than the total amount.",
            variant: "destructive",
          });
          setPaymentStatus("idle");
          setIsProcessing(false);
          return;
        }

        const saleData = createSaleData("cash");
        processSaleMutation.mutate(saleData);

      } else if (method === "credit") {
        const saleData = createSaleData("credit");
        processSaleMutation.mutate(saleData);
      }
    } catch (error) {
      setPaymentStatus("error");
      setIsProcessing(false);
      toast({
        title: "Payment Error",
        description: "An error occurred while processing payment.",
        variant: "destructive",
      });
    }
  };

  const resetModal = () => {
    setSelectedMethod(null);
    setPhoneNumber("");
    setCashAmount(total.toFixed(2));
    setPaymentStatus("idle");
    setIsProcessing(false);
  };

  useEffect(() => {
    if (showPaymentModal) {
      resetModal();
      setCashAmount(total.toFixed(2));
    }
  }, [showPaymentModal, total]);

  if (!showPaymentModal) return null;

  return (
    <Dialog open={showPaymentModal} onOpenChange={(open) => {
      if (!open && !isProcessing) {
        setShowPaymentModal(false);
        resetModal();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Process Payment
            {!isProcessing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPaymentModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Total */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-3xl font-bold text-primary">
                  KSH {total.toFixed(2)}
                </p>
                {!isOnline && (
                  <p className="text-xs text-orange-600 mt-2">
                    Offline Mode - Payment will be synced when online
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          {!selectedMethod && paymentStatus === "idle" && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800">Select Payment Method</h3>

              <Button
                className="w-full h-16 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center space-x-3"
                onClick={() => setSelectedMethod("cash")}
              >
                <DollarSign className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">Cash Payment</div>
                  <div className="text-sm opacity-90">Press F1</div>
                </div>
              </Button>

              <Button
                className="w-full h-16 flex items-center justify-center space-x-3"
                onClick={() => setSelectedMethod("mpesa")}
                disabled={!isOnline} // Disable M-Pesa when offline
              >
                <Smartphone className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">M-Pesa Payment</div>
                  <div className="text-sm opacity-90">Press F2</div>
                </div>
              </Button>

              <Button
                className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center space-x-3"
                onClick={() => setSelectedMethod("credit")}
              >
                <CreditCard className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">Credit Payment</div>
                  <div className="text-sm opacity-90">Press F3</div>
                </div>
              </Button>
            </div>
          )}

          {/* Cash Payment Form */}
          {selectedMethod === "cash" && paymentStatus !== "processing" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cash Amount Received
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="Enter cash amount"
                  className="text-right text-lg"
                />
                {parseFloat(cashAmount) > total && (
                  <p className="text-sm text-green-600 mt-2">
                    Change: KSH {(parseFloat(cashAmount) - total).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setSelectedMethod(null)}>
                  Back
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handlePayment("cash")}
                  disabled={!cashAmount || parseFloat(cashAmount) < total}
                >
                  Complete Cash Payment
                </Button>
              </div>
            </div>
          )}

          {/* M-Pesa Payment Form */}
          {selectedMethod === "mpesa" && paymentStatus !== "processing" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Phone Number
                </label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="254700123456"
                  className="text-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter number in format: 254XXXXXXXXX
                </p>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setSelectedMethod(null)}>
                  Back
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handlePayment("mpesa")}
                  disabled={!phoneNumber || phoneNumber.length < 10}
                >
                  Send STK Push
                </Button>
              </div>
            </div>
          )}

          {/* Credit Payment Confirmation */}
          {selectedMethod === "credit" && paymentStatus !== "processing" && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <CreditCard className="w-12 h-12 mx-auto mb-2 text-orange-600" />
                <p className="font-medium text-orange-800">Credit Payment</p>
                <p className="text-sm text-orange-600">
                  This will record the sale on credit
                </p>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setSelectedMethod(null)}>
                  Back
                </Button>
                <Button 
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={() => handlePayment("credit")}
                >
                  Process Credit Sale
                </Button>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {paymentStatus === "processing" && (
            <div className="text-center py-8">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="font-medium text-gray-800">
                {selectedMethod === "mpesa" 
                  ? "Waiting for customer confirmation..." 
                  : "Processing payment..."
                }
              </p>
              {selectedMethod === "mpesa" && (
                <p className="text-sm text-gray-600 mt-2">
                  Customer will receive STK push on {phoneNumber}
                </p>
              )}
            </div>
          )}

          {/* Error Status */}
          {paymentStatus === "error" && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <p className="font-medium text-red-800 mb-4">Payment Failed</p>
              <Button onClick={resetModal}>Try Again</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;