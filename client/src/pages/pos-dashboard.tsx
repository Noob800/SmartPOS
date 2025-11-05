
import { useState, useEffect } from "react";
import { usePOSStore } from "@/hooks/use-pos-store";
import LoginModal from "@/components/pos/login-modal";
import SalesSection from "@/components/pos/sales-section";
import InventorySection from "@/components/pos/inventory-section";
import ReportsSection from "@/components/pos/reports-section";
import UsersSection from "@/components/pos/users-section";
import SettingsSection from "@/components/pos/settings-section";
import FinanceManagerSection from "@/components/pos/finance-manager-section";
import AccountingSection from "@/components/pos/accounting-section";
import PaymentModal from "@/components/pos/payment-modal";
import ReceiptModal from "@/components/pos/receipt-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
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
  Shield,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  BookOpen
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
      id: "finance",
      label: "Finance Manager",
      icon: <DollarSign className="w-5 h-5" />,
      requiresAdmin: true
    },
    {
      id: "accounting",
      label: "Accounting",
      icon: <BookOpen className="w-5 h-5" />,
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
      case "finance":
        return isAdmin ? <FinanceManagerSection /> : <UnauthorizedAccess />;
      case "accounting":
        return isAdmin ? <AccountingSection /> : <UnauthorizedAccess />;
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

  const AppSidebar = () => {
    const { state } = useSidebar();
    
    return (
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center space-x-2 p-2">
            <Store className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div className={`transition-opacity duration-200 ${state === "collapsed" ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}>
              <h1 className="text-lg font-bold text-gray-800 whitespace-nowrap">MiniMart POS</h1>
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
        </SidebarHeader>

        <SidebarContent>
          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-medium">
                  {currentUser?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className={`transition-opacity duration-200 ${state === "collapsed" ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}>
                <p className="font-medium text-gray-800 whitespace-nowrap">{currentUser?.name}</p>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                  isAdmin 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {isAdmin ? 'Administrator' : 'Cashier'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <SidebarMenu>
            {navigationItems.map((item) => {
              const isDisabled = item.requiresAdmin && !isAdmin;
              const isActive = activeSection === item.id;

              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={isActive}
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) {
                        setActiveSection(item.id);
                        setIsMenuOpen(false);
                      }
                    }}
                    tooltip={state === "collapsed" ? item.label : undefined}
                    className={`${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.requiresAdmin && (
                      <Shield className="w-3 h-3 ml-auto text-purple-500" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={logout}
                tooltip={state === "collapsed" ? "Logout" : undefined}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    );
  };

  if (!currentUser) {
    return <LoginModal />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-gray-50">
        <AppSidebar />
        <SidebarInset>
          {/* Header with Sidebar Toggle */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2 px-4">
              <h1 className="text-lg font-medium">MiniMart POS</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4">
            {renderActiveSection()}
          </main>
        </SidebarInset>

        {/* Modals */}
        {showPaymentModal && <PaymentModal />}
        {showReceiptModal && <ReceiptModal />}
      </div>
    </SidebarProvider>
  );
};

export default POSDashboard;
