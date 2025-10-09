"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { StockLogo } from "@/components/StockLogo";
import { PortfolioPerformanceChart } from "@/components/charts/PortfolioPerformanceChart";
import api from "@/lib/api";
import { ArrowLeft, Edit, Trash2, RefreshCw, TrendingUp, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown, History } from "lucide-react";

interface Strategy {
  id: number;
  name: string;
  total_funds: number;
  remaining_cash: number;
  portfolio_allocations: any[];
  created_at: string;
}

interface Holding {
  id: number;
  stock_id: number;
  quantity: number;
  average_price: number;
  current_value: number;
  stock_symbol: string;
  stock_name: string;
  stock_logo_url?: string | null;
  current_stock_price: number;
}

interface Stock {
  id: number;
  symbol: string;
  name: string;
  current_price: number;
}

interface StrategySnapshot {
  id: number;
  total_value: number;
  performance_percentage: number;
  snapshot_date: string;
}

interface RebalancingAction {
  stock_id: number;
  stock_symbol: string;
  action: string;
  quantity: number;
  price: number;
  total_amount: number;
}

export default function StrategyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const strategyId = parseInt(params.id as string);

  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [snapshots, setSnapshots] = useState<StrategySnapshot[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [rebalancingActions, setRebalancingActions] = useState<RebalancingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRebalance, setLoadingRebalance] = useState(false);
  const [executingRebalance, setExecutingRebalance] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  useEffect(() => {
    loadData();
  }, [strategyId]);

  const loadData = async () => {
    try {
      const [strategyRes, holdingsRes, snapshotsRes, stocksRes] = await Promise.all([
        api.get(`/strategies/${strategyId}`),
        api.get(`/holdings/strategy/${strategyId}`),
        api.get(`/strategies/${strategyId}/snapshots`),
        api.get(`/stocks`)
      ]);

      setStrategy(strategyRes.data);
      setHoldings(holdingsRes.data);
      setSnapshots(snapshotsRes.data);
      setStocks(stocksRes.data);

      // Load any pending rebalancing actions
      try {
        const pendingRes = await api.get(`/strategies/${strategyId}/rebalance/pending`);
        if (pendingRes.data.actions && pendingRes.data.actions.length > 0) {
          setRebalancingActions(pendingRes.data.actions);
        }
      } catch (err) {
        // It's OK if there are no pending actions
        console.log("No pending rebalancing actions");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load strategy",
        variant: "destructive",
      });
      router.push("/dashboard/strategies");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/strategies?edit=${strategyId}`);
  };

  const getStockName = (stockId: number) => {
    const stock = stocks.find((s) => s.id === stockId);
    return stock ? stock.name : 'Unknown';
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4" />;
    }
    return <ArrowDown className="h-4 w-4" />;
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this strategy?")) return;

    try {
      await api.delete(`/strategies/${strategyId}`);
      toast({
        title: "Success",
        description: "Strategy deleted successfully",
      });
      router.push("/dashboard/strategies");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete strategy",
        variant: "destructive",
      });
    }
  };

  const handleRebalance = async () => {
    setLoadingRebalance(true);
    try {
      const response = await api.post(`/strategies/${strategyId}/rebalance/calculate`);
      if (response.data.actions && response.data.actions.length > 0) {
        setRebalancingActions(response.data.actions);
        toast({
          title: "Rebalancing Calculated",
          description: `Found ${response.data.actions.length} actions needed`,
        });
      } else {
        setRebalancingActions([]);
        toast({
          title: "Strategy Already Balanced",
          description: "Your portfolio is within 1% of target allocations. No rebalancing needed.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to calculate rebalancing",
        variant: "destructive",
      });
    } finally {
      setLoadingRebalance(false);
    }
  };

  const handleExecuteRebalance = async () => {
    if (!confirm("Are you sure you want to execute these rebalancing actions? This will update your holdings.")) {
      return;
    }

    setExecutingRebalance(true);
    try {
      await api.post(`/strategies/${strategyId}/rebalance/execute`);
      
      toast({
        title: "Success",
        description: "Rebalancing executed successfully. Holdings have been updated.",
      });

      // Clear rebalancing actions
      setRebalancingActions([]);

      // Reload all data to show updated holdings and history
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to execute rebalancing",
        variant: "destructive",
      });
    } finally {
      setExecutingRebalance(false);
    }
  };

  if (loading) {
    return <div>Loading strategy details...</div>;
  }

  if (!strategy) {
    return <div>Strategy not found</div>;
  }

  // Aggregate holdings by stock (in case a stock appears in multiple portfolios)
  let aggregatedHoldings = holdings.reduce((acc, holding) => {
    const existingHolding = acc.find(h => h.stock_id === holding.stock_id);
    if (existingHolding) {
      // Calculate weighted average price
      const totalCost = (existingHolding.quantity * existingHolding.average_price) + 
                        (holding.quantity * holding.average_price);
      existingHolding.quantity += holding.quantity;
      existingHolding.average_price = totalCost / existingHolding.quantity;
    } else {
      // Add new holding (clone to avoid mutation)
      acc.push({ ...holding });
    }
    return acc;
  }, [] as Holding[]);

  // Calculate real-time current values
  const currentHoldingsValue = aggregatedHoldings.reduce((sum, h) => sum + (h.quantity * h.current_stock_price), 0);
  const currentTotalValue = currentHoldingsValue + strategy.remaining_cash;
  const currentPerformance = ((currentTotalValue - strategy.total_funds) / strategy.total_funds) * 100;

  // Apply sorting if active
  if (sortColumn && sortDirection) {
    aggregatedHoldings = [...aggregatedHoldings].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "quantity":
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case "purchase_price":
          aValue = a.average_price;
          bValue = b.average_price;
          break;
        case "current_price":
          aValue = a.current_stock_price;
          bValue = b.current_stock_price;
          break;
        case "change":
          aValue = ((a.current_stock_price - a.average_price) / a.average_price) * 100;
          bValue = ((b.current_stock_price - b.average_price) / b.average_price) * 100;
          break;
        case "current_value":
          aValue = a.quantity * a.current_stock_price;
          bValue = b.quantity * b.current_stock_price;
          break;
        case "allocation":
          aValue = ((a.quantity * a.current_stock_price) / currentHoldingsValue) * 100;
          bValue = ((b.quantity * b.current_stock_price) / currentHoldingsValue) * 100;
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">{strategy.name}</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/strategies/${strategyId}/history`)}>
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
          <Button variant="outline" onClick={handleRebalance} disabled={loadingRebalance}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingRebalance ? 'animate-spin' : ''}`} />
            {loadingRebalance ? 'Calculating...' : 'Calculate Rebalance'}
          </Button>
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Summary Section */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <Label className="text-xs text-muted-foreground">Initial Funds</Label>
              <p className="text-2xl font-bold mt-2">
                {strategy.total_funds.toFixed(2)} EGP
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Label className="text-xs text-muted-foreground">Current Value</Label>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {currentTotalValue.toFixed(2)} EGP
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Label className="text-xs text-muted-foreground">Remaining Cash</Label>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {strategy.remaining_cash.toFixed(2)} EGP
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Label className="text-xs text-muted-foreground">Performance</Label>
              <p className={`text-2xl font-bold mt-2 ${currentPerformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentPerformance >= 0 ? '+' : ''}{currentPerformance.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        {snapshots.length > 0 && (
          <PortfolioPerformanceChart
            data={snapshots.map(snapshot => ({
              date: snapshot.snapshot_date,
              value: snapshot.total_value
            }))}
            title="Strategy Performance Over Time"
            description={`Current value: ${currentTotalValue.toFixed(2)} EGP | Performance: ${currentPerformance >= 0 ? '+' : ''}${currentPerformance.toFixed(2)}%`}
          />
        )}

        {/* Rebalancing Actions Section - Only show if actions exist */}
        {rebalancingActions.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-orange-600" />
                Required Rebalancing Actions ({rebalancingActions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left">Stock</th>
                      <th className="px-4 py-3 text-left">Action</th>
                      <th className="px-4 py-3 text-right">Quantity</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rebalancingActions.map((action, index) => (
                      <tr key={index} className="border-t hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{action.stock_symbol || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">
                              {getStockName(action.stock_id)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            action.action?.toUpperCase() === 'BUY' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {action.action ? action.action.toUpperCase() : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {action.quantity || 0}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {action.price ? action.price.toFixed(2) : '0.00'} EGP
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {action.total_amount ? action.total_amount.toFixed(2) : '0.00'} EGP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Execute these actions to rebalance your strategy according to your target allocations.
                </p>
                <Button 
                  onClick={handleExecuteRebalance}
                  disabled={executingRebalance}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {executingRebalance ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Confirm & Execute Rebalancing
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Holdings Section */}
        <Card>
          <CardHeader>
            <CardTitle>Holdings ({aggregatedHoldings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {aggregatedHoldings.length === 0 ? (
              <p className="text-muted-foreground">No holdings found</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left">Stock</th>
                      <th className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 hover:bg-muted ml-auto flex"
                          onClick={() => handleSort("quantity")}
                        >
                          Qty
                          {getSortIcon("quantity")}
                        </Button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 hover:bg-muted ml-auto flex"
                          onClick={() => handleSort("purchase_price")}
                        >
                          Purchase Price
                          {getSortIcon("purchase_price")}
                        </Button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 hover:bg-muted ml-auto flex"
                          onClick={() => handleSort("current_price")}
                        >
                          Current Price
                          {getSortIcon("current_price")}
                        </Button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 hover:bg-muted ml-auto flex"
                          onClick={() => handleSort("change")}
                        >
                          Change
                          {getSortIcon("change")}
                        </Button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 hover:bg-muted ml-auto flex"
                          onClick={() => handleSort("current_value")}
                        >
                          Current Value
                          {getSortIcon("current_value")}
                        </Button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 hover:bg-muted ml-auto flex"
                          onClick={() => handleSort("allocation")}
                        >
                          Allocation %
                          {getSortIcon("allocation")}
                        </Button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatedHoldings.map((holding) => {
                      const currentValue = holding.quantity * holding.current_stock_price;
                      const priceDiff = holding.current_stock_price - holding.average_price;
                      const priceChangePercent = ((priceDiff / holding.average_price) * 100);
                      const isPositive = priceDiff >= 0;
                      const allocationPercent = (currentValue / currentHoldingsValue) * 100;
                      
                      return (
                        <tr key={holding.stock_symbol} className="border-t hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <StockLogo 
                                symbol={holding.stock_symbol} 
                                name={holding.stock_name}
                                logoUrl={holding.stock_logo_url}
                                size={32}
                              />
                              <div>
                                <div className="font-medium">{holding.stock_symbol}</div>
                                <div className="text-xs text-muted-foreground">
                                  {holding.stock_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{holding.quantity}</td>
                          <td className="px-4 py-3 text-right">{holding.average_price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">{holding.current_stock_price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {isPositive ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              <span className="font-medium">
                                {priceChangePercent.toFixed(2)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {currentValue.toFixed(2)} EGP
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-blue-600">
                            {allocationPercent.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted border-t-2">
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-right font-semibold">Holdings Value:</td>
                      <td className="px-4 py-3 text-right font-bold">
                        {aggregatedHoldings.reduce((sum, h) => sum + (h.quantity * h.current_stock_price), 0).toFixed(2)} EGP
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-right font-semibold">+ Remaining Cash:</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">
                        {strategy.remaining_cash.toFixed(2)} EGP
                      </td>
                    </tr>
                    <tr className="border-t-2">
                      <td colSpan={6} className="px-4 py-3 text-right font-semibold">Total Portfolio Value:</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600">
                        {currentTotalValue.toFixed(2)} EGP
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance History */}
        {snapshots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-right">Total Value</th>
                      <th className="px-4 py-3 text-right">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.slice(0, 10).map((snapshot) => (
                      <tr key={snapshot.id} className="border-t hover:bg-muted/50">
                        <td className="px-4 py-3">
                          {new Date(snapshot.snapshot_date).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {snapshot.total_value.toFixed(2)} EGP
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-medium ${snapshot.performance_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {snapshot.performance_percentage >= 0 ? '+' : ''}
                            {snapshot.performance_percentage.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Strategy Information */}
        <Card>
          <CardHeader>
            <CardTitle>Strategy Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Created</Label>
              <p className="text-lg">
                {new Date(strategy.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                Portfolio Allocations
              </Label>
              <p className="text-lg">{strategy.portfolio_allocations.length} portfolios</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

