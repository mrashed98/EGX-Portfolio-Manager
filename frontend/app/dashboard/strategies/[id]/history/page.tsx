"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, ChevronUp, Undo2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface RebalancingHistory {
  id: number;
  strategy_id: number;
  actions: any;
  executed: boolean;
  undone: boolean;
  undone_at: string | null;
  created_at: string;
}

interface Stock {
  id: number;
  symbol: string;
  name: string;
}

export default function RebalancingHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const strategyId = parseInt(id as string);
  const { toast } = useToast();

  const [history, setHistory] = useState<RebalancingHistory[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [undoingId, setUndoingId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [strategyId]);

  const loadData = async () => {
    try {
      const [historyRes, stocksRes] = await Promise.all([
        api.get(`/strategies/${strategyId}/rebalancing-history`),
        api.get(`/stocks`)
      ]);
      
      setHistory(historyRes.data);
      setStocks(stocksRes.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load rebalancing history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStockName = (stockId: number) => {
    const stock = stocks.find((s) => s.id === stockId);
    return stock ? stock.name : 'Unknown';
  };

  const getStockSymbol = (stockId: number) => {
    const stock = stocks.find((s) => s.id === stockId);
    return stock ? stock.symbol : `Stock #${stockId}`;
  };

  const toggleCard = (recordId: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const handleUndo = async (recordId: number) => {
    if (!confirm("Are you sure you want to undo this rebalancing? This will reverse all the executed actions.")) {
      return;
    }

    setUndoingId(recordId);
    try {
      await api.post(`/strategies/${strategyId}/rebalance/${recordId}/undo`);
      
      toast({
        title: "Success",
        description: "Rebalancing has been undone successfully",
      });

      // Reload data to show updated status
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to undo rebalancing",
        variant: "destructive",
      });
    } finally {
      setUndoingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Rebalancing History</h1>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No rebalancing history yet. Execute a rebalancing action to see it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((record) => {
            const isExpanded = expandedCards.has(record.id);
            const actionCount = record.actions?.length || 0;

            return (
              <Card key={record.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCard(record.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-lg">
                          {new Date(record.created_at).toLocaleString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {actionCount} Action{actionCount !== 1 ? 's' : ''} Executed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {record.undone ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Undone
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Executed
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUndo(record.id);
                            }}
                            disabled={undoingId === record.id}
                          >
                            <Undo2 className="h-3 w-3 mr-1" />
                            {undoingId === record.id ? "Undoing..." : "Undo"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0">
                    {record.actions && record.actions.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-3 text-left">Stock</th>
                              <th className="px-4 py-3 text-left">Action</th>
                              <th className="px-4 py-3 text-right">Quantity</th>
                              <th className="px-4 py-3 text-right">Price</th>
                              <th className="px-4 py-3 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.actions.map((action: any, idx: number) => (
                              <tr key={idx} className="border-t hover:bg-muted/50">
                                <td className="px-4 py-3">
                                  <div>
                                    <div className="font-medium">{getStockSymbol(action.stock_id)}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {getStockName(action.stock_id)}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    action.action.toUpperCase() === 'BUY' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {action.action.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right font-medium">
                                  {action.quantity}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {action.price.toFixed(2)} EGP
                                </td>
                                <td className="px-4 py-3 text-right font-medium">
                                  {(action.quantity * action.price).toFixed(2)} EGP
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No actions recorded</p>
                    )}
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

