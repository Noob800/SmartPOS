import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePOSStore } from "@/hooks/use-pos-store";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Product, CartItem } from "@shared/schema";
import { Barcode, ShoppingCart, Minus, Plus, Trash2, Pause, X, Calculator, Clock, Receipt, Undo } from "lucide-react";

const SalesSection = () => {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const { currentUser, setShowPaymentModal } = usePOSStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const productLookupMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const response = await apiRequest("GET", `/api/products/barcode/${barcode}`);
      return response.json();
    },
    onSuccess: (product: Product) => {
      addToCart(product);
      setBarcodeInput("");
    },
    onError: () => {
      toast({
        title: "Product Not Found",
        description: "No product found with this barcode.",
        variant: "destructive",
      });
    },
  });

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      productLookupMutation.mutate(barcodeInput.trim());
    }
  };

  const addToCart = (product: Product) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        );
      } else {
        const newItem: CartItem = {
          product,
          quantity: 1,
          unitPrice: parseFloat(product.price),
          total: parseFloat(product.price)
        };
        return [...currentCart, newItem];
      }
    });
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(currentCart =>
      currentCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice }
          : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(currentCart => currentCart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const holdSale = () => {
    // In a real implementation, this would save the cart to storage
    toast({
      title: "Sale Held",
      description: "Current sale has been put on hold.",
    });
    clearCart();
  };

  const voidSale = () => {
    clearCart();
    toast({
      title: "Sale Voided",
      description: "Current sale has been cancelled.",
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0.16; // 16% VAT
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const handlePayment = (method: string) => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before processing payment.",
        variant: "destructive",
      });
      return;
    }

    setShowPaymentModal(true);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        handlePayment('cash');
      } else if (e.key === 'F2') {
        e.preventDefault();
        handlePayment('mpesa');
      } else if (e.key === 'F3') {
        e.preventDefault();
        handlePayment('credit');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 h-full">
      {/* Product Search & Cart */}
      <div className="lg:col-span-2 space-y-6">
        {/* Barcode Scanner */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleBarcodeSubmit} className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode / Product Search
                </label>
                <div className="flex space-x-2">
                  <Input
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan barcode or search product..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={productLookupMutation.isPending}>
                    <Barcode className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Shopping Cart */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <span>Current Sale</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={holdSale}>
                  <Pause className="w-4 h-4 mr-2" />
                  Hold
                </Button>
                <Button variant="destructive" size="sm" onClick={voidSale}>
                  <X className="w-4 h-4 mr-2" />
                  Void
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No items in cart</p>
                <p className="text-sm">Scan or search for products to add</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                      <p className="text-sm font-medium">KSH {item.unitPrice.toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">KSH {item.total.toFixed(2)}</p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Summary */}
      <div className="space-y-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">KSH {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">VAT (16%):</span>
              <span className="font-medium">KSH {tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-primary">KSH {total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center space-x-2"
              onClick={() => handlePayment('cash')}
              disabled={cart.length === 0}
            >
              <i className="fas fa-money-bill-wave"></i>
              <span>Cash (F1)</span>
            </Button>
            <Button
              className="w-full flex items-center justify-center space-x-2"
              onClick={() => handlePayment('mpesa')}
              disabled={cart.length === 0}
            >
              <i className="fas fa-mobile-alt"></i>
              <span>M-Pesa (F2)</span>
            </Button>
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center space-x-2"
              onClick={() => handlePayment('credit')}
              disabled={cart.length === 0}
            >
              <i className="fas fa-credit-card"></i>
              <span>Credit (F3)</span>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                <Receipt className="w-6 h-6 mb-2" />
                <span className="text-sm">Reprint Receipt</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                <Undo className="w-6 h-6 mb-2" />
                <span className="text-sm">Return Item</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                <Calculator className="w-6 h-6 mb-2" />
                <span className="text-sm">Calculator</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                <Clock className="w-6 h-6 mb-2" />
                <span className="text-sm">Held Sales</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesSection;
