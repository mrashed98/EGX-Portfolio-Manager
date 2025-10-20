"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Link2,
  Trash2 
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { StockLogo } from "@/components/StockLogo";
import { StatCard } from "@/components/analytics/StatCard";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { PortfolioChart } from "@/components/charts/PortfolioChart";
import { ManualHoldingDialog } from "@/components/holdings/ManualHoldingDialog";
import { HoldingsMappingDialog } from "@/components/holdings/HoldingsMappingDialog";
import { ExportButton } from "@/components/import-export/ExportButton";
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
  purchase_date?: string | null;
  notes?: string | null;
  is_manual?: boolean;
  strategy_id?: number | null;
  portfolio_id?: number | null;
  strategy_name?: string | null;
  portfolio_name?: string | null;
}

interface Stock {
  id: number;
  symbol: string;
  name: string;
  current_price: number;
}

interface Strategy {
  id: number;
  name: string;
}

interface Portfolio {
  id: number;
  name: string;
}

export default function HoldingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  
  // Dialog states
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  
  // Filter states
  const [filterTab, setFilterTab] = useState<"all" | "strategy" | "manual" | "unmapped">("all");
  
  // Selection states
  const [selectedHoldingIds, setSelectedHoldingIds] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [holdingsRes, stocksRes, strategiesRes, portfoliosRes] = await Promise.all([
        api.get("/holdings"),
        api.get("/stocks"),
        api.get("/strategies"),
        api.get("/portfolios"),
      ]);
      setHoldings(holdingsRes.data);
      setStocks(stocksRes.data);
      setStrategies(strategiesRes.data);
      setPortfolios(portfoliosRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load holdings data",
        variant: "destructive",
      });
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

  // Handler functions for manual holdings
  const handleCreateManualHolding = async (data: {
    stock_id: number;
    quantity: number;
    average_price: number;
    purchase_date?: Date;
    notes?: string;
  }) => {
    try {
      await api.post("/holdings/manual", data);
      toast({
        title: "Success",
        description: "Manual holding created successfully",
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create holding",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleMapHoldings = async (
    holdingIds: number[],
    mappingType: "strategy" | "portfolio",
    targetId: number
  ) => {
    try {
      await Promise.all(
        holdingIds.map((holdingId) =>
          api.put(`/holdings/${holdingId}/map`, {
            [mappingType === "strategy" ? "strategy_id" : "portfolio_id"]: targetId,
          })
        )
      );
      toast({
        title: "Success",
        description: `Successfully mapped ${holdingIds.length} holding(s)`,
      });
      setSelectedHoldingIds([]);
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to map holdings",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteHolding = async (holdingId: number) => {
    if (!confirm("Are you sure you want to delete this holding?")) {
      return;
    }

    try {
      await api.delete(`/holdings/${holdingId}`);
      toast({
        title: "Success",
        description: "Holding deleted successfully",
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete holding",
        variant: "destructive",
      });
    }
  };

  // Filter holdings based on active tab
  const getFilteredHoldings = () => {
    switch (filterTab) {
      case "strategy":
        return holdings.filter((h) => h.strategy_id !== null && h.strategy_id !== undefined);
      case "manual":
        return holdings.filter((h) => h.is_manual);
      case "unmapped":
        return holdings.filter((h) => !h.strategy_id && !h.portfolio_id);
      case "all":
      default:
        return holdings;
    }
  };

  const filteredHoldings = getFilteredHoldings();

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedHoldingIds(filteredHoldings.map((h) => h.id));
    } else {
      setSelectedHoldingIds([]);
    }
  };

  const handleSelectHolding = (holdingId: number, checked: boolean) => {
    if (checked) {
      setSelectedHoldingIds([...selectedHoldingIds, holdingId]);
    } else {
      setSelectedHoldingIds(selectedHoldingIds.filter((id) => id !== holdingId));
    }
  };

  const selectedHoldings = holdings.filter((h) => selectedHoldingIds.includes(h.id));

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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Holdings</h1>
          <p className="text-muted-foreground mt-2">
            Overview of all your stock holdings across strategies
          </p>
        </div>
        <div className="flex gap-2">
          {holdings.length > 0 && (
            <ExportButton
              endpoint="/holdings/export"
              label="Export All"
              variant="outline"
            />
          )}
          <Button onClick={() => setManualDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Manual Holding
          </Button>
        </div>
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

      {/* Individual Holdings with Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Individual Holdings</CardTitle>
              <CardDescription>Manage your holdings with advanced filtering</CardDescription>
            </div>
            {selectedHoldingIds.length > 0 && (
              <Button onClick={() => setMappingDialogOpen(true)} variant="outline">
                <Link2 className="mr-2 h-4 w-4" />
                Map Selected ({selectedHoldingIds.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filterTab} onValueChange={(value: any) => setFilterTab(value)} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({holdings.length})</TabsTrigger>
              <TabsTrigger value="strategy">
                Strategy ({holdings.filter((h) => h.strategy_id).length})
              </TabsTrigger>
              <TabsTrigger value="manual">
                Manual ({holdings.filter((h) => h.is_manual).length})
              </TabsTrigger>
              <TabsTrigger value="unmapped">
                Unmapped ({holdings.filter((h) => !h.strategy_id && !h.portfolio_id).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filterTab} className="mt-0">
              {filteredHoldings.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">
                  No holdings found in this category.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              filteredHoldings.length > 0 &&
                              selectedHoldingIds.length === filteredHoldings.length
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Avg Price</TableHead>
                        <TableHead className="text-right">Current Price</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">P/L</TableHead>
                        <TableHead className="text-right">P/L %</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHoldings.map((holding) => {
                        const currentValue = holding.quantity * holding.current_stock_price;
                        const cost = holding.quantity * holding.average_price;
                        const profit = currentValue - cost;
                        const profitPercentage = cost > 0 ? (profit / cost) * 100 : 0;
                        const isProfit = profit >= 0;

                        return (
                          <TableRow key={holding.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedHoldingIds.includes(holding.id)}
                                onCheckedChange={(checked: boolean) =>
                                  handleSelectHolding(holding.id, checked)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <StockLogo
                                  logoUrl={holding.stock_logo_url}
                                  symbol={holding.stock_symbol}
                                  size={32}
                                />
                                <div>
                                  <div className="font-medium">{holding.stock_symbol}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {holding.stock_name}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {holding.strategy_name ? (
                                <Badge variant="secondary">{holding.strategy_name}</Badge>
                              ) : holding.portfolio_name ? (
                                <Badge variant="secondary">{holding.portfolio_name}</Badge>
                              ) : holding.is_manual ? (
                                <Badge variant="outline">Manual</Badge>
                              ) : (
                                <Badge variant="outline">Unmapped</Badge>
                              )}
                            </TableCell>
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
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {(!holding.strategy_id || !holding.portfolio_id) && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedHoldingIds([holding.id]);
                                        setMappingDialogOpen(true);
                                      }}
                                    >
                                      <Link2 className="mr-2 h-4 w-4" />
                                      Map to Strategy/Portfolio
                                    </DropdownMenuItem>
                                  )}
                                  {holding.is_manual && (
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteHolding(holding.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ManualHoldingDialog
        open={manualDialogOpen}
        onOpenChange={setManualDialogOpen}
        stocks={stocks}
        onSubmit={handleCreateManualHolding}
      />
      <HoldingsMappingDialog
        open={mappingDialogOpen}
        onOpenChange={setMappingDialogOpen}
        holdings={selectedHoldings}
        strategies={strategies}
        portfolios={portfolios}
        onSubmit={handleMapHoldings}
      />
    </div>
  );
}
