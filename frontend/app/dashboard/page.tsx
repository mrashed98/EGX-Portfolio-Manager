"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/analytics/StatCard";
import { PortfolioChart } from "@/components/charts/PortfolioChart";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { PerformanceBar } from "@/components/charts/PerformanceBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  Target,
  Coins,
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface DashboardStats {
  totalValue: number;
  totalInvested: number;
  totalGains: number;
  gainsPercent: number;
  totalStrategies: number;
  totalHoldings: number;
  remainingCash: number;
}

interface Holding {
  id: number;
  stock_id?: number;
  stock_symbol: string;
  stock_name: string;
  quantity: number;
  average_price: number;
  current_stock_price: number;
  stock_logo_url?: string | null;
}

interface Strategy {
  id: number;
  name: string;
  total_funds: number;
  remaining_cash: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalValue: 0,
    totalInvested: 0,
    totalGains: 0,
    gainsPercent: 0,
    totalStrategies: 0,
    totalHoldings: 0,
    remainingCash: 0,
  });
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("1M");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [strategiesRes, holdingsRes] = await Promise.all([
        api.get("/strategies"),
        api.get("/holdings"),
      ]);

      const strategiesData: Strategy[] = strategiesRes.data;
      const holdingsData: Holding[] = holdingsRes.data;

      // Calculate total invested and current value
      let totalInvested = 0;
      let totalCurrentValue = 0;

      holdingsData.forEach((holding) => {
        totalInvested += holding.quantity * holding.average_price;
        totalCurrentValue += holding.quantity * holding.current_stock_price;
      });

      const totalGains = totalCurrentValue - totalInvested;
      const gainsPercent = totalInvested > 0 ? (totalGains / totalInvested) * 100 : 0;

      // Calculate remaining cash across all strategies
      const remainingCash = strategiesData.reduce(
        (sum, s) => sum + s.remaining_cash,
        0
      );

      // Generate mock portfolio history (in a real app, this would come from backend)
      const history = generatePortfolioHistory(totalCurrentValue, gainsPercent);

      setStats({
        totalValue: totalCurrentValue + remainingCash,
        totalInvested,
        totalGains,
        gainsPercent,
        totalStrategies: strategiesData.length,
        totalHoldings: holdingsData.length,
        remainingCash,
      });

      setHoldings(holdingsData);
      setStrategies(strategiesData);
      setPortfolioHistory(history);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePortfolioHistory = (currentValue: number, changePercent: number) => {
    const days = 30;
    const history = [];
    const startValue = currentValue / (1 + changePercent / 100);

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const progress = (days - i) / days;
      const value = startValue + (currentValue - startValue) * progress + 
        (Math.random() - 0.5) * currentValue * 0.02; // Add some variance

      history.push({
        date: date.toISOString(),
        value: Math.max(0, value),
      });
    }

    return history;
  };

  // Get top gainers and losers
  const calculateProfitLoss = (holding: Holding) => {
    const invested = holding.quantity * holding.average_price;
    const current = holding.quantity * holding.current_stock_price;
    const profit = current - invested;
    const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;
    return { profit, profitPercent };
  };

  const holdingsWithPL = holdings.map((h) => ({
    ...h,
    ...calculateProfitLoss(h),
  }));

  const topGainers = [...holdingsWithPL]
    .sort((a, b) => b.profitPercent - a.profitPercent)
    .slice(0, 5);

  const topLosers = [...holdingsWithPL]
    .sort((a, b) => a.profitPercent - b.profitPercent)
    .slice(0, 5);

  // Prepare allocation data
  const allocationData = holdingsWithPL.map((h) => ({
    name: h.stock_symbol,
    value: h.quantity * h.current_stock_price,
    id: h.stock_id || h.id,
  }));

  // Prepare strategy comparison data
  const strategyComparisonData = strategies.map((s) => {
    const strategyHoldings = holdings.filter((h) => {
      // In real app, you'd filter by strategy_id
      return true;
    });
    const value = strategyHoldings.reduce(
      (sum, h) => sum + h.quantity * h.current_stock_price,
      0
    );
    return {
      name: s.name,
      value: value + s.remaining_cash,
    };
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-[400px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Detailed overview of your financial situation
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Balance"
          value={`${stats.totalValue.toFixed(2)} EGP`}
          change={stats.gainsPercent}
          changeLabel="compared to invested"
          icon={Coins}
          trend={stats.gainsPercent >= 0 ? "up" : "down"}
        />
        <StatCard
          title="Total Gains"
          value={`${stats.totalGains.toFixed(2)} EGP`}
          change={stats.gainsPercent}
          icon={TrendingUp}
          trend={stats.totalGains >= 0 ? "up" : "down"}
        />
        <StatCard
          title="Active Strategies"
          value={stats.totalStrategies}
          description={`${stats.totalHoldings} holdings`}
          icon={Target}
        />
        <StatCard
          title="Available Cash"
          value={`${stats.remainingCash.toFixed(2)} EGP`}
          description="across all strategies"
          icon={Briefcase}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Total Balance Overview</CardTitle>
                <CardDescription>Your portfolio value over time</CardDescription>
              </div>
              <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <TabsList>
                  <TabsTrigger value="1W">1W</TabsTrigger>
                  <TabsTrigger value="1M">1M</TabsTrigger>
                  <TabsTrigger value="3M">3M</TabsTrigger>
                  <TabsTrigger value="1Y">1Y</TabsTrigger>
                  <TabsTrigger value="ALL">ALL</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {portfolioHistory.length > 0 ? (
              <PortfolioChart
                data={portfolioHistory}
                title=""
                type="area"
                height={300}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No historical data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Portfolio Composition</CardTitle>
            <CardDescription>Holdings allocation by value</CardDescription>
          </CardHeader>
          <CardContent>
            {allocationData.length > 0 ? (
              <AllocationChart
                data={allocationData}
                title=""
                innerRadius={60}
                outerRadius={90}
                onStockClick={(stockSymbol, stockId) => {
                  if (stockId) {
                    router.push(`/dashboard/stocks/${stockId}`);
                  }
                }}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No holdings to display
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison */}
      {strategyComparisonData.length > 0 && (
        <PerformanceBar
          data={strategyComparisonData}
          title="Strategy Comparison"
          description="Total value by strategy"
          height={250}
        />
      )}

      {/* Top Gainers and Losers */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Gainers
            </CardTitle>
            <CardDescription>Best performing stocks</CardDescription>
          </CardHeader>
          <CardContent>
            {topGainers.length > 0 ? (
              <div className="space-y-4">
                {topGainers.map((holding) => (
                  <div
                    key={holding.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/stocks/${holding.stock_id || holding.id}`)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{holding.stock_symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {holding.stock_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {holding.current_stock_price.toFixed(2)} EGP
                      </div>
                      <Badge variant="secondary" className="text-green-600">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +{holding.profitPercent.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No holdings data available
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Top Losers
            </CardTitle>
            <CardDescription>Stocks needing attention</CardDescription>
          </CardHeader>
          <CardContent>
            {topLosers.length > 0 ? (
              <div className="space-y-4">
                {topLosers.map((holding) => (
                  <div
                    key={holding.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/stocks/${holding.stock_id || holding.id}`)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{holding.stock_symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {holding.stock_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {holding.current_stock_price.toFixed(2)} EGP
                      </div>
                      <Badge variant="secondary" className="text-red-600">
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                        {holding.profitPercent.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No holdings data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => router.push("/dashboard/strategies")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Strategy
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/portfolios")}>
              <Plus className="mr-2 h-4 w-4" />
              New Portfolio
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/stocks")}>
              <Activity className="mr-2 h-4 w-4" />
              Browse Stocks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
