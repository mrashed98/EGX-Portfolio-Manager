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
import { Plus, Trash2, X, Edit, Eye } from "lucide-react";

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
}

export default function PortfoliosPage() {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
  const [selectedStockIds, setSelectedStockIds] = useState<number[]>([]);
  const [selectedStockId, setSelectedStockId] = useState<string>("");
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
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
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
        description: "Portfolio updated successfully. Affected strategies will be rebalanced.",
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
    return <div>Loading portfolios...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Portfolios</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Portfolio
        </Button>
      </div>

      {portfolios.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No portfolios yet. Create your first portfolio to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{portfolio.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(portfolio)}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(portfolio)}
                      title="Edit portfolio"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(portfolio.id)}
                      title="Delete portfolio"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {portfolio.stock_ids.length} stocks
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Created: {new Date(portfolio.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
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

