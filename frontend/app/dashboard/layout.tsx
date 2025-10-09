"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Target,
  Eye,
  LogOut,
} from "lucide-react";
import { authService } from "@/lib/auth";
import { Toaster } from "@/components/ui/toaster";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    authService.logout();
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/stocks", label: "Stocks", icon: TrendingUp },
    { href: "/dashboard/portfolios", label: "Portfolios", icon: Briefcase },
    { href: "/dashboard/strategies", label: "Strategies", icon: Target },
    { href: "/dashboard/holdings", label: "Holdings", icon: TrendingUp },
    { href: "/dashboard/watchlists", label: "Watchlists", icon: Eye },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Fixed */}
      <div className="fixed left-0 top-0 h-screen w-64 border-r bg-muted/10 flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold">EGX Portfolio</h2>
        </div>
        <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content - With left margin for sidebar */}
      <div className="flex-1 ml-64">
        <div className="p-8">
          {children}
        </div>
      </div>
      <Toaster />
    </div>
  );
}

