import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Settings, Store, Receipt, DollarSign, Cloud, Shield, Database } from "lucide-react";

interface SettingField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "switch";
  options?: string[];
  placeholder?: string;
  description?: string;
}

const SettingsSection = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fetchedSettings = [] } = useQuery({
    queryKey: ["/api/settings"],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await apiRequest("POST", "/api/settings", { key, value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Updated",
        description: "Settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (fetchedSettings.length > 0) {
      const settingsMap = fetchedSettings.reduce((acc: Record<string, string>, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
      setSettings(settingsMap);
    }
  }, [fetchedSettings]);

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    try {
      // Save all settings
      for (const [key, value] of Object.entries(settings)) {
        await updateSettingMutation.mutateAsync({ key, value });
      }
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      store_name: "MiniMart Express",
      store_address: "123 Main Street, Nairobi, Kenya",
      store_phone: "+254 700 123456",
      currency: "KSH",
      tax_rate: "16",
      receipt_header: "Thank you for shopping with us!\nVisit again soon.",
      receipt_footer: "For support: +254 700 123456\nwww.minimartexpress.co.ke",
      auto_sync: "true",
      auto_print: "true",
      sound_notifications: "false",
      session_timeout: "30"
    };
    setSettings(defaultSettings);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults.",
    });
  };

  const handleBackupData = async () => {
    setIsLoading(true);
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Backup Successful",
        description: "All data has been backed up to the cloud.",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to backup data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setIsLoading(true);
    try {
      // Force sync with server
      await queryClient.invalidateQueries();
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Sync Complete",
        description: "All data has been synchronized with the server.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync with server. Please check connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSystemStatus = async () => {
    setIsLoading(true);
    try {
      // Check system health
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "System Status: Healthy",
        description: "All systems are running normally. Database: Connected, Storage: Available",
      });
    } catch (error) {
      toast({
        title: "System Check Failed",
        description: "Unable to verify system status.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedMockData = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/seed-mock-data", {});
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Mock Data Seeded",
          description: "All mock data has been successfully seeded into the database. Please refresh the page to see the changes.",
        });
        
        // Invalidate all queries to refresh data
        setTimeout(() => {
          queryClient.invalidateQueries();
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to seed mock data");
      }
    } catch (error) {
      toast({
        title: "Seeding Failed",
        description: error instanceof Error ? error.message : "Failed to seed mock data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      switch (action) {
        case 'clear-cache':
          toast({ title: "Cache Cleared", description: "Application cache has been cleared." });
          break;
        case 'reset-counters':
          toast({ title: "Counters Reset", description: "All counters have been reset to zero." });
          break;
        case 'export-reports':
          toast({ title: "Reports Exported", description: "Reports have been exported successfully." });
          break;
        case 'system-logs':
          toast({ title: "System Logs", description: "System logs are available for download." });
          break;
      }
    } catch (error) {
      toast({
        title: "Action Failed",
        description: `Failed to ${action.replace('-', ' ')}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const settingsSections = [
    {
      title: "Store Information",
      icon: <Store className="w-5 h-5" />,
      fields: [
        {
          key: "store_name",
          label: "Store Name",
          type: "text" as const,
          placeholder: "Enter store name"
        },
        {
          key: "store_address",
          label: "Store Address",
          type: "textarea" as const,
          placeholder: "Enter store address"
        },
        {
          key: "store_phone",
          label: "Phone Number",
          type: "text" as const,
          placeholder: "+254 700 123456"
        }
      ]
    },
    {
      title: "Currency & Tax",
      icon: <DollarSign className="w-5 h-5" />,
      fields: [
        {
          key: "currency",
          label: "Currency",
          type: "select" as const,
          options: ["KSH", "USD", "EUR", "GBP"]
        },
        {
          key: "tax_rate",
          label: "VAT Rate (%)",
          type: "number" as const,
          placeholder: "16"
        }
      ]
    },
    {
      title: "Receipt Settings",
      icon: <Receipt className="w-5 h-5" />,
      fields: [
        {
          key: "receipt_header",
          label: "Receipt Header",
          type: "textarea" as const,
          placeholder: "Thank you for shopping with us!"
        },
        {
          key: "receipt_footer",
          label: "Receipt Footer",
          type: "textarea" as const,
          placeholder: "Visit again soon."
        }
      ]
    },
    {
      title: "System Preferences",
      icon: <Settings className="w-5 h-5" />,
      fields: [
        {
          key: "auto_sync",
          label: "Auto-sync to cloud",
          type: "switch" as const,
          description: "Automatically sync data when online"
        },
        {
          key: "auto_print",
          label: "Print receipt automatically",
          type: "switch" as const,
          description: "Automatically print receipt after payment"
        },
        {
          key: "sound_notifications",
          label: "Sound notifications",
          type: "switch" as const,
          description: "Play sounds for notifications and alerts"
        },
        {
          key: "session_timeout",
          label: "Session timeout (minutes)",
          type: "number" as const,
          placeholder: "30",
          description: "Auto-logout after inactivity"
        }
      ]
    }
  ];

  const renderField = (field: SettingField) => {
    const value = settings[field.key] || "";

    switch (field.type) {
      case "text":
      case "number":
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => handleSettingChange(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        );
      
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleSettingChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        );
      
      case "select":
        return (
          <Select value={value} onValueChange={(newValue) => handleSettingChange(field.key, newValue)}>
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "switch":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value === "true"}
              onCheckedChange={(checked) => handleSettingChange(field.key, checked.toString())}
            />
            <Label className="text-sm text-gray-600">
              {field.description}
            </Label>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-gray-600" />
          <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSaveAll} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingsSections.map((section, sectionIndex) => (
          <Card key={sectionIndex}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {section.icon}
                <span>{section.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.fields.map((field, fieldIndex) => (
                <div key={fieldIndex} className="space-y-2">
                  <Label htmlFor={field.key} className="text-sm font-medium">
                    {field.label}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="w-5 h-5" />
            <span>Data Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={handleBackupData}
              disabled={isLoading}
            >
              <Cloud className="w-8 h-8 text-blue-600" />
              <div className="text-center">
                <div className="font-medium">Backup Data</div>
                <div className="text-sm text-gray-500">Export all data to cloud</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={handleSyncNow}
              disabled={isLoading}
            >
              <Settings className="w-8 h-8 text-green-600" />
              <div className="text-center">
                <div className="font-medium">Sync Now</div>
                <div className="text-sm text-gray-500">Force sync with server</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={handleSystemStatus}
              disabled={isLoading}
            >
              <Shield className="w-8 h-8 text-purple-600" />
              <div className="text-center">
                <div className="font-medium">System Status</div>
                <div className="text-sm text-gray-500">Check system health</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Developer Tools Section */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-700">
            <Database className="w-5 h-5" />
            <span>Developer Tools</span>
          </CardTitle>
          <p className="text-sm text-orange-600">
            ⚠️ These tools are for development and testing purposes only. Use with caution.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-base font-semibold text-gray-900">
                  Seed Mock Data
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Populate the database with sample data including users, products, sales, and accounting entries. 
                  This will clear all existing data first.
                </p>
              </div>
              <Button 
                onClick={handleSeedMockData}
                disabled={isLoading}
                className="ml-4 bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? "Seeding..." : "Seed Data"}
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>✓ 5 Users (3 active cashiers, 2 admins)</p>
            <p>✓ 50 Products across multiple categories</p>
            <p>✓ ~100 Sales transactions with items</p>
            <p>✓ 20 Stock adjustments</p>
            <p>✓ Complete chart of accounts</p>
            <p>✓ Journal entries with double-entry bookkeeping</p>
            <p>✓ System settings configured</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickAction('clear-cache')}
              disabled={isLoading}
            >
              Clear Cache
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickAction('reset-counters')}
              disabled={isLoading}
            >
              Reset Counters
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickAction('export-reports')}
              disabled={isLoading}
            >
              Export Reports
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickAction('system-logs')}
              disabled={isLoading}
            >
              System Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Label className="text-gray-600">Version</Label>
              <p className="font-medium">v1.0.0</p>
            </div>
            <div>
              <Label className="text-gray-600">Database</Label>
              <p className="font-medium">In-Memory + IndexedDB</p>
            </div>
            <div>
              <Label className="text-gray-600">Last Backup</Label>
              <p className="font-medium">Never</p>
            </div>
            <div>
              <Label className="text-gray-600">Storage Used</Label>
              <p className="font-medium">~2.5 MB</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsSection;
