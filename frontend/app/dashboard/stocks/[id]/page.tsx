"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { StockLogo } from "@/components/StockLogo";
import { useToast } from "@/components/ui/use-toast";

interface StockDetail {
  id: number;
  symbol: string;
  name: string;
  exchange: string;
  current_price: number;
  logo_url?: string | null;
  last_updated: string;
  open_price?: number | null;
  high_price?: number | null;
  low_price?: number | null;
  volume?: number | null;
  change?: number | null;
  change_percent?: number | null;
  recommendation?: string | null;
  sector?: string | null;
  industry?: string | null;
}

export default function StockDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const stockId = params.id as string;

  const [stock, setStock] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStockDetails();
  }, [stockId]);

  const loadStockDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/stocks/${stockId}/details`);
      setStock(response.data);
    } catch (error: any) {
      console.error("Error loading stock details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "Failed to load stock details",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation?: string | null) => {
    if (!recommendation) return "text-gray-500";
    
    const rec = recommendation.toUpperCase();
    if (rec.includes("BUY") || rec.includes("STRONG_BUY")) return "text-green-600";
    if (rec.includes("SELL") || rec.includes("STRONG_SELL")) return "text-red-600";
    return "text-yellow-600";
  };

  const getRecommendationIcon = (recommendation?: string | null) => {
    if (!recommendation) return <Activity className="h-5 w-5" />;
    
    const rec = recommendation.toUpperCase();
    if (rec.includes("BUY") || rec.includes("STRONG_BUY")) 
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (rec.includes("SELL") || rec.includes("STRONG_SELL")) 
      return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Activity className="h-5 w-5 text-yellow-600" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="text-center py-12">Loading stock details...</div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="text-center py-12">Stock not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Stocks
        </Button>
      </div>

      {/* Stock Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <StockLogo 
              symbol={stock.symbol} 
              name={stock.name}
              logoUrl={stock.logo_url}
              size={80}
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{stock.symbol}</h1>
              <p className="text-lg text-muted-foreground">{stock.name}</p>
              <p className="text-sm text-muted-foreground">{stock.exchange}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">
                {stock.current_price.toFixed(2)} EGP
              </div>
              {stock.change_percent !== null && stock.change_percent !== undefined && (
                <div className={`text-lg font-semibold ${stock.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stock.change_percent >= 0 ? '+' : ''}
                  {stock.change_percent.toFixed(2)}%
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Updated: {new Date(stock.last_updated).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Information */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stock.open_price ? stock.open_price.toFixed(2) : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stock.high_price ? stock.high_price.toFixed(2) : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stock.low_price ? stock.low_price.toFixed(2) : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stock.volume ? stock.volume.toLocaleString() : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {stock.sector || 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Industry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {stock.industry || 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center gap-2 text-lg font-bold ${getRecommendationColor(stock.recommendation)}`}>
              {getRecommendationIcon(stock.recommendation)}
              <span>{stock.recommendation || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Source Notice */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Data sourced from TradingView • Real-time market data for the Egyptian Exchange (EGX)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

