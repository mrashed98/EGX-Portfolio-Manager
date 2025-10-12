"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartControls, useDateRange } from "./ChartControls";
import { getChartColor } from "@/lib/design-tokens";
import { formatCurrency } from "@/lib/formatters";

interface PortfolioPerformance {
  portfolio_id: number;
  portfolio_name: string;
  current_value: number;
  initial_value: number;
  change: number;
  change_percent: number;
  time_series: { date: string; value: number }[];
}

interface ComparisonChartProps {
  data: PortfolioPerformance[];
  title?: string;
  description?: string;
}

export function ComparisonChart({
  data,
  title = "Performance Comparison",
  description = "Compare portfolio values over time",
}: ComparisonChartProps) {
  const { dateRange, setDateRange, getDateFilter } = useDateRange("1M");
  const [showLegend, setShowLegend] = useState(true);

  // Merge all time series data
  const mergedData = () => {
    if (data.length === 0) return [];

    const dateFilter = getDateFilter();
    
    // Get all unique dates from all portfolios
    const allDates = new Set<string>();
    data.forEach((portfolio) => {
      portfolio.time_series.forEach((point) => {
        const date = new Date(point.date);
        if (date >= dateFilter) {
          allDates.add(point.date);
        }
      });
    });

    // Sort dates
    const sortedDates = Array.from(allDates).sort();

    // Create merged data structure
    return sortedDates.map((date) => {
      const dataPoint: any = {
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        fullDate: date,
      };

      // Add each portfolio's value for this date
      data.forEach((portfolio) => {
        const point = portfolio.time_series.find((p) => p.date === date);
        dataPoint[`portfolio_${portfolio.portfolio_id}`] = point?.value || null;
      });

      return dataPoint;
    });
  };

  const chartData = mergedData();

  const handleExport = (format: "PNG" | "SVG" | "CSV") => {
    if (format === "CSV") {
      // Export data as CSV
      const headers = ["Date", ...data.map((p) => p.portfolio_name)];
      const rows = chartData.map((point) => [
        point.fullDate,
        ...data.map((p) => point[`portfolio_${p.portfolio_id}`] || ""),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `portfolio-comparison-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // PNG/SVG export would require additional library (html2canvas or similar)
      console.log(`Export as ${format} - requires additional implementation`);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="text-sm font-medium mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            const portfolio = data.find(
              (p) => `portfolio_${p.portfolio_id}` === entry.dataKey
            );
            if (!portfolio) return null;

            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {portfolio.portfolio_name}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {formatCurrency(entry.value, 0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <ChartControls
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onExport={handleExport}
            showLegend={showLegend}
            onToggleLegend={() => setShowLegend(!showLegend)}
            compact
          />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => {
                  const portfolioId = parseInt(value.split("_")[1]);
                  const portfolio = data.find((p) => p.portfolio_id === portfolioId);
                  return portfolio?.portfolio_name || value;
                }}
              />
            )}
            {data.map((portfolio, index) => (
              <Line
                key={portfolio.portfolio_id}
                type="monotone"
                dataKey={`portfolio_${portfolio.portfolio_id}`}
                stroke={getChartColor(index)}
                strokeWidth={2}
                dot={false}
                name={`portfolio_${portfolio.portfolio_id}`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

