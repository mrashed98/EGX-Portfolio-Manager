"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  ThumbsUp,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
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
  market_cap?: number | null;
  pe_ratio?: number | null;
  eps?: number | null;
  dividend_yield?: number | null;
  beta?: number | null;
  price_to_book?: number | null;
  price_to_sales?: number | null;
  roe?: number | null;
  debt_to_equity?: number | null;
  current_ratio?: number | null;
  quick_ratio?: number | null;
}

interface StockMetrics {
  market_cap?: number | null;
  pe_ratio?: number | null;
  eps_ttm?: number | null;
  eps_fq?: number | null;
  dividend_yield?: number | null;
  beta?: number | null;
  price_to_book?: number | null;
  roe?: number | null;
  roa?: number | null;
  roic?: number | null;
  debt_to_equity?: number | null;
  current_ratio?: number | null;
  quick_ratio?: number | null;
}

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const stockId = parseInt(params.id as string);

  const [stock, setStock] = useState<StockDetail | null>(null);
  const [metrics, setMetrics] = useState<StockMetrics | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any>({});
  const [news, setNews] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("1M");
  
  // Dialog states
  const [selectedNews, setSelectedNews] = useState<any | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null);
  
  // Collapsible indicators state
  const [indicatorsExpanded, setIndicatorsExpanded] = useState(false);

  useEffect(() => {
    loadStockDetail();
  }, [stockId]);

  useEffect(() => {
    if (stock) {
      loadStockMetrics();
      loadPriceHistory();
      loadIndicators();
      loadNews();
      loadIdeas();
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

  const loadStockMetrics = async () => {
    if (!stock) return;
    
    setLoadingMetrics(true);
    try {
      const response = await api.get(`/stocks/${stockId}/metrics`);
      setMetrics(response.data.metrics);
    } catch (error) {
      console.error("Failed to load stock metrics:", error);
    } finally {
      setLoadingMetrics(false);
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

  const loadIndicators = async () => {
    if (!stock) return;
    
    setLoadingIndicators(true);
    try {
      const response = await api.get(`/stocks/${stockId}/indicators`, {
        params: {
          timeframe: "1d",
        },
      });

      // Extract indicators from the nested response
      setIndicators(response.data.indicators || {});
    } catch (error) {
      console.error("Failed to load indicators:", error);
    } finally {
      setLoadingIndicators(false);
    }
  };

  const loadNews = async () => {
    if (!stock) return;
    
    setLoadingNews(true);
    try {
      const response = await api.get(`/stocks/${stockId}/news`, {
        params: {
          limit: 10,
        },
      });

      setNews(response.data.news || []);
    } catch (error) {
      console.error("Failed to load news:", error);
    } finally {
      setLoadingNews(false);
    }
  };

  const loadIdeas = async () => {
    if (!stock) return;
    
    setLoadingIdeas(true);
    try {
      const response = await api.get(`/stocks/${stockId}/ideas`, {
        params: {
          limit: 10,
        },
      });

      setIdeas(response.data.ideas || []);
    } catch (error) {
      console.error("Failed to load ideas:", error);
    } finally {
      setLoadingIdeas(false);
    }
  };


  const handleNewsClick = async (newsItem: any) => {
    setSelectedNews(newsItem);
    // Use the body content that's already available in the news item
    // No need to make additional API calls since the content is already included
  };

  const handleIdeaClick = (idea: any) => {
    setSelectedIdea(idea);
  };

  const closeNewsDialog = () => {
    setSelectedNews(null);
  };

  const closeIdeaDialog = () => {
    setSelectedIdea(null);
  };

  // Helper function to get latest OHLC data
  const getLatestOHLC = () => {
    if (priceHistory.length === 0) {
      return {
        open: stock?.current_price || 0,
        high: stock?.current_price || 0,
        low: stock?.current_price || 0,
        close: stock?.current_price || 0,
      };
    }
    const latest = priceHistory[priceHistory.length - 1];
    return {
      open: latest.open || stock?.current_price || 0,
      high: latest.high || stock?.current_price || 0,
      low: latest.low || stock?.current_price || 0,
      close: latest.close || stock?.current_price || 0,
    };
  };

  // Helper function to determine indicator color
  const getIndicatorColor = (name: string, value: number): string => {
    const upperName = name.toUpperCase();
    
    // RSI indicators
    if (upperName.includes('RSI')) {
      if (value > 70) return 'text-red-600'; // Overbought
      if (value < 30) return 'text-green-600'; // Oversold (buying opportunity)
      return 'text-yellow-600'; // Neutral
    }
    
    // MACD indicators
    if (upperName.includes('MACD')) {
      return value > 0 ? 'text-green-600' : 'text-red-600';
    }
    
    // Stochastic indicators
    if (upperName.includes('STOCH')) {
      if (value > 80) return 'text-red-600'; // Overbought
      if (value < 20) return 'text-green-600'; // Oversold
      return 'text-yellow-600';
    }
    
    // ADX (trend strength)
    if (upperName.includes('ADX') && !upperName.includes('DI')) {
      if (value > 25) return 'text-green-600'; // Strong trend
      return 'text-yellow-600'; // Weak trend
    }
    
    // CCI (Commodity Channel Index)
    if (upperName.includes('CCI')) {
      if (value > 100) return 'text-red-600'; // Overbought
      if (value < -100) return 'text-green-600'; // Oversold
      return 'text-yellow-600';
    }
    
    // Moving averages comparison
    if (upperName.includes('SMA') || upperName.includes('EMA')) {
      if (stock && value > stock.current_price) return 'text-red-600'; // Price below MA (bearish)
      if (stock && value < stock.current_price) return 'text-green-600'; // Price above MA (bullish)
      return 'text-yellow-600';
    }
    
    // Default neutral
    return 'text-gray-600';
  };

  // Helper function to get indicator background color
  const getIndicatorBg = (name: string, value: number): string => {
    const color = getIndicatorColor(name, value);
    if (color.includes('green')) return 'bg-green-50 border-green-200';
    if (color.includes('red')) return 'bg-red-50 border-red-200';
    if (color.includes('yellow')) return 'bg-yellow-50 border-yellow-200';
    return 'bg-gray-50 border-gray-200';
  };

  // Helper function to determine metric color based on value quality
  const getMetricColor = (metricName: string, value: number): string => {
    const name = metricName.toLowerCase();
    
    // P/E Ratio - lower is generally better (not overvalued)
    if (name.includes('p/e') || name.includes('pe ratio')) {
      if (value < 15) return 'text-green-600';
      if (value < 25) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    // ROE, ROA, ROIC - higher is better
    if (name.includes('roe') || name.includes('roa') || name.includes('roic')) {
      if (value > 15) return 'text-green-600';
      if (value > 8) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    // Dividend Yield - higher is generally better
    if (name.includes('dividend')) {
      if (value > 4) return 'text-green-600';
      if (value > 2) return 'text-yellow-600';
      return 'text-gray-700';
    }
    
    // Beta - closer to 1 is less volatile
    if (name.includes('beta')) {
      if (value >= 0.8 && value <= 1.2) return 'text-green-600';
      if (value >= 0.5 && value <= 1.5) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    // Debt to Equity - lower is better
    if (name.includes('debt')) {
      if (value < 0.5) return 'text-green-600';
      if (value < 1) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    // Current Ratio, Quick Ratio - higher is better (>1 is good)
    if (name.includes('current') || name.includes('quick')) {
      if (value > 1.5) return 'text-green-600';
      if (value > 1) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    // Price to Book - lower is generally better
    if (name.includes('price to book')) {
      if (value < 1) return 'text-green-600';
      if (value < 3) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    // Default - neutral
    return 'text-gray-700';
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

      {/* Key Metrics - Color Coded OHLC */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={`${getLatestOHLC().open > getLatestOHLC().close ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getLatestOHLC().open > getLatestOHLC().close ? 'text-red-600' : 'text-green-600'}`}>
              {getLatestOHLC().open.toFixed(2)} EGP
            </div>
            <p className="text-xs text-muted-foreground mt-1">Opening price</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              High
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getLatestOHLC().high.toFixed(2)} EGP
            </div>
            <p className="text-xs text-muted-foreground mt-1">Day's high</p>
          </CardContent>
        </Card>
        
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Low
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {getLatestOHLC().low.toFixed(2)} EGP
            </div>
            <p className="text-xs text-muted-foreground mt-1">Day's low</p>
          </CardContent>
        </Card>
        
        <Card className={`${getLatestOHLC().close > getLatestOHLC().open ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stock.volume || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Shares traded</p>
          </CardContent>
        </Card>
      </div>

      {/* Price Chart - Full Width */}
      <Card className="w-full">
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
        <CardContent className="w-full p-0">
          {loadingChart ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading chart data...</p>
              </div>
            </div>
          ) : priceHistory.length > 0 ? (
            <div className="w-full">
              <PortfolioChart
                data={priceHistory}
                title=""
                type="area"
                height={400}
              />
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No historical data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendation Charts - Full Width */}
      <RecommendationChart
        recommendation={stock.recommendation}
        className="grid md:grid-cols-2 gap-4"
      />

      {/* Stock Information Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Additional Stock Metrics - ENHANCED: Load from /metrics endpoint */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Metrics</CardTitle>
            <CardDescription>Key financial indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingMetrics ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : metrics ? (
              <>
                {metrics.market_cap && metrics.market_cap > 0 && (
                  <div className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <span className="text-muted-foreground">Market Cap</span>
                    <span className="font-semibold">
                      {(metrics.market_cap / 1000000).toFixed(2)}M EGP
                    </span>
                  </div>
                )}
                {metrics.pe_ratio && metrics.pe_ratio > 0 && (
                  <div className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <span className="text-muted-foreground">P/E Ratio</span>
                    <span className={`font-semibold ${getMetricColor('P/E Ratio', metrics.pe_ratio)}`}>
                      {metrics.pe_ratio.toFixed(2)}
                    </span>
                  </div>
                )}
                {metrics.eps_ttm && metrics.eps_ttm !== 0 && (
                  <div className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <span className="text-muted-foreground">EPS (TTM)</span>
                    <span className="font-semibold">
                      {metrics.eps_ttm.toFixed(2)} EGP
                    </span>
                  </div>
                )}
                {metrics.dividend_yield && metrics.dividend_yield > 0 && (
                  <div className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <span className="text-muted-foreground">Dividend Yield</span>
                    <span className={`font-semibold ${getMetricColor('Dividend Yield', metrics.dividend_yield)}`}>
                      {metrics.dividend_yield.toFixed(2)}%
                    </span>
                  </div>
                )}
                {metrics.beta && metrics.beta !== 0 && (
                  <div className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <span className="text-muted-foreground">Beta</span>
                    <span className={`font-semibold ${getMetricColor('Beta', metrics.beta)}`}>
                      {metrics.beta.toFixed(2)}
                    </span>
                  </div>
                )}
                {metrics.price_to_book && metrics.price_to_book > 0 && (
                  <div className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <span className="text-muted-foreground">Price to Book</span>
                    <span className={`font-semibold ${getMetricColor('Price to Book', metrics.price_to_book)}`}>
                      {metrics.price_to_book.toFixed(2)}
                    </span>
                  </div>
                )}
                {metrics.roe && metrics.roe !== 0 && (
                  <div className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <span className="text-muted-foreground">ROE</span>
                    <span className={`font-semibold ${getMetricColor('ROE', metrics.roe)}`}>
                      {metrics.roe.toFixed(2)}%
                    </span>
                  </div>
                )}
                {metrics.roa && metrics.roa !== 0 && (
                  <div className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <span className="text-muted-foreground">ROA</span>
                    <span className={`font-semibold ${getMetricColor('ROA', metrics.roa)}`}>
                      {metrics.roa.toFixed(2)}%
                    </span>
                  </div>
                )}
                {metrics.roic && metrics.roic !== 0 && (
                  <div className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <span className="text-muted-foreground">ROIC</span>
                    <span className={`font-semibold ${getMetricColor('ROIC', metrics.roic)}`}>
                      {metrics.roic.toFixed(2)}%
                    </span>
                  </div>
                )}
                {metrics.debt_to_equity && metrics.debt_to_equity >= 0 && (
                  <div className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <span className="text-muted-foreground">Debt to Equity</span>
                    <span className={`font-semibold ${getMetricColor('Debt to Equity', metrics.debt_to_equity)}`}>
                      {metrics.debt_to_equity.toFixed(2)}
                    </span>
                  </div>
                )}
                {metrics.current_ratio && metrics.current_ratio > 0 && (
                  <div className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <span className="text-muted-foreground">Current Ratio</span>
                    <span className={`font-semibold ${getMetricColor('Current Ratio', metrics.current_ratio)}`}>
                      {metrics.current_ratio.toFixed(2)}
                    </span>
                  </div>
                )}
                {metrics.quick_ratio && metrics.quick_ratio > 0 && (
                  <div className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <span className="text-muted-foreground">Quick Ratio</span>
                    <span className={`font-semibold ${getMetricColor('Quick Ratio', metrics.quick_ratio)}`}>
                      {metrics.quick_ratio.toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No metrics available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Company Information */}
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

      {/* Technical Indicators - ENHANCED: Collapsible & Color-coded */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Technical Indicators</CardTitle>
              <CardDescription>Current technical analysis indicators</CardDescription>
            </div>
            {Object.keys(indicators).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIndicatorsExpanded(!indicatorsExpanded)}
              >
                {indicatorsExpanded ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Show All ({Object.keys(indicators).length})
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingIndicators ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : Object.keys(indicators).length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(indicators)
                .filter(([name]) => name.toLowerCase() !== 'close') // Remove 'close' indicator
                .slice(0, indicatorsExpanded ? undefined : 12)
                .map(([name, value]: [string, any]) => {
                  const numValue = typeof value === 'number' ? value : parseFloat(value);
                  const isNumber = !isNaN(numValue);
                  return (
                    <div
                      key={name}
                      className={`p-4 border rounded-lg ${
                        isNumber ? getIndicatorBg(name, numValue) : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="text-sm font-medium text-muted-foreground">{name}</div>
                      <div
                        className={`text-2xl font-bold mt-1 ${
                          isNumber ? getIndicatorColor(name, numValue) : 'text-gray-600'
                        }`}
                      >
                        {isNumber ? numValue.toFixed(2) : value?.toString() || 'N/A'}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No technical indicators available
            </p>
          )}
        </CardContent>
      </Card>

      {/* News and Ideas - ENHANCED: Scrollable & Clickable */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* News - ENHANCED: Scrollable with click to view full content */}
        <Card>
          <CardHeader>
            <CardTitle>Latest News</CardTitle>
            <CardDescription>Recent news about {stock.name} (click to read full article)</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingNews ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : news.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {news.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleNewsClick(item)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm line-clamp-2">{item.title || 'News Title'}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.source || 'Unknown Source'} • {item.published ? new Date(item.published * 1000).toLocaleDateString() : 'Recent'}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No news available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Trading Ideas - ENHANCED: Scrollable with click to view details */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Ideas</CardTitle>
            <CardDescription>Community trading ideas for {stock.symbol} (click to view details)</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingIdeas ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : ideas.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {ideas.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleIdeaClick(item)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm line-clamp-2">{item.title || 'Trading Idea'}</div>
                        {item.paragraph && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-3">
                            {item.paragraph}
                          </div>
                        )}
                        <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{item.author || 'Community'}</span>
                          {item.idea_strategy && (
                            <Badge variant="outline" className="text-xs">
                              {item.idea_strategy}
                            </Badge>
                          )}
                          {item.boosts_count !== undefined && (
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {item.boosts_count}
                            </span>
                          )}
                          {item.comments_count !== undefined && item.comments_count > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {item.comments_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No trading ideas available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* News Dialog */}
      <Dialog open={selectedNews !== null} onOpenChange={(open) => !open && closeNewsDialog()}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedNews?.title}</DialogTitle>
            <DialogDescription>
              {selectedNews?.source} • {selectedNews?.published ? new Date(selectedNews.published * 1000).toLocaleString() : 'Recent'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {selectedNews ? (
              <div className="space-y-4">
                {/* Breadcrumbs */}
                {selectedNews.breadcrumbs && (
                  <p className="text-xs text-muted-foreground">{selectedNews.breadcrumbs}</p>
                )}
                
                {/* Related Symbols */}
                {selectedNews.related_symbols && Array.isArray(selectedNews.related_symbols) && selectedNews.related_symbols.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-2 border-b">
                    {selectedNews.related_symbols.map((symbol: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                        {symbol.logo && (
                          <div 
                            className="w-4 h-4" 
                            dangerouslySetInnerHTML={{ __html: symbol.logo }}
                          />
                        )}
                        {symbol.symbol || symbol.name || symbol}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Body Content - Array of objects with type and content */}
                {selectedNews.body && Array.isArray(selectedNews.body) && selectedNews.body.length > 0 ? (
                  <div className="space-y-3">
                    {selectedNews.body.map((item: any, idx: number) => {
                      // Handle different types of content
                      if (item.type === 'text' && item.content) {
                        return (
                          <p key={idx} className="text-sm leading-relaxed text-gray-700">
                            {item.content}
                          </p>
                        );
                      } else if (item.type === 'image' && item.src) {
                        return (
                          <img 
                            key={idx} 
                            src={item.src} 
                            alt={item.alt || ''} 
                            className="max-w-full h-auto rounded-lg"
                          />
                        );
                      } else if (typeof item === 'string' && item.trim()) {
                        // Fallback for string content
                        return (
                          <p key={idx} className="text-sm leading-relaxed text-gray-700">
                            {item}
                          </p>
                        );
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No content available</p>
                )}

                {/* Tags */}
                {selectedNews.tags && Array.isArray(selectedNews.tags) && selectedNews.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {selectedNews.tags.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Unable to load news content. This article may not have full content available.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Trading Idea Dialog */}
      <Dialog open={selectedIdea !== null} onOpenChange={(open) => !open && closeIdeaDialog()}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedIdea?.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-3 flex-wrap">
              <span>By {selectedIdea?.author || 'Community'}</span>
              {selectedIdea?.idea_strategy && (
                <Badge variant="outline">{selectedIdea.idea_strategy}</Badge>
              )}
              {selectedIdea?.publication_datetime && (
                <span>• {new Date(selectedIdea.publication_datetime).toLocaleDateString()}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {selectedIdea?.preview_image && (
              <img
                src={selectedIdea.preview_image}
                alt={selectedIdea.title}
                className="w-full rounded-lg"
              />
            )}
            {selectedIdea?.paragraph && (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {selectedIdea.paragraph}
              </div>
            )}
            <div className="flex items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
              {selectedIdea?.boosts_count !== undefined && (
                <span className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  {selectedIdea.boosts_count} boosts
                </span>
              )}
              {selectedIdea?.comments_count !== undefined && selectedIdea.comments_count > 0 && (
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  {selectedIdea.comments_count} comments
                </span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
