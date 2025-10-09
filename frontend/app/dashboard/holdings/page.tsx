"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { StockLogo } from "@/components/StockLogo";
import api from "@/lib/api";

interface Holding {
  id: number;
  stock_id?: number;
  stock_symbol: string;
  stock_name: string;
  stock_logo_url?: string | null;
  quantity: number;
  average_price: number;
  current_stock_price: number;
  current_value: number;
}

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  useEffect(() => {
    loadHoldings();
  }, []);

  const loadHoldings = async () => {
    try {
      const response = await api.get("/holdings");
      setHoldings(response.data);
    } catch (error) {
      console.error("Failed to load holdings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate holdings by stock symbol (in case a stock appears in multiple strategies/portfolios)
  let aggregatedHoldings = holdings.reduce((acc, holding) => {
    const existingHolding = acc.find(h => h.stock_symbol === holding.stock_symbol);
    if (existingHolding) {
      // Calculate weighted average price
      const totalCost = (existingHolding.quantity * existingHolding.average_price) + 
                        (holding.quantity * holding.average_price);
      existingHolding.quantity += holding.quantity;
      existingHolding.average_price = totalCost / existingHolding.quantity;
    } else {
      // Add new holding (clone to avoid mutation)
      acc.push({ ...holding });
    }
    return acc;
  }, [] as Holding[]);

  const calculateCurrentValue = (holding: Holding) => {
    return holding.quantity * holding.current_stock_price;
  };

  const calculateTotalValue = () => {
    return aggregatedHoldings.reduce((sum, holding) => sum + calculateCurrentValue(holding), 0);
  };

  const calculateProfit = (holding: Holding) => {
    const currentValue = calculateCurrentValue(holding);
    return currentValue - holding.quantity * holding.average_price;
  };

  const calculateProfitPercentage = (holding: Holding) => {
    const cost = holding.quantity * holding.average_price;
    const currentValue = calculateCurrentValue(holding);
    return ((currentValue - cost) / cost) * 100;
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction or reset
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  // Apply sorting
  if (sortColumn && sortDirection) {
    aggregatedHoldings = [...aggregatedHoldings].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "quantity":
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case "average_price":
          aValue = a.average_price;
          bValue = b.average_price;
          break;
        case "current_price":
          aValue = a.current_stock_price;
          bValue = b.current_stock_price;
          break;
        case "value":
          aValue = calculateCurrentValue(a);
          bValue = calculateCurrentValue(b);
          break;
        case "profit":
          aValue = calculateProfit(a);
          bValue = calculateProfit(b);
          break;
        case "profit_percentage":
          aValue = calculateProfitPercentage(a);
          bValue = calculateProfitPercentage(b);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  if (loading) {
    return <div>Loading holdings...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Holdings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Total Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {calculateTotalValue().toFixed(2)} EGP
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          {aggregatedHoldings.length === 0 ? (
            <p className="text-muted-foreground">
              No holdings yet. Create a strategy to start investing.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 hover:bg-muted ml-auto flex"
                      onClick={() => handleSort("quantity")}
                    >
                      Quantity
                      {getSortIcon("quantity")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 hover:bg-muted ml-auto flex"
                      onClick={() => handleSort("average_price")}
                    >
                      Avg Price
                      {getSortIcon("average_price")}
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
                      onClick={() => handleSort("value")}
                    >
                      Value
                      {getSortIcon("value")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 hover:bg-muted ml-auto flex"
                      onClick={() => handleSort("profit")}
                    >
                      Profit/Loss
                      {getSortIcon("profit")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 hover:bg-muted ml-auto flex"
                      onClick={() => handleSort("profit_percentage")}
                    >
                      P/L %
                      {getSortIcon("profit_percentage")}
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregatedHoldings.map((holding) => {
                  const currentValue = calculateCurrentValue(holding);
                  const profit = calculateProfit(holding);
                  const profitPercentage = calculateProfitPercentage(holding);
                  const isProfit = profit >= 0;

                  return (
                    <TableRow key={holding.stock_symbol}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <StockLogo 
                            symbol={holding.stock_symbol} 
                            name={holding.stock_name}
                            logoUrl={holding.stock_logo_url}
                            size={32}
                          />
                          <span>{holding.stock_symbol}</span>
                        </div>
                      </TableCell>
                      <TableCell>{holding.stock_name}</TableCell>
                      <TableCell className="text-right">
                        {holding.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {holding.average_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {holding.current_stock_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {currentValue.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          isProfit ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isProfit ? "+" : ""}
                        {profit.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          isProfit ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isProfit ? "+" : ""}
                        {profitPercentage.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

