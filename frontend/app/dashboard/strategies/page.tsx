"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { Plus, Trash2, RefreshCw, X, Eye, Edit } from "lucide-react";

interface Strategy {
  id: number;
  name: string;
  total_funds: number;
  remaining_cash: number;
  portfolio_allocations: any[];
  created_at: string;
}

interface Portfolio {
  id: number;
  name: string;
  stock_ids: number[];
}

interface Stock {
  id: number;
  symbol: string;
  name: string;
}

interface PortfolioAllocation {
  portfolio_id: number;
  percentage: number;
  stock_allocations: { [key: number]: number };
}

export default function StrategiesPage() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [strategyName, setStrategyName] = useState("");
  const [totalFunds, setTotalFunds] = useState("");
  const [portfolioAllocations, setPortfolioAllocations] = useState<PortfolioAllocation[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [strategiesRes, portfoliosRes, stocksRes, holdingsRes] = await Promise.all([
        api.get("/strategies"),
        api.get("/portfolios"),
        api.get("/stocks"),
        api.get("/holdings"),
      ]);
      setStrategies(strategiesRes.data);
      setPortfolios(portfoliosRes.data);
      setStocks(stocksRes.data);
      
      // Store holdings data for calculations
      (window as any).holdingsData = holdingsRes.data;
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStrategyCurrentValue = (strategyId: number) => {
    const holdingsData = (window as any).holdingsData || [];
    const strategyHoldings = holdingsData.filter((h: any) => h.strategy_id === strategyId);
    const holdingsValue = strategyHoldings.reduce((sum: number, h: any) => 
      sum + (h.quantity * h.current_stock_price), 0
    );
    const strategy = strategies.find(s => s.id === strategyId);
    return holdingsValue + (strategy?.remaining_cash || 0);
  };

  const getStrategyPerformance = (strategyId: number) => {
    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return 0;
    const currentValue = getStrategyCurrentValue(strategyId);
    return ((currentValue - strategy.total_funds) / strategy.total_funds) * 100;
  };

  const handleAddPortfolio = () => {
    if (!selectedPortfolioId) return;
    
    const portfolioId = parseInt(selectedPortfolioId);
    if (portfolioAllocations.some((pa) => pa.portfolio_id === portfolioId)) {
      toast({
        title: "Error",
        description: "Portfolio already added",
        variant: "destructive",
      });
      return;
    }

    const portfolio = portfolios.find((p) => p.id === portfolioId);
    if (!portfolio) return;

    // Initialize with equal allocation for each stock in the portfolio
    const stockAllocations: { [key: number]: number } = {};
    const equalAlloc = portfolio.stock_ids.length > 0 
      ? 100 / portfolio.stock_ids.length 
      : 100;
    
    portfolio.stock_ids.forEach((stockId) => {
      stockAllocations[stockId] = parseFloat(equalAlloc.toFixed(2));
    });

    setPortfolioAllocations([
      ...portfolioAllocations,
      {
        portfolio_id: portfolioId,
        percentage: 0,
        stock_allocations: stockAllocations,
      },
    ]);
    setSelectedPortfolioId("");
  };

  const handleRemovePortfolio = (portfolioId: number) => {
    setPortfolioAllocations(
      portfolioAllocations.filter((pa) => pa.portfolio_id !== portfolioId)
    );
  };

  const handlePortfolioPercentageChange = (portfolioId: number, value: string) => {
    const percentage = parseFloat(value) || 0;
    setPortfolioAllocations(
      portfolioAllocations.map((pa) =>
        pa.portfolio_id === portfolioId ? { ...pa, percentage } : pa
      )
    );
  };

  const handleStockAllocationChange = (
    portfolioId: number,
    stockId: number,
    value: string
  ) => {
    const allocation = parseFloat(value) || 0;
    setPortfolioAllocations(
      portfolioAllocations.map((pa) =>
        pa.portfolio_id === portfolioId
          ? {
              ...pa,
              stock_allocations: {
                ...pa.stock_allocations,
                [stockId]: allocation,
              },
            }
          : pa
      )
    );
  };

  const getTotalPortfolioPercentage = () => {
    return portfolioAllocations.reduce((sum, pa) => sum + pa.percentage, 0);
  };

  const getStockAllocTotal = (portfolioId: number) => {
    const pa = portfolioAllocations.find((p) => p.portfolio_id === portfolioId);
    if (!pa) return 0;
    return Object.values(pa.stock_allocations).reduce((sum, val) => sum + val, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!strategyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a strategy name",
        variant: "destructive",
      });
      return;
    }

    const funds = parseFloat(totalFunds);
    if (isNaN(funds) || funds <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount for total funds",
        variant: "destructive",
      });
      return;
    }

    if (portfolioAllocations.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one portfolio",
        variant: "destructive",
      });
      return;
    }

    const totalPercentage = getTotalPortfolioPercentage();
    if (Math.abs(totalPercentage - 100) > 0.01) {
      toast({
        title: "Error",
        description: `Portfolio allocations must sum to 100% (current: ${totalPercentage.toFixed(2)}%)`,
        variant: "destructive",
      });
      return;
    }

    // Validate stock allocations
    for (const pa of portfolioAllocations) {
      const stockTotal = getStockAllocTotal(pa.portfolio_id);
      if (Math.abs(stockTotal - 100) > 0.01) {
        const portfolio = portfolios.find((p) => p.id === pa.portfolio_id);
        toast({
          title: "Error",
          description: `Stock allocations in "${portfolio?.name}" must sum to 100% (current: ${stockTotal.toFixed(2)}%)`,
          variant: "destructive",
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.post("/strategies", {
        name: strategyName,
        total_funds: funds,
        portfolio_allocations: portfolioAllocations,
      });

      toast({
        title: "Success",
        description: "Strategy created successfully",
      });

      setDialogOpen(false);
      setStrategyName("");
      setTotalFunds("");
      setPortfolioAllocations([]);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create strategy",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = (strategy: Strategy) => {
    router.push(`/dashboard/strategies/${strategy.id}`);
  };

  const handleEdit = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setStrategyName(strategy.name);
    setTotalFunds(strategy.total_funds.toString());
    setPortfolioAllocations(strategy.portfolio_allocations.map(pa => ({
      portfolio_id: pa.portfolio_id,
      percentage: pa.percentage,
      stock_allocations: { ...pa.stock_allocations }
    })));
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingStrategy) return;

    if (!strategyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a strategy name",
        variant: "destructive",
      });
      return;
    }

    const funds = parseFloat(totalFunds);
    if (isNaN(funds) || funds <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount for total funds",
        variant: "destructive",
      });
      return;
    }

    if (portfolioAllocations.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one portfolio",
        variant: "destructive",
      });
      return;
    }

    const totalPercentage = getTotalPortfolioPercentage();
    if (Math.abs(totalPercentage - 100) > 0.01) {
      toast({
        title: "Error",
        description: `Portfolio allocations must sum to 100% (current: ${totalPercentage.toFixed(2)}%)`,
        variant: "destructive",
      });
      return;
    }

    // Validate stock allocations
    for (const pa of portfolioAllocations) {
      const stockTotal = getStockAllocTotal(pa.portfolio_id);
      if (Math.abs(stockTotal - 100) > 0.01) {
        const portfolio = portfolios.find((p) => p.id === pa.portfolio_id);
        toast({
          title: "Error",
          description: `Stock allocations in "${portfolio?.name}" must sum to 100% (current: ${stockTotal.toFixed(2)}%)`,
          variant: "destructive",
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.put(`/strategies/${editingStrategy.id}`, {
        name: strategyName,
        total_funds: funds,
        portfolio_allocations: portfolioAllocations,
      });

      toast({
        title: "Success",
        description: "Strategy updated successfully",
      });

      setEditDialogOpen(false);
      setEditingStrategy(null);
      setStrategyName("");
      setTotalFunds("");
      setPortfolioAllocations([]);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update strategy",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this strategy?")) return;

    try {
      await api.delete(`/strategies/${id}`);
      toast({
        title: "Success",
        description: "Strategy deleted successfully",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete strategy",
        variant: "destructive",
      });
    }
  };

  const handleRebalance = async (id: number) => {
    try {
      const response = await api.post(`/strategies/${id}/rebalance/calculate`);
      toast({
        title: "Rebalancing Calculated",
        description: `Found ${response.data.actions.length} actions needed`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to calculate rebalancing",
        variant: "destructive",
      });
    }
  };

  const getPortfolioName = (portfolioId: number) => {
    return portfolios.find((p) => p.id === portfolioId)?.name || `Portfolio #${portfolioId}`;
  };

  const getStockName = (stockId: number) => {
    const stock = stocks.find((s) => s.id === stockId);
    return stock ? `${stock.symbol} - ${stock.name}` : `Stock #${stockId}`;
  };

  if (loading) {
    return <div>Loading strategies...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Strategies</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Strategy
        </Button>
      </div>

      {strategies.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No strategies yet. Create a strategy to allocate your funds.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {strategies.map((strategy) => (
            <Card key={strategy.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{strategy.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(strategy)}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(strategy)}
                      title="Edit strategy"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(strategy.id)}
                      title="Delete strategy"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Initial Funds</p>
                    <p className="text-lg font-bold">
                      {strategy.total_funds.toFixed(2)} EGP
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Value</p>
                    <p className="text-lg font-bold text-blue-600">
                      {getStrategyCurrentValue(strategy.id).toFixed(2)} EGP
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Performance</p>
                  <p className={`text-lg font-bold ${getStrategyPerformance(strategy.id) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {getStrategyPerformance(strategy.id) >= 0 ? '+' : ''}
                    {getStrategyPerformance(strategy.id).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {strategy.portfolio_allocations.length} portfolios • 
                    Created: {new Date(strategy.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleRebalance(strategy.id)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Calculate Rebalance
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create Strategy</DialogTitle>
              <DialogDescription>
                Allocate your funds across portfolios and stocks.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Strategy Name</Label>
                  <Input
                    id="name"
                    placeholder="My Strategy"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="funds">Total Funds (EGP)</Label>
                  <Input
                    id="funds"
                    type="number"
                    step="0.01"
                    placeholder="10000"
                    value={totalFunds}
                    onChange={(e) => setTotalFunds(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Add Portfolio</Label>
                <div className="flex gap-2">
                  <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a portfolio" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios.map((portfolio) => (
                        <SelectItem key={portfolio.id} value={portfolio.id.toString()}>
                          {portfolio.name} ({portfolio.stock_ids.length} stocks)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddPortfolio}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {portfolioAllocations.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Portfolio Allocations</Label>
                    <span className={`text-sm ${Math.abs(getTotalPortfolioPercentage() - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                      Total: {getTotalPortfolioPercentage().toFixed(2)}%
                    </span>
                  </div>
                  
                  {portfolioAllocations.map((pa) => {
                    const portfolio = portfolios.find((p) => p.id === pa.portfolio_id);
                    if (!portfolio) return null;

                    return (
                      <Card key={pa.portfolio_id}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">
                              {getPortfolioName(pa.portfolio_id)}
                            </CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePortfolio(pa.portfolio_id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Label htmlFor={`portfolio-${pa.portfolio_id}`} className="text-sm">
                              Allocation %
                            </Label>
                            <Input
                              id={`portfolio-${pa.portfolio_id}`}
                              type="number"
                              step="0.01"
                              value={pa.percentage}
                              onChange={(e) =>
                                handlePortfolioPercentageChange(pa.portfolio_id, e.target.value)
                              }
                              className="w-24"
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-center mb-2">
                            <Label className="text-sm">Stock Allocations</Label>
                            <span className={`text-xs ${Math.abs(getStockAllocTotal(pa.portfolio_id) - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                              {getStockAllocTotal(pa.portfolio_id).toFixed(2)}%
                            </span>
                          </div>
                          {portfolio.stock_ids.map((stockId) => (
                            <div key={stockId} className="flex items-center justify-between gap-2 text-sm">
                              <span className="flex-1 truncate">{getStockName(stockId)}</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={pa.stock_allocations[stockId] || 0}
                                onChange={(e) =>
                                  handleStockAllocationChange(pa.portfolio_id, stockId, e.target.value)
                                }
                                className="w-20 h-8"
                              />
                              <span className="text-muted-foreground">%</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Strategy"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Strategy Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Strategy</DialogTitle>
              <DialogDescription>
                Update your strategy allocations and funds.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Strategy Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="My Strategy"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-funds">Total Funds (EGP)</Label>
                  <Input
                    id="edit-funds"
                    type="number"
                    step="0.01"
                    placeholder="10000"
                    value={totalFunds}
                    onChange={(e) => setTotalFunds(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Add Portfolio</Label>
                <div className="flex gap-2">
                  <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a portfolio" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios.map((portfolio) => (
                        <SelectItem key={portfolio.id} value={portfolio.id.toString()}>
                          {portfolio.name} ({portfolio.stock_ids.length} stocks)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddPortfolio}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {portfolioAllocations.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Portfolio Allocations</Label>
                    <span className={`text-sm ${Math.abs(getTotalPortfolioPercentage() - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                      Total: {getTotalPortfolioPercentage().toFixed(2)}%
                    </span>
                  </div>
                  
                  {portfolioAllocations.map((pa) => {
                    const portfolio = portfolios.find((p) => p.id === pa.portfolio_id);
                    if (!portfolio) return null;

                    return (
                      <Card key={pa.portfolio_id}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">
                              {getPortfolioName(pa.portfolio_id)}
                            </CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePortfolio(pa.portfolio_id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Label htmlFor={`edit-portfolio-${pa.portfolio_id}`} className="text-sm">
                              Allocation %
                            </Label>
                            <Input
                              id={`edit-portfolio-${pa.portfolio_id}`}
                              type="number"
                              step="0.01"
                              value={pa.percentage}
                              onChange={(e) =>
                                handlePortfolioPercentageChange(pa.portfolio_id, e.target.value)
                              }
                              className="w-24"
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-center mb-2">
                            <Label className="text-sm">Stock Allocations</Label>
                            <span className={`text-xs ${Math.abs(getStockAllocTotal(pa.portfolio_id) - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                              {getStockAllocTotal(pa.portfolio_id).toFixed(2)}%
                            </span>
                          </div>
                          {portfolio.stock_ids.map((stockId) => (
                            <div key={stockId} className="flex items-center justify-between gap-2 text-sm">
                              <span className="flex-1 truncate">{getStockName(stockId)}</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={pa.stock_allocations[stockId] || 0}
                                onChange={(e) =>
                                  handleStockAllocationChange(pa.portfolio_id, stockId, e.target.value)
                                }
                                className="w-20 h-8"
                              />
                              <span className="text-muted-foreground">%</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingStrategy(null);
                  setStrategyName("");
                  setTotalFunds("");
                  setPortfolioAllocations([]);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Updating..." : "Update Strategy"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

