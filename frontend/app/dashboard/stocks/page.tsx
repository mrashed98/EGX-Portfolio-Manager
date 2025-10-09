"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import api from "@/lib/api";
import { RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown, Download, Plus } from "lucide-react";

interface Stock {
  id: number;
  symbol: string;
  name: string;
  exchange: string;
  current_price: number;
  logo_url?: string | null;
  last_updated: string;
  change?: number | null;
  change_percent?: number | null;
  volume?: number | null;
}

type SortColumn = "exchange" | "current_price" | "last_updated" | "change_percent" | "volume";
type SortDirection = "asc" | "desc" | null;

export default function StocksPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const { toast } = useToast();
  
  // TradingView search states
  const [tvSearchDialogOpen, setTvSearchDialogOpen] = useState(false);
  const [tvSearchQuery, setTvSearchQuery] = useState("");
  const [tvSearchResults, setTvSearchResults] = useState<any[]>([]);
  const [tvSearching, setTvSearching] = useState(false);
  const [addingCustomStock, setAddingCustomStock] = useState(false);

  useEffect(() => {
    loadStocks();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadStocks, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = stocks;
    
    // Apply search filter
    if (search) {
      filtered = stocks.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
          stock.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply sorting
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = a[sortColumn];
        let bValue: any = b[sortColumn];
        
        // Convert to Date for last_updated
        if (sortColumn === "last_updated") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        
        if (sortDirection === "asc") {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }
    
    setFilteredStocks(filtered);
  }, [search, stocks, sortColumn, sortDirection]);

  const loadStocks = async () => {
    try {
      const response = await api.get("/stocks");
      setStocks(response.data);
      setFilteredStocks(response.data);
    } catch (error) {
      console.error("Failed to load stocks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: SortColumn) => {
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

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4" />;
    }
    return <ArrowDown className="h-4 w-4" />;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.post("/stocks/refresh");
      await loadStocks();
      toast({
        title: "Success",
        description: "Stock prices refreshed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to refresh stock prices",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSync = async () => {
    setRefreshing(true);
    try {
      const response = await api.post("/stocks/sync");
      await loadStocks();
      toast({
        title: "Success",
        description: `Synced stocks from TradingView. Added: ${response.data.added}, Updated: ${response.data.updated}, Total: ${response.data.total}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sync stocks from TradingView",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };
  
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
      await loadStocks();
      
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
    return <div>Loading stocks...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">EGX Stocks</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setTvSearchDialogOpen(true)} 
            variant="secondary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Stock
          </Button>
          <Button onClick={handleSync} disabled={refreshing} variant="outline">
            <Download className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Sync All Stocks
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Prices
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search stocks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-muted"
                    onClick={() => handleSort("exchange")}
                  >
                    Exchange
                    {getSortIcon("exchange")}
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
                    onClick={() => handleSort("change_percent")}
                  >
                    Change
                    {getSortIcon("change_percent")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-muted ml-auto flex"
                    onClick={() => handleSort("volume")}
                  >
                    Volume
                    {getSortIcon("volume")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-muted"
                    onClick={() => handleSort("last_updated")}
                  >
                    Last Updated
                    {getSortIcon("last_updated")}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStocks.map((stock) => (
                <TableRow 
                  key={stock.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/dashboard/stocks/${stock.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <StockLogo 
                        symbol={stock.symbol} 
                        name={stock.name}
                        logoUrl={stock.logo_url}
                        size={32}
                      />
                      <span>{stock.symbol}</span>
                    </div>
                  </TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell>{stock.exchange}</TableCell>
                  <TableCell className="text-right">
                    {stock.current_price.toFixed(2)} EGP
                  </TableCell>
                  <TableCell className="text-right">
                    {stock.change_percent !== null && stock.change_percent !== undefined ? (
                      <div className="flex flex-col items-end">
                        <span className={`font-medium ${stock.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                        </span>
                        {stock.change !== null && stock.change !== undefined && (
                          <span className={`text-xs ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} EGP
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {stock.volume !== null && stock.volume !== undefined ? (
                      <span className="font-mono text-sm">
                        {stock.volume.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(stock.last_updated).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
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

