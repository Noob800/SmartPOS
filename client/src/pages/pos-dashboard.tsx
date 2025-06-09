
import { useState, useEffect } from "react";
import { usePOSStore } from "@/hooks/use-pos-store";
import LoginModal from "@/components/pos/login-modal";
import SalesSection from "@/components/pos/sales-section";
import InventorySection from "@/components/pos/inventory-section";
import ReportsSection from "@/components/pos/reports-section";
import UsersSection from "@/components/pos/users-section";
import SettingsSection from "@/components/pos/settings-section";
import PaymentModal from "@/components/pos/payment-modal";
import ReceiptModal from "@/components/pos/receipt-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Store, 
  LogOut, 
  Wifi, 
  WifiOff, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Users, 
  Settings,
  Menu,
  X,
  Shield
} from "lucide-react";

const POSDashboard = () => {
  const [activeSection, setActiveSection] = useState("sales");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const { 
    currentUser, 
    logout, 
    isOnline,
    showPaymentModal,
    showReceiptModal 
  } = usePOSStore();

  // Check for admin privileges
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    // Handle keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key) {
          case '1':
            setActiveSection("sales");
            break;
          case '2':
            if (isAdmin) setActiveSection("inventory");
            break;
          case '3':
            if (isAdmin) setActiveSection("reports");
            break;
          case '4':
            if (isAdmin) setActiveSection("users");
            break;
          case '5':
            if (isAdmin) setActiveSection("settings");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isAdmin]);

  const navigationItems = [
    {
      id: "sales",
      label: "Sales",
      icon: <ShoppingCart className="w-5 h-5" />,
      requiresAdmin: false
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: <Package className="w-5 h-5" />,
      requiresAdmin: true
    },
    {
      id: "reports",
      label: "Reports",
      icon: <BarChart3 className="w-5 h-5" />,
      requiresAdmin: true
    },
    {
      id: "users",
      label: "Users",
      icon: <Users className="w-5 h-5" />,
      requiresAdmin: true
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      requiresAdmin: true
    }
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case "sales":
        return <SalesSection />;
      case "inventory":
        return isAdmin ? <InventorySection /> : <UnauthorizedAccess />;
      case "reports":
        return isAdmin ? <ReportsSection /> : <UnauthorizedAccess />;
      case "users":
        return isAdmin ? <UsersSection /> : <UnauthorizedAccess />;
      case "settings":
        return isAdmin ? <SettingsSection /> : <UnauthorizedAccess />;
      default:
        return <SalesSection />;
    }
  };

  const UnauthorizedAccess = () => (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <Shield className="w-16 h-16 text-red-500" />
      <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
      <p className="text-gray-600 text-center max-w-md">
        You don't have permission to access this section. Administrator privileges required.
      </p>
      <Button onClick={() => setActiveSection("sales")}>
        Return to Sales
      </Button>
    </div>
  );

  if (!currentUser) {
    return <LoginModal />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-50 md:z-0
        w-64 h-full bg-white shadow-lg border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Store className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-800">MiniMart POS</h1>
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-gray-500">
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-800">{currentUser.name}</p>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isAdmin 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {isAdmin ? 'Administrator' : 'Cashier'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const isDisabled = item.requiresAdmin && !isAdmin;
            const isActive = activeSection === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${
                  isDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => {
                  if (!isDisabled) {
                    setActiveSection(item.id);
                    setIsMenuOpen(false);
                  }
                }}
                disabled={isDisabled}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
                {item.requiresAdmin && (
                  <Shield className="w-3 h-3 ml-auto text-purple-500" />
                )}
              </Button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-medium">MiniMart POS</h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {renderActiveSection()}
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && <PaymentModal />}
      {showReceiptModal && <ReceiptModal />}
    </div>
  );
};

export default POSDashboard;
