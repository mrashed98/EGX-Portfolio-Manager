"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ComparisonChart } from "@/components/charts/ComparisonChart";
import { CorrelationMatrix } from "@/components/charts/CorrelationMatrix";
import { RiskReturnScatter } from "@/components/charts/RiskReturnScatter";
import { StatCard } from "@/components/analytics/StatCard";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import api from "@/lib/api";

interface Portfolio {
  id: number;
  name: string;
  stock_ids: number[];
  created_at: string;
}

interface PortfolioPerformance {
  portfolio_id: number;
  portfolio_name: string;
  current_value: number;
  initial_value: number;
  change: number;
  change_percent: number;
  time_series: { date: string; value: number }[];
  volatility?: number;
  sharpe_ratio?: number;
}

export default function PortfolioComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [performances, setPerformances] = useState<PortfolioPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    loadPortfolios();
    
    // Load pre-selected portfolios from URL
    const ids = searchParams.get("ids");
    if (ids) {
      const idArray = ids.split(",").map(Number);
      setSelectedIds(idArray);
    }
  }, [searchParams]);

  useEffect(() => {
    // Only load comparison if portfolios have been loaded
    if (selectedIds.length > 0 && portfolios.length > 0 && !loading) {
      loadComparison();
    }
  }, [selectedIds, portfolios, loading]);

  const loadPortfolios = async () => {
    try {
      const response = await api.get("/portfolios");
      setPortfolios(response.data);
    } catch (error) {
      console.error("Failed to load portfolios:", error);
      toast({
        title: "Error",
        description: "Failed to load portfolios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async () => {
    if (selectedIds.length === 0) {
      setPerformances([]);
      return;
    }

    setComparing(true);
    try {
      const responses = await Promise.all(
        selectedIds.map(async (id) => {
          try {
            const res = await api.get(`/portfolios/${id}/performance`);
            const portfolio = portfolios.find((p) => p.id === id);
            
            return {
              ...res.data,
              portfolio_id: id,
              portfolio_name: portfolio?.name || `Portfolio ${id}`,
            };
          } catch (err) {
            console.error(`Failed to load performance for portfolio ${id}:`, err);
            // Return null for failed portfolios
            return null;
          }
        })
      );
      
      // Filter out null values (failed requests)
      const validResponses = responses.filter((r): r is PortfolioPerformance => r !== null);
      setPerformances(validResponses);
      
      if (validResponses.length < selectedIds.length) {
        toast({
          title: "Partial Load",
          description: `Loaded ${validResponses.length} of ${selectedIds.length} portfolios`,
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Failed to load comparison data:", error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load comparison data",
        variant: "destructive",
      });
    } finally {
      setComparing(false);
    }
  };

  const handleTogglePortfolio = (portfolioId: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(portfolioId)) {
        return prev.filter((id) => id !== portfolioId);
      }
      if (prev.length >= 4) {
        toast({
          title: "Maximum Reached",
          description: "You can compare up to 4 portfolios at a time",
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, portfolioId];
    });
  };

  const calculateCorrelation = (series1: number[], series2: number[]): number => {
    const n = Math.min(series1.length, series2.length);
    if (n === 0) return 0;

    const mean1 = series1.reduce((a, b) => a + b, 0) / n;
    const mean2 = series2.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = series1[i] - mean1;
      const diff2 = series2[i] - mean2;
      numerator += diff1 * diff2;
      denom1 += diff1 * diff1;
      denom2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(denom1 * denom2);
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const calculateVolatility = (values: number[]): number => {
    if (values.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < values.length; i++) {
      returns.push((values[i] - values[i - 1]) / values[i - 1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Portfolio Comparison</h1>
            <p className="text-muted-foreground">
              Compare performance across multiple portfolios
            </p>
          </div>
        </div>
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/portfolios")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Portfolio Comparison</h1>
          </div>
          <p className="text-muted-foreground">
            Compare performance across multiple portfolios (max 4)
          </p>
        </div>
        <Badge variant="secondary">
          {selectedIds.length} of 4 selected
        </Badge>
      </div>

      {/* Portfolio Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Portfolios to Compare</CardTitle>
          <CardDescription>
            Choose up to 4 portfolios to analyze side by side
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((portfolio) => {
              if (!portfolio || !portfolio.name) return null;
              const isSelected = selectedIds.includes(portfolio.id);
              return (
                <div
                  key={portfolio.id}
                  className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors cursor-pointer hover:bg-muted/50 ${
                    isSelected ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => handleTogglePortfolio(portfolio.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleTogglePortfolio(portfolio.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{portfolio.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {portfolio.stock_ids?.length || 0} stocks
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {portfolios.length === 0 && (
            <EmptyState
              title="No portfolios available"
              description="Create some portfolios first to compare them"
              primaryAction={{
                label: "Create Portfolio",
                onClick: () => router.push("/dashboard/portfolios?action=new"),
              }}
              compact
            />
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {selectedIds.length === 0 ? (
        <EmptyState
          title="Select portfolios to compare"
          description="Choose at least one portfolio from the list above to see comparison charts"
          compact
        />
      ) : comparing ? (
        <div className="text-center py-12">Loading comparison data...</div>
      ) : performances.length > 0 ? (
        <>
          {/* Summary Stats - Performance Focus */}
          <div className="grid gap-4 md:grid-cols-4">
            {performances.filter(p => p && p.portfolio_name).map((perf) => {
              const isPositive = perf.change_percent >= 0;
              return (
                <Card key={perf.portfolio_id} className={`border-2 ${
                  isPositive ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
                }`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium truncate">
                      {perf.portfolio_name || 'Unknown Portfolio'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className={`flex items-center gap-2 ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}>
                        {isPositive ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <TrendingDown className="h-5 w-5" />
                        )}
                        <span className="text-3xl font-bold">
                          {formatPercent(perf.change_percent || 0, 2, true)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Value: {formatCurrency(perf.current_value || 0, 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Change: {formatCurrency(perf.change || 0, 2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Performance Comparison Chart */}
          <ComparisonChart data={performances} />

          {/* Risk/Return Analysis */}
          <div className="grid gap-4 md:grid-cols-2">
            <RiskReturnScatter
              data={performances.filter(p => p && p.portfolio_name && p.time_series).map((perf) => {
                const values = perf.time_series?.map((point) => point?.value || 0).filter(v => v > 0) || [];
                return {
                  name: perf.portfolio_name || 'Unknown',
                  return: perf.change_percent || 0,
                  risk: values.length > 0 ? calculateVolatility(values) : 0,
                  value: perf.current_value || 0,
                };
              })}
            />
            <CorrelationMatrix
              data={performances.filter(p => p && p.portfolio_name)}
              calculateCorrelation={calculateCorrelation}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

