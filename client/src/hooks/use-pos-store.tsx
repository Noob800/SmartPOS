import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, CartItem, Product } from "@shared/schema";

interface POSState {
  // User state
  currentUser: User | null;
  isLoggedIn: boolean;

  // Navigation
  currentSection: string;

  // Cart state
  cart: CartItem[];
  
  // Modal states
  showPaymentModal: boolean;
  showReceiptModal: boolean;
  paymentMethod: string | null;
  paymentAmount: number;
  lastSale: any | null;

  // Offline state
  isOnline: boolean;
  pendingSales: any[];
}

interface POSActions {
  // User actions
  setCurrentUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;

  // Navigation
  setCurrentSection: (section: string) => void;

  // Cart actions
  addToCart: (product: Product) => void;
  updateCartItem: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;

  // Modal actions
  setShowPaymentModal: (show: boolean) => void;
  setShowReceiptModal: (show: boolean) => void;
  setPaymentMethod: (method: string | null) => void;
  setPaymentAmount: (amount: number) => void;
  setLastSale: (sale: any) => void;

  // Offline actions
  setIsOnline: (online: boolean) => void;
  addPendingSale: (sale: any) => void;
}

type POSContextType = POSState & POSActions;

const POSContext = createContext<POSContextType | undefined>(undefined);

export const usePOSStore = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error("usePOSStore must be used within POSProvider");
  }
  return context;
};

interface POSProviderProps {
  children: ReactNode;
}

export const POSProvider = ({ children }: POSProviderProps) => {
  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSection, setCurrentSection] = useState("sales");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [lastSale, setLastSale] = useState<any | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSales, setPendingSales] = useState<any[]>([]);

  // Computed state
  const isLoggedIn = currentUser !== null;

  // Effects
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('pos_current_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
      }
    }

    const savedCart = localStorage.getItem('pos_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
      }
    }

    const savedPendingSales = localStorage.getItem('pos_pending_sales');
    if (savedPendingSales) {
      try {
        setPendingSales(JSON.parse(savedPendingSales));
      } catch (error) {
        console.error('Failed to parse pending sales:', error);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pos_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pos_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('pos_pending_sales', JSON.stringify(pendingSales));
  }, [pendingSales]);

  // Actions
  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentSection("sales");
    clearCart();
    setShowPaymentModal(false);
    setShowReceiptModal(false);
    setPaymentMethod(null);
    setLastSale(null);
  };

  const addToCart = (product: Product) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.product.id === product.id
            ? { 
                ...item, 
                quantity: item.quantity + 1, 
                total: (item.quantity + 1) * item.unitPrice 
              }
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

  const updateCartItem = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(currentCart =>
      currentCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity, total: quantity * item.unitPrice }
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

  const addPendingSale = (sale: any) => {
    setPendingSales(current => [...current, sale]);
  };

  const value: POSContextType = {
    // State
    currentUser,
    isLoggedIn,
    currentSection,
    cart,
    showPaymentModal,
    showReceiptModal,
    paymentMethod,
    paymentAmount,
    lastSale,
    isOnline,
    pendingSales,

    // Actions
    setCurrentUser,
    login,
    logout,
    setCurrentSection,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    setShowPaymentModal,
    setShowReceiptModal,
    setPaymentMethod,
    setPaymentAmount,
    setLastSale,
    setIsOnline,
    addPendingSale,
  };

  return (
    <POSContext.Provider value={value}>
      {children}
    </POSContext.Provider>
  );
};
