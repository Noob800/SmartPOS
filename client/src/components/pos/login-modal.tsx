import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { usePOSStore } from "@/hooks/use-pos-store";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LoginModal = () => {
  const [pin, setPin] = useState("");
  const { setCurrentUser } = usePOSStore();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (pin: string) => {
      const response = await apiRequest("POST", "/api/auth/login", { pin });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentUser(data.user);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.name}!`,
      });
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Invalid PIN. Please try again.",
        variant: "destructive",
      });
      setPin("");
    },
  });

  const handlePinInput = (number: string) => {
    if (pin.length < 4) {
      setPin(pin + number);
    }
  };

  const handleClear = () => {
    setPin("");
  };

  const handleLogin = () => {
    if (pin.length === 4) {
      loginMutation.mutate(pin);
    }
  };

  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['clear', '0', 'login']
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96 shadow-2xl">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <Store className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">MiniMart POS</h2>
            <p className="text-gray-600 mt-2">Enter your PIN to continue</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User PIN
            </label>
            <Input
              type="password"
              value={pin}
              readOnly
              className="text-center text-2xl tracking-widest"
              placeholder="••••"
              maxLength={4}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-6">
            {numbers.flat().map((item, index) => {
              if (item === 'clear') {
                return (
                  <Button
                    key={index}
                    variant="destructive"
                    className="h-12 text-lg font-semibold"
                    onClick={handleClear}
                  >
                    <i className="fas fa-backspace"></i>
                  </Button>
                );
              } else if (item === 'login') {
                return (
                  <Button
                    key={index}
                    className="h-12 text-lg font-semibold"
                    onClick={handleLogin}
                    disabled={pin.length !== 4 || loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <i className="fas fa-arrow-right"></i>
                    )}
                  </Button>
                );
              } else {
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-12 text-lg font-semibold"
                    onClick={() => handlePinInput(item)}
                    disabled={pin.length >= 4}
                  >
                    {item}
                  </Button>
                );
              }
            })}
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Demo PIN: 1234 (Admin) or 0000 (Cashier)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginModal;
