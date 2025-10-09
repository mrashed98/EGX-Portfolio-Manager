"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown } from "lucide-react";
import { StockLogo } from "@/components/StockLogo";
import { StatCard } from "@/components/analytics/StatCard";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { PortfolioChart } from "@/components/charts/PortfolioChart";
import api from "@/lib/api";

interface Holding {
  id: number;
  stock_id?: number;
  stock_symbol: string;
  stock_name: string;
  stock_logo_url?: string | null;
  quantity: number;
  average_price: number;
  current_stock_price: number;
  current_value: number;
}

export default function HoldingsPage() {
  const router = useRouter();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  useEffect(() => {
    loadHoldings();
  }, []);

  const loadHoldings = async () => {
    try {
      const response = await api.get("/holdings");
      setHoldings(response.data);
    } catch (error) {
      console.error("Failed to load holdings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate holdings by stock symbol
  let aggregatedHoldings = holdings.reduce((acc, holding) => {
    const existingHolding = acc.find((h) => h.stock_symbol === holding.stock_symbol);
    if (existingHolding) {
      const totalCost =
        existingHolding.quantity * existingHolding.average_price +
        holding.quantity * holding.average_price;
      existingHolding.quantity += holding.quantity;
      existingHolding.average_price = totalCost / existingHolding.quantity;
    } else {
      acc.push({ ...holding });
    }
    return acc;
  }, [] as Holding[]);

  const calculateCurrentValue = (holding: Holding) => {
    return holding.quantity * holding.current_stock_price;
  };

  const calculateProfit = (holding: Holding) => {
    const currentValue = calculateCurrentValue(holding);
    return currentValue - holding.quantity * holding.average_price;
  };

  const calculateProfitPercentage = (holding: Holding) => {
    const cost = holding.quantity * holding.average_price;
    const currentValue = calculateCurrentValue(holding);
    return cost > 0 ? ((currentValue - cost) / cost) * 100 : 0;
  };

  const calculateTotalValue = () => {
    return aggregatedHoldings.reduce(
      (sum, holding) => sum + calculateCurrentValue(holding),
      0
    );
  };

  const calculateTotalCost = () => {
    return aggregatedHoldings.reduce(
      (sum, holding) => sum + holding.quantity * holding.average_price,
      0
    );
  };

  const calculateTotalProfit = () => {
    return calculateTotalValue() - calculateTotalCost();
  };

  const calculateTotalProfitPercent = () => {
    const cost = calculateTotalCost();
    return cost > 0 ? (calculateTotalProfit() / cost) * 100 : 0;
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  // Apply sorting
  if (sortColumn && sortDirection) {
    aggregatedHoldings = [...aggregatedHoldings].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "quantity":
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case "average_price":
          aValue = a.average_price;
          bValue = b.average_price;
          break;
        case "current_price":
          aValue = a.current_stock_price;
          bValue = b.current_stock_price;
          break;
        case "value":
          aValue = calculateCurrentValue(a);
          bValue = calculateCurrentValue(b);
          break;
        case "profit":
          aValue = calculateProfit(a);
          bValue = calculateProfit(b);
          break;
        case "profit_percentage":
          aValue = calculateProfitPercentage(a);
          bValue = calculateProfitPercentage(b);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Prepare allocation data for pie chart
  const allocationData = aggregatedHoldings.map((h) => ({
    name: h.stock_symbol,
    value: calculateCurrentValue(h),
    id: h.stock_id || h.id,
  }));

  // Generate mock historical data
  const totalValue = calculateTotalValue();
  const profitPercent = calculateTotalProfitPercent();
  const portfolioHistory = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const progress = i / 29;
    const startValue = totalValue / (1 + profitPercent / 100);
    const value = startValue + (totalValue - startValue) * progress +
      (Math.random() - 0.5) * totalValue * 0.02;

    return {
      date: date.toISOString(),
      value: Math.max(0, value),
    };
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Holdings</h1>
        <p className="text-muted-foreground mt-2">
          Overview of all your stock holdings across strategies
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Value"
          value={`${calculateTotalValue().toFixed(2)} EGP`}
          change={calculateTotalProfitPercent()}
          changeLabel="vs cost basis"
          icon={TrendingUp}
          trend={calculateTotalProfit() >= 0 ? "up" : "down"}
        />
        <StatCard
          title="Total Cost"
          value={`${calculateTotalCost().toFixed(2)} EGP`}
          description="Total invested"
          icon={TrendingDown}
        />
        <StatCard
          title="Total P/L"
          value={`${calculateTotalProfit().toFixed(2)} EGP`}
          change={calculateTotalProfitPercent()}
          icon={calculateTotalProfit() >= 0 ? TrendingUp : TrendingDown}
          trend={calculateTotalProfit() >= 0 ? "up" : "down"}
        />
        <StatCard
          title="Holdings"
          value={aggregatedHoldings.length}
          description="unique stocks"
          icon={TrendingUp}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-7">
        <div className="md:col-span-4">
          <PortfolioChart
            data={portfolioHistory}
            title="Holdings Value Over Time"
            description="Historical value of all holdings"
            type="area"
            height={500}
          />
        </div>

        <div className="md:col-span-3">
          <AllocationChart
            data={allocationData}
            title="Holdings Allocation"
            description="Distribution by current value"
            innerRadius={70}
            outerRadius={100}
            onStockClick={(stockSymbol, stockId) => {
              if (stockId) {
                router.push(`/dashboard/stocks/${stockId}`);
              }
            }}
          />
        </div>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Holdings</CardTitle>
          <CardDescription>Detailed breakdown of your positions</CardDescription>
        </CardHeader>
        <CardContent>
          {aggregatedHoldings.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              No holdings yet. Create a strategy to start investing.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover:bg-muted ml-auto flex"
                        onClick={() => handleSort("quantity")}
                      >
                        Quantity
                        {getSortIcon("quantity")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover:bg-muted ml-auto flex"
                        onClick={() => handleSort("average_price")}
                      >
                        Avg Price
                        {getSortIcon("average_price")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover:bg-muted ml-auto flex"
                        onClick={() => handleSort("current_price")}
                      >
                        Current Price
                        {getSortIcon("current_price")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover:bg-muted ml-auto flex"
                        onClick={() => handleSort("value")}
                      >
                        Value
                        {getSortIcon("value")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover:bg-muted ml-auto flex"
                        onClick={() => handleSort("profit")}
                      >
                        Profit/Loss
                        {getSortIcon("profit")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover:bg-muted ml-auto flex"
                        onClick={() => handleSort("profit_percentage")}
                      >
                        P/L %
                        {getSortIcon("profit_percentage")}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregatedHoldings.map((holding) => {
                    const currentValue = calculateCurrentValue(holding);
                    const profit = calculateProfit(holding);
                    const profitPercentage = calculateProfitPercentage(holding);
                    const isProfit = profit >= 0;

                    return (
                      <TableRow 
                        key={holding.stock_symbol}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          const stockId = holding.stock_id || holding.id;
                          if (stockId) {
                            router.push(`/dashboard/stocks/${stockId}`);
                          }
                        }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <StockLogo
                              symbol={holding.stock_symbol}
                              name={holding.stock_name}
                              logoUrl={holding.stock_logo_url}
                              size={32}
                            />
                            <span>{holding.stock_symbol}</span>
                          </div>
                        </TableCell>
                        <TableCell>{holding.stock_name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {holding.quantity}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {holding.average_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {holding.current_stock_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {currentValue.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="secondary"
                            className={`${
                              isProfit ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isProfit ? "+" : ""}
                            {profit.toFixed(2)} EGP
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="secondary"
                            className={`${
                              isProfit ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isProfit ? "+" : ""}
                            {profitPercentage.toFixed(2)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
