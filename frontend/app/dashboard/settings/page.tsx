"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import {
  Settings as SettingsIcon,
  Bell,
  Palette,
  Globe,
  Database,
  Download,
  FileText,
  Shield,
  User,
  RefreshCw,
} from "lucide-react";

interface UserSettings {
  theme: "light" | "dark" | "system";
  currency: string;
  numberFormat: "en-US" | "en-GB" | "ar-EG";
  defaultChartType: "line" | "area" | "bar";
  refreshInterval: number; // minutes
  notifications: {
    priceAlerts: boolean;
    portfolioMilestones: boolean;
    rebalancing: boolean;
    systemUpdates: boolean;
  };
  display: {
    compactMode: boolean;
    showLogos: boolean;
    animatedCharts: boolean;
  };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>({
    theme: "system",
    currency: "EGP",
    numberFormat: "en-US",
    defaultChartType: "area",
    refreshInterval: 5,
    notifications: {
      priceAlerts: true,
      portfolioMilestones: true,
      rebalancing: true,
      systemUpdates: false,
    },
    display: {
      compactMode: false,
      showLogos: true,
      animatedCharts: true,
    },
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage (in production, this would be an API call)
      localStorage.setItem("userSettings", JSON.stringify(settings));
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path: string, value: any) => {
    setSettings((prev) => {
      const keys = path.split(".");
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your application preferences and account settings
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize how the application looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={(value: any) => updateSetting("theme", value)}
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose your preferred theme or use system settings
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Reduce spacing and show more content
                </p>
              </div>
              <Switch
                checked={settings.display.compactMode}
                onCheckedChange={(checked) => updateSetting("display.compactMode", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Stock Logos</Label>
                <p className="text-sm text-muted-foreground">
                  Display company logos in lists and charts
                </p>
              </div>
              <Switch
                checked={settings.display.showLogos}
                onCheckedChange={(checked) => updateSetting("display.showLogos", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Animated Charts</Label>
                <p className="text-sm text-muted-foreground">
                  Enable smooth animations in charts
                </p>
              </div>
              <Switch
                checked={settings.display.animatedCharts}
                onCheckedChange={(checked) => updateSetting("display.animatedCharts", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Regional Settings</CardTitle>
          </div>
          <CardDescription>
            Configure currency and number formatting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={settings.currency}
              onValueChange={(value) => updateSetting("currency", value)}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EGP">Egyptian Pound (EGP)</SelectItem>
                <SelectItem value="USD">US Dollar (USD)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberFormat">Number Format</Label>
            <Select
              value={settings.numberFormat}
              onValueChange={(value: any) => updateSetting("numberFormat", value)}
            >
              <SelectTrigger id="numberFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">1,234.56 (English US)</SelectItem>
                <SelectItem value="en-GB">1,234.56 (English GB)</SelectItem>
                <SelectItem value="ar-EG">١٬٢٣٤٫٥٦ (Arabic)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data & Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Data & Performance</CardTitle>
          </div>
          <CardDescription>
            Control data refresh and chart preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="refreshInterval">Auto Refresh Interval</Label>
            <Select
              value={settings.refreshInterval.toString()}
              onValueChange={(value) => updateSetting("refreshInterval", parseInt(value))}
            >
              <SelectTrigger id="refreshInterval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Every minute</SelectItem>
                <SelectItem value="5">Every 5 minutes</SelectItem>
                <SelectItem value="15">Every 15 minutes</SelectItem>
                <SelectItem value="30">Every 30 minutes</SelectItem>
                <SelectItem value="0">Manual only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              How often to automatically refresh stock prices
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chartType">Default Chart Type</Label>
            <Select
              value={settings.defaultChartType}
              onValueChange={(value: any) => updateSetting("defaultChartType", value)}
            >
              <SelectTrigger id="chartType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Price Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when stock prices hit your targets
              </p>
            </div>
            <Switch
              checked={settings.notifications.priceAlerts}
              onCheckedChange={(checked) => updateSetting("notifications.priceAlerts", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Portfolio Milestones</Label>
              <p className="text-sm text-muted-foreground">
                Celebrate when your portfolio reaches goals
              </p>
            </div>
            <Switch
              checked={settings.notifications.portfolioMilestones}
              onCheckedChange={(checked) => updateSetting("notifications.portfolioMilestones", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Rebalancing Suggestions</Label>
              <p className="text-sm text-muted-foreground">
                Recommendations to rebalance your portfolios
              </p>
            </div>
            <Switch
              checked={settings.notifications.rebalancing}
              onCheckedChange={(checked) => updateSetting("notifications.rebalancing", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>System Updates</Label>
              <p className="text-sm text-muted-foreground">
                News and updates about the platform
              </p>
            </div>
            <Switch
              checked={settings.notifications.systemUpdates}
              onCheckedChange={(checked) => updateSetting("notifications.systemUpdates", checked)}
            />
          </div>
        </CardContent>
      </Card>

      </div> {/* End grid */}

      {/* TradingView Integration - Full Width */}
      <TradingViewSettings />

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// TradingView Settings Component
function TradingViewSettings() {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [status, setStatus] = useState<"connected" | "disconnected" | "testing">("disconnected");
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load connection status from backend
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await api.get("/tradingview/status");
      const data = response.data;
      setCredentials({ username: data.username, password: "" });
      setStatus(data.is_connected ? "connected" : "disconnected");
      if (data.last_check_at) {
        setLastCheck(new Date(data.last_check_at));
      }
    } catch (error: any) {
      // 404 means no credentials exist yet
      if (error.response?.status !== 404) {
        console.error("Failed to load TradingView status:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    // If we have username but no password, we're testing existing connection
    const isTestingExisting = credentials.username && !credentials.password;
    
    if (!isTestingExisting && (!credentials.username || !credentials.password)) {
      toast({
        title: "Missing credentials",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setStatus("testing");

    try {
      // If testing existing connection
      if (isTestingExisting) {
        const response = await api.post("/tradingview/test");
        const data = response.data;
        
        setStatus(data.is_connected ? "connected" : "disconnected");
        setLastCheck(new Date());
        
        toast({
          title: data.success ? "Connection successful" : "Connection failed",
          description: data.message,
          variant: data.success ? "default" : "destructive",
        });
      } else {
        // Connect with new credentials
        const response = await api.post("/tradingview/connect", {
          username: credentials.username,
          password: credentials.password,
        });
        
        setStatus("connected");
        setLastCheck(new Date());
        setCredentials({ username: credentials.username, password: "" }); // Clear password
        
        toast({
          title: "Connection successful",
          description: "TradingView account connected successfully",
        });
      }
    } catch (error: any) {
      setStatus("disconnected");
      const message = error.response?.data?.detail || "Failed to connect to TradingView";
      toast({
        title: "Connection failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.delete("/tradingview/disconnect");
      
      setCredentials({ username: "", password: "" });
      setStatus("disconnected");
      setLastCheck(null);
      
      toast({
        title: "Disconnected",
        description: "TradingView account disconnected successfully",
      });
    } catch (error: any) {
      const message = error.response?.data?.detail || "Failed to disconnect";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Connected
          </Badge>
        );
      case "testing":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
            Testing...
          </Badge>
        );
      case "disconnected":
      default:
        return (
          <Badge variant="outline" className="text-gray-600">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
            Disconnected
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>TradingView Integration</CardTitle>
          </div>
          <CardDescription>
            Connect your TradingView account to fetch real-time stock data and advanced analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>TradingView Integration</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Connect your TradingView account to fetch real-time stock data and advanced analytics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {status === "connected" ? (
          // Connected State
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900">Connected Account</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Username: <span className="font-mono">{credentials.username}</span>
                  </p>
                  {lastCheck && (
                    <p className="text-xs text-green-600 mt-2">
                      Last checked: {lastCheck.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${testing ? "animate-spin" : ""}`} />
                Test Connection
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                className="flex-1"
              >
                Disconnect
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Features Enabled</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Real-time stock prices
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Advanced technical indicators
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Historical data access
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Market screening tools
                </li>
              </ul>
            </div>
          </div>
        ) : (
          // Disconnected State
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900">Why Connect TradingView?</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Get real-time data, advanced charts, and powerful screening tools directly in your portfolio manager
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tv-username">TradingView Username</Label>
                <Input
                  id="tv-username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  placeholder="your_username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tv-password">Password or API Token</Label>
                <Input
                  id="tv-password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              onClick={handleTestConnection}
              disabled={testing || !credentials.username || !credentials.password}
              className="w-full"
            >
              {testing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                "Connect TradingView Account"
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Your credentials are stored securely and used only to fetch market data. We never share your information.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

