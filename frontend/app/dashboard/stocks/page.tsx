"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { StatCard } from "@/components/analytics/StatCard";
import { TrendSparkline } from "@/components/charts/TrendSparkline";
import api from "@/lib/api";
import {
  RefreshCw,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
} from "lucide-react";

interface Stock {
  id: number;
  symbol: string;
  name: string;
  exchange: string;
  current_price: number;
  logo_url?: string | null;
  sector?: string | null;
  industry?: string | null;
  last_updated: string;
  change?: number | null;
  change_percent?: number | null;
  volume?: number | null;
}

type SortColumn =
  | "exchange"
  | "current_price"
  | "last_updated"
  | "change_percent"
  | "volume";
type SortDirection = "asc" | "desc" | null;

const SCREENER_FILTERS = [
  { id: "all", label: "All Stocks", icon: BarChart3 },
  { id: "top_gainers", label: "Top Gainers", icon: TrendingUp },
  { id: "biggest_losers", label: "Biggest Losers", icon: TrendingDown },
  { id: "high_volume", label: "High Volume", icon: Activity },
  { id: "large_cap", label: "Large Cap", icon: TrendingUp },
  { id: "small_cap", label: "Small Cap", icon: TrendingDown },
];

export default function StocksPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
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
    applyFilters();
  }, [search, stocks, sortColumn, sortDirection, selectedFilter]);

  const loadStocks = async () => {
    try {
      const response = await api.get("/stocks");
      setStocks(response.data);
    } catch (error) {
      console.error("Failed to load stocks:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = stocks;

    // Apply search filter
    if (search) {
      filtered = filtered.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
          stock.name.toLowerCase().includes(search.toLowerCase()) ||
          stock.sector?.toLowerCase().includes(search.toLowerCase()) ||
          stock.industry?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply screener filters
    if (selectedFilter !== "all") {
      filtered = applyScreenerFilter(filtered, selectedFilter);
    }

    // Apply sorting
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = a[sortColumn];
        let bValue: any = b[sortColumn];

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
  };

  const applyScreenerFilter = (stocks: Stock[], filterId: string) => {
    switch (filterId) {
      case "top_gainers":
        return stocks
          .filter((s) => s.change_percent !== null && s.change_percent! > 0)
          .sort((a, b) => (b.change_percent || 0) - (a.change_percent || 0))
          .slice(0, 20);
      case "biggest_losers":
        return stocks
          .filter((s) => s.change_percent !== null && s.change_percent! < 0)
          .sort((a, b) => (a.change_percent || 0) - (b.change_percent || 0))
          .slice(0, 20);
      case "high_volume":
        return stocks
          .filter((s) => s.volume !== null)
          .sort((a, b) => (b.volume || 0) - (a.volume || 0))
          .slice(0, 20);
      case "large_cap":
        return stocks
          .filter((s) => s.current_price > 50)
          .sort((a, b) => b.current_price - a.current_price);
      case "small_cap":
        return stocks
          .filter((s) => s.current_price <= 10)
          .sort((a, b) => a.current_price - b.current_price);
      default:
        return stocks;
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
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
      return <ArrowUpDown className="h-4 w-4 ml-2" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4 ml-2" />;
    }
    return <ArrowDown className="h-4 w-4 ml-2" />;
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
      const response = await api.get(
        `/stocks/search?q=${encodeURIComponent(tvSearchQuery)}`
      );
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

      await loadStocks();
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

  // Calculate market stats
  const marketStats = {
    totalStocks: stocks.length,
    avgChange:
      stocks.reduce((sum, s) => sum + (s.change_percent || 0), 0) / stocks.length || 0,
    gainers: stocks.filter((s) => (s.change_percent || 0) > 0).length,
    losers: stocks.filter((s) => (s.change_percent || 0) < 0).length,
    totalVolume: stocks.reduce((sum, s) => sum + (s.volume || 0), 0),
  };

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">EGX Stocks</h1>
          <p className="text-muted-foreground mt-2">
            Browse and manage Egyptian Exchange stocks
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setTvSearchDialogOpen(true)} variant="secondary">
            <Plus className="mr-2 h-4 w-4" />
            Add Stock
          </Button>
          <Button onClick={handleSync} disabled={refreshing} variant="outline">
            <Download
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Sync All
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Market Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Stocks"
          value={marketStats.totalStocks}
          icon={BarChart3}
          description={`${marketStats.gainers} up, ${marketStats.losers} down`}
        />
        <StatCard
          title="Avg Change"
          value={`${marketStats.avgChange.toFixed(2)}%`}
          change={marketStats.avgChange}
          icon={marketStats.avgChange >= 0 ? TrendingUp : TrendingDown}
          trend={marketStats.avgChange >= 0 ? "up" : "down"}
        />
        <StatCard
          title="Gainers"
          value={marketStats.gainers}
          icon={TrendingUp}
          description="stocks in green"
          trend="up"
        />
        <StatCard
          title="Total Volume"
          value={marketStats.totalVolume.toLocaleString()}
          icon={Activity}
          description="shares traded"
        />
      </div>

      {/* Filter Chips */}
      <Card>
        <CardHeader>
          <CardTitle>Market Screeners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SCREENER_FILTERS.map((filter) => {
              const Icon = filter.icon;
              return (
                <Badge
                  key={filter.id}
                  variant={selectedFilter === filter.id ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2 text-sm"
                  onClick={() => setSelectedFilter(filter.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {filter.label}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stocks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">
              {filteredStocks.length} of {stocks.length} stocks
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
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
                      className="h-8 px-2 ml-auto flex"
                      onClick={() => handleSort("current_price")}
                    >
                      Price
                      {getSortIcon("current_price")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 ml-auto flex"
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
                      className="h-8 px-2 ml-auto flex"
                      onClick={() => handleSort("volume")}
                    >
                      Volume
                      {getSortIcon("volume")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStocks.map((stock) => {
                  const isPositive = (stock.change_percent || 0) >= 0;
                  // Generate mock trend data for visualization
                  const trendData = Array.from({ length: 10 }, (_, i) =>
                    Math.max(
                      0,
                      stock.current_price * (0.95 + Math.random() * 0.1)
                    )
                  );

                  return (
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
                      <TableCell>
                        <div>
                          <div className="font-medium">{stock.name}</div>
                          {stock.sector && (
                            <div className="text-xs text-muted-foreground">
                              {stock.sector}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{stock.exchange}</Badge>
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
                      <TableCell className="text-right font-mono text-sm">
                        {stock.volume !== null && stock.volume !== undefined ? (
                          stock.volume.toLocaleString()
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <TrendSparkline
                          data={trendData}
                          color={isPositive ? "#16a34a" : "#dc2626"}
                          width={80}
                          height={30}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
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
                  if (e.key === "Enter") {
                    handleTvSearch();
                  }
                }}
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
                          <div className="text-xs text-muted-foreground mt-1">
                            {result.sector && `${result.sector}`}
                            {result.sector && result.industry && " • "}
                            {result.industry && `${result.industry}`}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-medium">
                            {result.price?.toFixed(2)} EGP
                          </div>
                          {result.change_percent !== undefined && (
                            <div
                              className={`text-sm ${
                                result.change_percent >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {result.change_percent >= 0 ? "+" : ""}
                              {result.change_percent.toFixed(2)}%
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

            {!tvSearching &&
              tvSearchResults.length === 0 &&
              tvSearchQuery && (
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
