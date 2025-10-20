"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { ExportButton } from "@/components/import-export/ExportButton";
import api from "@/lib/api";
import { ArrowLeft, ChevronDown, ChevronRight, Plus, Minus, Edit2, Calendar } from "lucide-react";

interface PortfolioHistory {
  id: number;
  action: string;
  description: string;
  changes: any;
  created_at: string;
}


export default function PortfolioHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const portfolioId = parseInt(params.id as string);

  const [history, setHistory] = useState<PortfolioHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, [portfolioId]);

  const loadData = async () => {
    try {
      const historyRes = await api.get(`/portfolios/${portfolioId}/history`);
      setHistory(historyRes.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load portfolio history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleHistoryExpansion = (id: number) => {
    setExpandedHistoryIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <Plus className="h-4 w-4" />;
      case "added_stocks":
        return <Plus className="h-4 w-4" />;
      case "removed_stocks":
        return <Minus className="h-4 w-4" />;
      case "renamed":
        return <Edit2 className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "created":
        return "default";
      case "added_stocks":
        return "default";
      case "removed_stocks":
        return "secondary";
      case "renamed":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/dashboard/portfolios/${portfolioId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold tracking-tight">Modification History</h1>
          <p className="text-muted-foreground mt-2">
            Track all changes made to this portfolio
          </p>
        </div>
        {history.length > 0 && (
          <ExportButton
            endpoint={`/portfolios/${portfolioId}/history/export`}
            label="Export History"
            variant="outline"
          />
        )}
      </div>

      {/* Modification History */}
      {history.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground">No modification history available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
            {history.map((item) => {
              const isExpanded = expandedHistoryIds.has(item.id);
              
              return (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleHistoryExpansion(item.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          {getActionIcon(item.action)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getActionBadgeVariant(item.action)}>
                              {item.action.replace(/_/g, " ").toUpperCase()}
                            </Badge>
                            <p className="font-medium">{item.description}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-0 border-t">
                      <div className="mt-4 space-y-2">
                        {item.changes.added && item.changes.added.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-green-600 mb-1">
                              Added Stocks ({item.changes.added.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {item.changes.added.map((stockId: number) => (
                                <Badge key={stockId} variant="outline" className="text-green-600">
                                  Stock #{stockId}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {item.changes.removed && item.changes.removed.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-600 mb-1">
                              Removed Stocks ({item.changes.removed.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {item.changes.removed.map((stockId: number) => (
                                <Badge key={stockId} variant="outline" className="text-red-600">
                                  Stock #{stockId}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {item.changes.old_name && item.changes.new_name && (
                          <div>
                            <p className="text-sm font-medium mb-1">Name Change</p>
                            <p className="text-sm text-muted-foreground">
                              <span className="line-through">{item.changes.old_name}</span>
                              {" → "}
                              <span className="font-medium">{item.changes.new_name}</span>
                            </p>
                          </div>
                        )}
                        
                        {item.changes.stock_count !== undefined && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Total stocks: {item.changes.stock_count}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}

