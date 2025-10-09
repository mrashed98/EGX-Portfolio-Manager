"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { TrendSparkline } from "@/components/charts/TrendSparkline";
import api from "@/lib/api";
import { Plus, Trash2, X, Edit, Eye, TrendingUp, TrendingDown, Briefcase } from "lucide-react";

interface Portfolio {
  id: number;
  name: string;
  stock_ids: number[];
  created_at: string;
}

interface PortfolioPerformance {
  current_value: number;
  initial_value: number;
  change: number;
  change_percent: number;
  time_series: { date: string; value: number }[];
}

interface Stock {
  id: number;
  symbol: string;
  name: string;
  current_price: number;
}

export default function PortfoliosPage() {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [portfolioPerformances, setPortfolioPerformances] = useState<Record<number, PortfolioPerformance>>({});
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
  const [selectedStockIds, setSelectedStockIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const { toast } = useToast();

  // Stock search states
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [tvSearchDialogOpen, setTvSearchDialogOpen] = useState(false);
  const [tvSearchQuery, setTvSearchQuery] = useState("");
  const [tvSearchResults, setTvSearchResults] = useState<any[]>([]);
  const [tvSearching, setTvSearching] = useState(false);
  const [addingCustomStock, setAddingCustomStock] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [portfoliosRes, stocksRes] = await Promise.all([
        api.get("/portfolios"),
        api.get("/stocks"),
      ]);
      setPortfolios(portfoliosRes.data);
      setStocks(stocksRes.data);

      // Load performance data for each portfolio
      const performances: Record<number, PortfolioPerformance> = {};
      await Promise.all(
        portfoliosRes.data.map(async (portfolio: Portfolio) => {
          try {
            const perfRes = await api.get(`/portfolios/${portfolio.id}/performance`);
            performances[portfolio.id] = perfRes.data;
          } catch (error) {
            console.error(`Failed to load performance for portfolio ${portfolio.id}:`, error);
          }
        })
      );
      setPortfolioPerformances(performances);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = (stockId: number) => {
    if (!selectedStockIds.includes(stockId)) {
      setSelectedStockIds([...selectedStockIds, stockId]);
    }
  };

  const handleRemoveStock = (stockId: number) => {
    setSelectedStockIds(selectedStockIds.filter((id) => id !== stockId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!portfolioName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a portfolio name",
        variant: "destructive",
      });
      return;
    }

    if (selectedStockIds.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one stock",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/portfolios", {
        name: portfolioName,
        stock_ids: selectedStockIds,
      });

      toast({
        title: "Success",
        description: "Portfolio created successfully",
      });

      setDialogOpen(false);
      setPortfolioName("");
      setSelectedStockIds([]);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create portfolio",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = (portfolio: Portfolio) => {
    router.push(`/dashboard/portfolios/${portfolio.id}`);
  };

  const handleEdit = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setPortfolioName(portfolio.name);
    setSelectedStockIds([...portfolio.stock_ids]);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPortfolio) return;

    if (!portfolioName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a portfolio name",
        variant: "destructive",
      });
      return;
    }

    if (selectedStockIds.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one stock",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/portfolios/${editingPortfolio.id}`, {
        name: portfolioName,
        stock_ids: selectedStockIds,
      });

      toast({
        title: "Success",
        description: "Portfolio updated successfully",
      });

      setEditDialogOpen(false);
      setEditingPortfolio(null);
      setPortfolioName("");
      setSelectedStockIds([]);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update portfolio",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this portfolio?")) return;

    try {
      await api.delete(`/portfolios/${id}`);
      toast({
        title: "Success",
        description: "Portfolio deleted successfully",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete portfolio",
        variant: "destructive",
      });
    }
  };

  const getStockName = (stockId: number) => {
    const stock = stocks.find((s) => s.id === stockId);
    return stock ? `${stock.symbol} - ${stock.name}` : `Stock #${stockId}`;
  };

  const filteredStocks = stocks.filter((stock) => {
    if (!stockSearchQuery) return true;
    const query = stockSearchQuery.toLowerCase();
    return (
      stock.symbol.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query)
    );
  });

  const handleTvSearch = async () => {
    if (!tvSearchQuery || tvSearchQuery.trim().length < 1) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }

    setTvSearching(true);
    try {
      const response = await api.get(`/stocks/search?q=${encodeURIComponent(tvSearchQuery)}`);
      setTvSearchResults(response.data.results || []);

      if (response.data.results.length === 0) {
        toast({
          title: "No results",
          description: `No stocks found matching "${tvSearchQuery}"`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to search stocks",
        variant: "destructive",
      });
    } finally {
      setTvSearching(false);
    }
  };

  const handleAddCustomStock = async (symbol: string) => {
    setAddingCustomStock(true);
    try {
      const response = await api.post(`/stocks/add-custom?symbol=${symbol}`);

      toast({
        title: "Success",
        description: response.data.message,
      });

      await loadData();
      setTvSearchDialogOpen(false);
      setTvSearchQuery("");
      setTvSearchResults([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to add stock",
        variant: "destructive",
      });
    } finally {
      setAddingCustomStock(false);
    }
  };


  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Portfolios</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your stock portfolios
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Portfolio
        </Button>
      </div>

      {portfolios.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Briefcase className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No portfolios yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first portfolio to get started
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Portfolio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => {
            const performance = portfolioPerformances[portfolio.id];
            const value = performance?.current_value || 0;
            const changePercent = performance?.change_percent || 0;
            const isPositive = changePercent >= 0;
            const trendData = performance?.time_series || [];

            return (
              <Card
                key={portfolio.id}
                className="cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => handleView(portfolio)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {portfolio.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {portfolio.stock_ids.length} stocks
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(portfolio);
                        }}
                        title="Edit portfolio"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(portfolio.id);
                        }}
                        title="Delete portfolio"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">
                      {value.toFixed(2)} EGP
                    </div>
                    <Badge
                      variant="secondary"
                      className={`mt-2 ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="mr-1 h-3 w-3" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3" />
                      )}
                      {isPositive ? "+" : ""}
                      {changePercent.toFixed(2)}%
                    </Badge>
                  </div>

                  {trendData.length > 1 && (
                    <div className="pt-2">
                      <TrendSparkline
                        data={trendData.map((point) => point.value)}
                        color={isPositive ? "#16a34a" : "#dc2626"}
                        width={250}
                        height={50}
                      />
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Created: {new Date(portfolio.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Portfolio Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create Portfolio</DialogTitle>
              <DialogDescription>
                Create a new portfolio by adding stocks to it.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Portfolio Name</Label>
                <Input
                  id="name"
                  placeholder="My Portfolio"
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Add Stocks</Label>
                <Input
                  placeholder="Search stocks by symbol or name..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                />

                {stockSearchQuery && (
                  <div className="border rounded-md max-h-[200px] overflow-y-auto">
                    {filteredStocks.length > 0 ? (
                      <div className="divide-y">
                        {filteredStocks.slice(0, 10).map((stock) => (
                          <div
                            key={stock.id}
                            className="p-2 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between"
                            onClick={() => {
                              handleAddStock(stock.id);
                              setStockSearchQuery("");
                            }}
                          >
                            <div>
                              <div className="font-medium text-sm">
                                {stock.symbol}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {stock.name}
                              </div>
                            </div>
                            {selectedStockIds.includes(stock.id) && (
                              <Badge variant="secondary" className="text-green-600">
                                ✓ Added
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        No stocks found
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setTvSearchDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Search TradingView
                </Button>
              </div>

              {selectedStockIds.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Stocks ({selectedStockIds.length})</Label>
                  <div className="border rounded-md p-2 space-y-2 max-h-[200px] overflow-y-auto">
                    {selectedStockIds.map((stockId) => (
                      <div
                        key={stockId}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <span className="text-sm">{getStockName(stockId)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStock(stockId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
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
                {submitting ? "Creating..." : "Create Portfolio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Portfolio Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Portfolio</DialogTitle>
              <DialogDescription>
                Update your portfolio settings and stocks.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Portfolio Name</Label>
                <Input
                  id="edit-name"
                  placeholder="My Portfolio"
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Add Stocks</Label>
                <Input
                  placeholder="Search stocks by symbol or name..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                />

                {stockSearchQuery && (
                  <div className="border rounded-md max-h-[200px] overflow-y-auto">
                    {filteredStocks.length > 0 ? (
                      <div className="divide-y">
                        {filteredStocks.slice(0, 10).map((stock) => (
                          <div
                            key={stock.id}
                            className="p-2 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between"
                            onClick={() => {
                              handleAddStock(stock.id);
                              setStockSearchQuery("");
                            }}
                          >
                            <div>
                              <div className="font-medium text-sm">
                                {stock.symbol}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {stock.name}
                              </div>
                            </div>
                            {selectedStockIds.includes(stock.id) && (
                              <Badge variant="secondary" className="text-green-600">
                                ✓ Added
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        No stocks found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedStockIds.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Stocks ({selectedStockIds.length})</Label>
                  <div className="border rounded-md p-2 space-y-2 max-h-[200px] overflow-y-auto">
                    {selectedStockIds.map((stockId) => (
                      <div
                        key={stockId}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <span className="text-sm">{getStockName(stockId)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStock(stockId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingPortfolio(null);
                  setPortfolioName("");
                  setSelectedStockIds([]);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Updating..." : "Update Portfolio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* TradingView Search Dialog */}
      <Dialog open={tvSearchDialogOpen} onOpenChange={setTvSearchDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Search TradingView</DialogTitle>
            <DialogDescription>
              Search for EGX stocks on TradingView
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter stock symbol or name..."
                value={tvSearchQuery}
                onChange={(e) => setTvSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTvSearch()}
              />
              <Button onClick={handleTvSearch} disabled={tvSearching}>
                {tvSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            {tvSearchResults.length > 0 && (
              <div className="border rounded-md max-h-[400px] overflow-y-auto">
                <div className="divide-y">
                  {tvSearchResults.map((result) => (
                    <div
                      key={result.symbol}
                      className="p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{result.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {result.name}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddCustomStock(result.symbol)}
                          disabled={addingCustomStock}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTvSearchDialogOpen(false);
                setTvSearchQuery("");
                setTvSearchResults([]);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
