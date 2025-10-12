"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
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
    <div className="space-y-8 max-w-4xl">
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

