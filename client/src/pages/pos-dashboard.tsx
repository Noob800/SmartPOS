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
import { Store, LogOut, Wifi, WifiOff } from "lucide-react";

const POSDashboard = () => {
  const { currentUser, logout, currentSection, setCurrentSection } = usePOSStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        // Handle F1 for cash payment
      } else if (e.key === 'F2') {
        e.preventDefault();
        // Handle F2 for M-Pesa payment
      } else if (e.key === 'F3') {
        e.preventDefault();
        // Handle F3 for credit payment
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const navigationItems = [
    { id: 'sales', label: 'Sales', icon: 'fas fa-cash-register' },
    { id: 'inventory', label: 'Inventory', icon: 'fas fa-boxes' },
    { id: 'reports', label: 'Reports', icon: 'fas fa-chart-bar' },
    { id: 'users', label: 'Users', icon: 'fas fa-users' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' }
  ];

  if (!currentUser) {
    return <LoginModal />;
  }

  const renderSection = () => {
    switch (currentSection) {
      case 'sales':
        return <SalesSection />;
      case 'inventory':
        return <InventorySection />;
      case 'reports':
        return <ReportsSection />;
      case 'users':
        return <UsersSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <SalesSection />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Store className="text-2xl text-primary" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">MiniMart POS</h1>
              <p className="text-sm text-gray-600">
                {currentDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Online</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-600">Offline</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <i className="fas fa-user-circle"></i>
              <span>{currentUser.name} ({currentUser.role})</span>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={logout}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white shadow-lg border-r border-gray-200">
          <div className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      currentSection === item.id
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setCurrentSection(item.id)}
                  >
                    <i className={item.icon}></i>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {renderSection()}
        </main>
      </div>

      {/* Modals */}
      <PaymentModal />
      <ReceiptModal />
    </div>
  );
};

export default POSDashboard;
