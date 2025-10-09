"use client";

import { useEffect, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { StockLogo } from "@/components/StockLogo";
import { TrendSparkline } from "@/components/charts/TrendSparkline";
import api from "@/lib/api";
import { Plus, Trash2, X, Eye, TrendingUp, TrendingDown } from "lucide-react";

interface Watchlist {
  id: number;
  name: string;
  stock_ids: number[];
}

interface Stock {
  id: number;
  symbol: string;
  name: string;
  current_price: number;
  change_percent?: number | null;
  logo_url?: string | null;
}

export default function WatchlistsPage() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [watchlistName, setWatchlistName] = useState("");
  const [selectedStockIds, setSelectedStockIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingWatchlist, setEditingWatchlist] = useState<Watchlist | null>(null);
  const [viewingWatchlist, setViewingWatchlist] = useState<Watchlist | null>(null);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [watchlistsRes, stocksRes] = await Promise.all([
        api.get("/watchlists"),
        api.get("/stocks"),
      ]);
      setWatchlists(watchlistsRes.data);
      setStocks(stocksRes.data);
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

    if (!watchlistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a watchlist name",
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
      await api.post("/watchlists", {
        name: watchlistName,
        stock_ids: selectedStockIds,
      });

      toast({
        title: "Success",
        description: "Watchlist created successfully",
      });

      setDialogOpen(false);
      setWatchlistName("");
      setSelectedStockIds([]);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to create watchlist",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (watchlist: Watchlist) => {
    setEditingWatchlist(watchlist);
    setWatchlistName(watchlist.name);
    setSelectedStockIds([...watchlist.stock_ids]);
    setEditDialogOpen(true);
  };

  const handleView = (watchlist: Watchlist) => {
    setViewingWatchlist(watchlist);
    setViewDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingWatchlist) return;

    if (!watchlistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a watchlist name",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/watchlists/${editingWatchlist.id}`, {
        name: watchlistName,
        stock_ids: selectedStockIds,
      });

      toast({
        title: "Success",
        description: "Watchlist updated successfully",
      });

      setEditDialogOpen(false);
      setEditingWatchlist(null);
      setWatchlistName("");
      setSelectedStockIds([]);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to update watchlist",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this watchlist?")) return;

    try {
      await api.delete(`/watchlists/${id}`);
      toast({
        title: "Success",
        description: "Watchlist deleted successfully",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete watchlist",
        variant: "destructive",
      });
    }
  };

  const getStockName = (stockId: number) => {
    const stock = stocks.find((s) => s.id === stockId);
    return stock ? `${stock.symbol} - ${stock.name}` : `Stock #${stockId}`;
  };

  const getStockInfo = (stockId: number) => {
    return stocks.find((s) => s.id === stockId);
  };

  const filteredStocks = stocks.filter((stock) => {
    if (!stockSearchQuery) return true;
    const query = stockSearchQuery.toLowerCase();
    return (
      stock.symbol.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query)
    );
  });

  // Calculate watchlist stats
  const getWatchlistValue = (watchlist: Watchlist) => {
    return watchlist.stock_ids.reduce((sum, stockId) => {
      const stock = stocks.find((s) => s.id === stockId);
      return sum + (stock?.current_price || 0);
    }, 0);
  };

  const getWatchlistChange = (watchlist: Watchlist) => {
    const changes = watchlist.stock_ids.map((stockId) => {
      const stock = stocks.find((s) => s.id === stockId);
      return stock?.change_percent || 0;
    });
    return changes.length > 0
      ? changes.reduce((sum, c) => sum + c, 0) / changes.length
      : 0;
  };

  const generateTrendData = (value: number) => {
    return Array.from({ length: 10 }, () =>
      Math.max(0, value * (0.95 + Math.random() * 0.1))
    );
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
          <h1 className="text-4xl font-bold tracking-tight">Watchlists</h1>
          <p className="text-muted-foreground mt-2">
            Track and monitor your favorite stocks
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Watchlist
        </Button>
      </div>

      {watchlists.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Eye className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No watchlists yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a watchlist to track stocks you're interested in
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Watchlist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {watchlists.map((watchlist) => {
            const avgChange = getWatchlistChange(watchlist);
            const isPositive = avgChange >= 0;
            const trendData = generateTrendData(100);

            return (
              <Card
                key={watchlist.id}
                className="cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => handleView(watchlist)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {watchlist.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {watchlist.stock_ids.length} stocks
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(watchlist);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(watchlist.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Avg Change</div>
                    <Badge
                      variant="secondary"
                      className={`mt-1 ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="mr-1 h-3 w-3" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3" />
                      )}
                      {isPositive ? "+" : ""}
                      {avgChange.toFixed(2)}%
                    </Badge>
                  </div>

                  {trendData.length > 0 && (
                    <div className="pt-2">
                      <TrendSparkline
                        data={trendData}
                        color={isPositive ? "#16a34a" : "#dc2626"}
                        width={250}
                        height={50}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Watchlist Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create Watchlist</DialogTitle>
              <DialogDescription>
                Create a new watchlist to track stocks
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Watchlist Name</Label>
                <Input
                  id="name"
                  placeholder="My Watchlist"
                  value={watchlistName}
                  onChange={(e) => setWatchlistName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Add Stocks</Label>
                <Input
                  placeholder="Search stocks..."
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
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Watchlist"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Watchlist Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Watchlist</DialogTitle>
              <DialogDescription>Update your watchlist</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Watchlist Name</Label>
                <Input
                  id="edit-name"
                  placeholder="My Watchlist"
                  value={watchlistName}
                  onChange={(e) => setWatchlistName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Add Stocks</Label>
                <Input
                  placeholder="Search stocks..."
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
                  setEditingWatchlist(null);
                  setWatchlistName("");
                  setSelectedStockIds([]);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Updating..." : "Update Watchlist"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Watchlist Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingWatchlist?.name}</DialogTitle>
            <DialogDescription>
              Stocks in this watchlist ({viewingWatchlist?.stock_ids.length || 0})
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {viewingWatchlist && viewingWatchlist.stock_ids.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingWatchlist.stock_ids.map((stockId) => {
                    const stock = getStockInfo(stockId);
                    if (!stock) return null;
                    const isPositive = (stock.change_percent || 0) >= 0;

                    return (
                      <TableRow key={stockId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <StockLogo
                              symbol={stock.symbol}
                              name={stock.name}
                              logoUrl={stock.logo_url}
                              size={32}
                            />
                            <div>
                              <div className="font-medium">{stock.symbol}</div>
                              <div className="text-sm text-muted-foreground">
                                {stock.name}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {stock.current_price.toFixed(2)} EGP
                        </TableCell>
                        <TableCell className="text-right">
                          {stock.change_percent !== null &&
                          stock.change_percent !== undefined ? (
                            <Badge
                              variant="secondary"
                              className={`${
                                isPositive ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {stock.change_percent.toFixed(2)}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No stocks in this watchlist
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
