"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  TrendingUp,
  Briefcase,
  Target,
  Eye,
  LogOut,
  Menu,
  X,
  Calendar,
  Wallet,
  Plus,
  RefreshCw,
  Settings,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { authService } from "@/lib/auth";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { OfflineAlert } from "@/components/layout/OfflineAlert";
import { useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import { OnboardingTour, useOnboardingTour } from "@/components/onboarding/OnboardingTour";
import { HelpCenter, useHelpCenter } from "@/components/help/HelpCenter";
import api from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Enable global keyboard shortcuts
  useGlobalShortcuts();

  // Help center and onboarding
  const { open: helpOpen, setOpen: setHelpOpen } = useHelpCenter();
  const { restartTour } = useOnboardingTour();

  // Keyboard shortcut for help (Cmd/Ctrl + ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setHelpOpen]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
    } else {
      loadUser();
      setLoading(false);
    }
  }, [router]);

  const loadUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        // Fallback: try to get from token or redirect to login
        console.warn("User email not found, logging out");
        authService.logout();
      }
    } catch (error: any) {
      console.error("Failed to load user:", error);
      // If 401, user is not authenticated
      if (error.response?.status === 401) {
        authService.logout();
      }
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    try {
      await api.post("/stocks/refresh");
      setLastRefresh(new Date());
      toast({
        title: "Success",
        description: "Stock prices refreshed successfully",
      });
    } catch (error) {
      console.error("Failed to refresh prices:", error);
      toast({
        title: "Error",
        description: "Failed to refresh stock prices",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleNewPortfolio = () => {
    router.push("/dashboard/portfolios?action=new");
  };

  const handleNewStrategy = () => {
    router.push("/dashboard/strategies?action=new");
  };

  const handleNewHolding = () => {
    router.push("/dashboard/holdings?action=new");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/dashboard", label: "Analytics", icon: BarChart3, dataTour: "analytics" },
    { href: "/dashboard/stocks", label: "Stocks", icon: TrendingUp, dataTour: "stocks" },
    { href: "/dashboard/portfolios", label: "Portfolios", icon: Briefcase, dataTour: "portfolios" },
    { href: "/dashboard/strategies", label: "Strategies", icon: Target, dataTour: "strategies" },
    { href: "/dashboard/holdings", label: "Holdings", icon: Wallet, dataTour: "holdings" },
    { href: "/dashboard/watchlists", label: "Watchlists", icon: Eye, dataTour: "watchlists" },
    { href: "/dashboard/calendar", label: "Calendar", icon: Calendar, dataTour: "calendar" },
    { href: "/dashboard/settings", label: "Settings", icon: Settings, dataTour: "settings" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen border-r bg-card transition-all duration-300 z-50 ${
          sidebarOpen ? "w-64" : "w-16 max-lg:-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Logo */}
          <div className={`border-b transition-all duration-300 ${sidebarOpen ? "p-6" : "p-4"}`}>
            <Link href="/dashboard">
              {sidebarOpen ? (
                <>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    FinSet
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    EGX Portfolio Manager
                  </p>
                </>
              ) : (
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  F
                </h2>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} data-tour={item.dataTour}>
                  <div
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    } ${!sidebarOpen ? "justify-center" : ""}`}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </nav>

          {sidebarOpen && (
            <>
              <Separator />

              {/* Quick Actions */}
              <div className="p-3 space-y-2" data-tour="quick-actions">
                <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">
                  Quick Actions
                </p>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={handleNewPortfolio}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Portfolio
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={handleNewStrategy}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Strategy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={handleNewHolding}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Holding
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={handleRefreshPrices}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Refreshing..." : "Refresh Prices"}
                  </Button>
                </div>
                {lastRefresh && (
                  <p className="text-xs text-muted-foreground px-3 pt-2">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </p>
                )}
              </div>

              <Separator />

              {/* User Profile */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userEmail.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {userEmail.split("@")[0] || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">Investor</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-card border shadow-sm"
      >
        {sidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-16"
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center gap-4 px-8">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 rounded-md hover:bg-muted transition-colors"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHelpOpen(true)}
                className="gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden md:inline">Help</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={restartTour}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden md:inline">Tour</span>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>

      {/* Global Components */}
      <OfflineAlert />
      <Toaster />
      
      {/* Onboarding & Help */}
      <OnboardingTour />
      <HelpCenter open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
