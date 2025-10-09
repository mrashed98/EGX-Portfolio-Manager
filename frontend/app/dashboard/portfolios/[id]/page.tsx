"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { PortfolioPerformanceChart } from "@/components/charts/PortfolioPerformanceChart";
import { SectorAllocationChart } from "@/components/charts/SectorAllocationChart";
import { StockLogo } from "@/components/StockLogo";
import api from "@/lib/api";
import { ArrowLeft, Edit, Trash2, Plus, X, History, TrendingUp, TrendingDown } from "lucide-react";

interface Portfolio {
  id: number;
  name: string;
  stock_ids: number[];
  created_at: string;
}

interface Stock {
  id: number;
  symbol: string;
  name: string;
  current_price: number;
  logo_url?: string | null;
}

interface PerformanceData {
  current_value: number;
  initial_value: number;
  change: number;
  change_percent: number;
  initial_date: string;
  time_series: { date: string; value: number }[];
  stock_count: number;
}

interface SectorAllocation {
  sector: string;
  allocation_percent: number;
  stock_count: number;
  avg_change_percent: number;
  stocks: any[];
}

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const portfolioId = parseInt(params.id as string);

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [sectorAllocation, setSectorAllocation] = useState<SectorAllocation[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolioStocks, setPortfolioStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
  const [selectedStockIds, setSelectedStockIds] = useState<number[]>([]);
  const [selectedStockId, setSelectedStockId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  
  // Stock search states
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [tvSearchDialogOpen, setTvSearchDialogOpen] = useState(false);
  const [tvSearchQuery, setTvSearchQuery] = useState("");
  const [tvSearchResults, setTvSearchResults] = useState<any[]>([]);
  const [tvSearching, setTvSearching] = useState(false);
  const [addingCustomStock, setAddingCustomStock] = useState(false);

  useEffect(() => {
    loadData();
  }, [portfolioId]);

  const loadData = async () => {
    try {
      const [portfolioRes, stocksRes, performanceRes, sectorRes] = await Promise.all([
        api.get(`/portfolios/${portfolioId}`),
        api.get("/stocks"),
        api.get(`/portfolios/${portfolioId}/performance`),
        api.get(`/portfolios/${portfolioId}/sector-allocation`),
      ]);

      setPortfolio(portfolioRes.data);
      setStocks(stocksRes.data);
      setPerformance(performanceRes.data);
      setSectorAllocation(sectorRes.data);

      // Filter stocks that are in this portfolio
      const portfolioStocksList = stocksRes.data.filter((stock: Stock) =>
        portfolioRes.data.stock_ids.includes(stock.id)
      );
      setPortfolioStocks(portfolioStocksList);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load portfolio",
        variant: "destructive",
      });
      router.push("/dashboard/portfolios");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (portfolio) {
      setPortfolioName(portfolio.name);
      setSelectedStockIds([...portfolio.stock_ids]);
      setEditDialogOpen(true);
    }
  };

  const handleAddStock = () => {
    if (selectedStockId && !selectedStockIds.includes(parseInt(selectedStockId))) {
      setSelectedStockIds([...selectedStockIds, parseInt(selectedStockId)]);
      setSelectedStockId("");
    }
  };

  const handleRemoveStock = (stockId: number) => {
    setSelectedStockIds(selectedStockIds.filter((id) => id !== stockId));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
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
      await api.put(`/portfolios/${portfolioId}`, {
        name: portfolioName,
        stock_ids: selectedStockIds,
      });

      toast({
        title: "Success",
        description: "Portfolio updated successfully",
      });

      setEditDialogOpen(false);
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this portfolio?")) return;

    try {
      await api.delete(`/portfolios/${portfolioId}`);
      toast({
        title: "Success",
        description: "Portfolio deleted successfully",
      });
      router.push("/dashboard/portfolios");
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
  
  // Filter stocks based on search query
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
      
      // Reload stocks
      await loadData();
      
      // Close dialog
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
    return <div>Loading portfolio details...</div>;
  }

  if (!portfolio) {
    return <div>Portfolio not found</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">{portfolio.name}</h1>
        <div className="ml-auto flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/dashboard/portfolios/${portfolioId}/history`)}
          >
            <History className="mr-2 h-4 w-4" />
            History
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
        {/* Performance Overview */}
        {performance && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total Change</p>
                  <p className={`text-3xl font-bold ${performance.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {performance.change >= 0 ? '+' : ''}{performance.change.toFixed(2)} EGP
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Since {new Date(performance.initial_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Change Percentage</p>
                  <div className="flex items-center gap-2">
                    {performance.change_percent >= 0 ? (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    )}
                    <p className={`text-3xl font-bold ${performance.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {performance.change_percent >= 0 ? '+' : ''}{performance.change_percent.toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge 
                    variant={performance.change >= 0 ? "default" : "secondary"}
                    className={`text-lg px-3 py-1 ${performance.change >= 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {performance.change >= 0 ? 'Profitable' : 'Loss'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    {performance.stock_count} stocks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {performance && performance.time_series.length > 0 && (
            <PortfolioPerformanceChart
              data={performance.time_series}
              title="Portfolio Change Over Time"
              description={`Total change: ${performance.change >= 0 ? '+' : ''}${performance.change.toFixed(2)} EGP (${performance.change_percent >= 0 ? '+' : ''}${performance.change_percent.toFixed(2)}%)`}
            />
          )}
          {sectorAllocation.length > 0 && (
            <SectorAllocationChart
              data={sectorAllocation}
              title="Sector Allocation"
              description="Equal-weight distribution by sector"
            />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Created</Label>
              <p className="text-lg">
                {new Date(portfolio.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                Number of Stocks
              </Label>
              <p className="text-lg">{portfolio.stock_ids.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stocks ({portfolioStocks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {portfolioStocks.length === 0 ? (
              <p className="text-muted-foreground">No stocks in this portfolio</p>
            ) : (
              <div className="space-y-3">
                {portfolioStocks.map((stock) => (
                  <div
                    key={stock.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <StockLogo 
                        symbol={stock.symbol}
                        name={stock.name}
                        logoUrl={stock.logo_url}
                        size={40}
                      />
                      <div>
                        <div className="font-semibold">{stock.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {stock.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {stock.current_price.toFixed(2)} EGP
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Current Price
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Portfolio Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Portfolio</DialogTitle>
              <DialogDescription>
                Update your portfolio by modifying stocks or name.
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
                
                {/* Search input for filtering stocks */}
                <Input
                  placeholder="Search stocks by symbol or name..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                />
                
                {/* Real-time search results */}
                {stockSearchQuery && (
                  <div className="border rounded-md max-h-[200px] overflow-y-auto">
                    {filteredStocks.length > 0 ? (
                      <div className="divide-y">
                        {filteredStocks.slice(0, 10).map((stock) => (
                          <div
                            key={stock.id}
                            className="p-2 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between"
                            onClick={() => {
                              if (!selectedStockIds.includes(stock.id)) {
                                setSelectedStockIds([...selectedStockIds, stock.id]);
                                setStockSearchQuery("");
                              }
                            }}
                          >
                            <div>
                              <div className="font-medium text-sm">{stock.symbol}</div>
                              <div className="text-xs text-muted-foreground">{stock.name}</div>
                            </div>
                            {selectedStockIds.includes(stock.id) && (
                              <span className="text-xs text-green-600">✓ Added</span>
                            )}
                          </div>
                        ))}
                        {filteredStocks.length > 10 && (
                          <div className="p-2 text-xs text-muted-foreground text-center">
                            +{filteredStocks.length - 10} more results
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        No stocks found matching "{stockSearchQuery}"
                      </div>
                    )}
                  </div>
                )}
                
                {/* Button to search TradingView */}
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full"
                  onClick={() => setTvSearchDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Search & Add from TradingView
                </Button>
              </div>

              {selectedStockIds.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Stocks ({selectedStockIds.length})</Label>
                  <div className="border rounded-md p-2 space-y-2 max-h-[300px] overflow-y-auto">
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
                onClick={() => setEditDialogOpen(false)}
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
            <DialogTitle>Search & Add Stock from TradingView</DialogTitle>
            <DialogDescription>
              Search for EGX stocks on TradingView and add them to your database
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter stock symbol or company name..."
                value={tvSearchQuery}
                onChange={(e) => setTvSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTvSearch();
                  }
                }}
              />
              <Button 
                onClick={handleTvSearch}
                disabled={tvSearching}
              >
                {tvSearching ? "Searching..." : "Search"}
              </Button>
            </div>
            
            {/* Search Results */}
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
                          <div className="text-xs text-muted-foreground mt-1">
                            {result.sector && `${result.sector}`}
                            {result.sector && result.industry && ' • '}
                            {result.industry && `${result.industry}`}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-medium">
                            {result.price?.toFixed(2)} EGP
                          </div>
                          {result.change_percent !== undefined && (
                            <div className={`text-sm ${result.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.change_percent >= 0 ? '+' : ''}{result.change_percent.toFixed(2)}%
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="ml-4"
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
            
            {tvSearching && (
              <div className="text-center py-8 text-muted-foreground">
                Searching TradingView...
              </div>
            )}
            
            {!tvSearching && tvSearchResults.length === 0 && tvSearchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                No results found. Try a different search term.
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

