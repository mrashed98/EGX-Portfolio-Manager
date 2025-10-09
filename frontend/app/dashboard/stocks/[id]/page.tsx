"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockLogo } from "@/components/StockLogo";
import { StatCard } from "@/components/analytics/StatCard";
import { PortfolioChart } from "@/components/charts/PortfolioChart";
import { RecommendationChart } from "@/components/charts/RecommendationChart";
import api from "@/lib/api";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Calendar,
  Building2,
} from "lucide-react";

interface StockDetail {
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
  open_price?: number | null;
  high_price?: number | null;
  low_price?: number | null;
  recommendation?: string | null;
}

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const stockId = parseInt(params.id as string);

  const [stock, setStock] = useState<StockDetail | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("1M");

  useEffect(() => {
    loadStockDetail();
  }, [stockId]);

  useEffect(() => {
    if (stock) {
      loadPriceHistory();
    }
  }, [selectedPeriod, stock]);

  const loadStockDetail = async () => {
    try {
      const response = await api.get(`/stocks/${stockId}`);
      setStock(response.data);
    } catch (error) {
      console.error("Failed to load stock detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPriceHistory = async () => {
    if (!stock) return;
    
    setLoadingChart(true);
    try {
      const response = await api.get(`/stocks/${stockId}/history`, {
        params: {
          interval: "1D",
          range: selectedPeriod,
        },
      });

      // Transform the data for the chart
      const history = response.data.data.map((item: any) => ({
        date: item.date,
        value: item.close,
        open: item.open,
        high: item.high,
        low: item.low,
        volume: item.volume,
      }));

      setPriceHistory(history);
    } catch (error) {
      console.error("Failed to load price history:", error);
    } finally {
      setLoadingChart(false);
    }
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
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Stock not found</p>
        <Button
          onClick={() => router.push("/dashboard/stocks")}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Stocks
        </Button>
      </div>
    );
  }

  const isPositive = (stock.change_percent || 0) >= 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/stocks")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Stocks
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <StockLogo
              symbol={stock.symbol}
              name={stock.name}
              logoUrl={stock.logo_url}
              size={64}
            />
            <div>
              <h1 className="text-4xl font-bold">{stock.symbol}</h1>
              <p className="text-xl text-muted-foreground mt-1">
                {stock.name}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{stock.exchange}</Badge>
                {stock.sector && (
                  <Badge variant="secondary">{stock.sector}</Badge>
                )}
                {stock.recommendation && (
                  <Badge
                    variant="default"
                    className={
                      stock.recommendation.toLowerCase().includes("buy")
                        ? "bg-green-600"
                        : stock.recommendation.toLowerCase().includes("sell")
                        ? "bg-red-600"
                        : ""
                    }
                  >
                    {stock.recommendation}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold">
              {stock.current_price.toFixed(2)} EGP
            </div>
            {stock.change_percent !== undefined && stock.change_percent !== null && (
              <Badge
                variant="secondary"
                className={`mt-2 text-lg ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                {isPositive ? "+" : ""}
                {stock.change_percent.toFixed(2)}%
                {stock.change !== undefined && stock.change !== null && (
                  <span className="ml-2">
                    ({isPositive ? "+" : ""}
                    {stock.change.toFixed(2)} EGP)
                  </span>
                )}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Open"
          value={`${(stock.open_price || stock.current_price).toFixed(2)} EGP`}
          icon={DollarSign}
          description="Today's opening price"
        />
        <StatCard
          title="High"
          value={`${(stock.high_price || stock.current_price).toFixed(2)} EGP`}
          icon={TrendingUp}
          description="Today's high"
          trend="up"
        />
        <StatCard
          title="Low"
          value={`${(stock.low_price || stock.current_price).toFixed(2)} EGP`}
          icon={TrendingDown}
          description="Today's low"
          trend="down"
        />
        <StatCard
          title="Volume"
          value={(stock.volume || 0).toLocaleString()}
          icon={Activity}
          description="Shares traded"
        />
      </div>

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Price History</CardTitle>
              <CardDescription>Historical price movements</CardDescription>
            </div>
            <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <TabsList>
                <TabsTrigger value="1W">1W</TabsTrigger>
                <TabsTrigger value="1M">1M</TabsTrigger>
                <TabsTrigger value="3M">3M</TabsTrigger>
                <TabsTrigger value="6M">6M</TabsTrigger>
                <TabsTrigger value="1Y">1Y</TabsTrigger>
                <TabsTrigger value="ALL">ALL</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loadingChart ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading chart data...</p>
              </div>
            </div>
          ) : priceHistory.length > 0 ? (
            <PortfolioChart
              data={priceHistory}
              title=""
              type="area"
              height={400}
            />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No historical data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendation Chart */}
      {stock.recommendation && (
        <div className="flex justify-center">
          <RecommendationChart
            recommendation={stock.recommendation}
            className="max-w-md w-full"
          />
        </div>
      )}

      {/* Company Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Symbol</span>
              <span className="font-medium">{stock.symbol}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Exchange</span>
              <Badge variant="outline">{stock.exchange}</Badge>
            </div>
            {stock.sector && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sector</span>
                <span className="font-medium">{stock.sector}</span>
              </div>
            )}
            {stock.industry && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Industry</span>
                <span className="font-medium">{stock.industry}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-medium">
                {new Date(stock.last_updated).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trading Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Price</span>
              <span className="font-medium">{stock.current_price.toFixed(2)} EGP</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Change</span>
              <span
                className={`font-medium ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? "+" : ""}
                {(stock.change || 0).toFixed(2)} EGP
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Change %</span>
              <span
                className={`font-medium ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? "+" : ""}
                {(stock.change_percent || 0).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Volume</span>
              <span className="font-medium">
                {(stock.volume || 0).toLocaleString()}
              </span>
            </div>
            {stock.recommendation && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recommendation</span>
                <Badge
                  className={
                    stock.recommendation.toLowerCase().includes("buy")
                      ? "bg-green-600"
                      : stock.recommendation.toLowerCase().includes("sell")
                      ? "bg-red-600"
                      : ""
                  }
                >
                  {stock.recommendation}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
