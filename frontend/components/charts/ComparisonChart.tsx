"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
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
  description = "Compare portfolio performance over time",
}: ComparisonChartProps) {
  const { dateRange, setDateRange, getDateFilter } = useDateRange("1M");
  const [showLegend, setShowLegend] = useState(true);

  // Calculate initial values for each portfolio (first data point in filtered range)
  const getInitialValues = () => {
    const initialValues: Record<number, number> = {};
    const dateFilter = getDateFilter();
    
    data.forEach((portfolio) => {
      if (!portfolio || !portfolio.time_series) return;
      
      // Get filtered and sorted time series
      const filteredSeries = portfolio.time_series
        .filter((point) => point && point.date && new Date(point.date) >= dateFilter)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Use the first value as initial
      if (filteredSeries.length > 0 && filteredSeries[0].value) {
        initialValues[portfolio.portfolio_id] = filteredSeries[0].value;
      }
    });
    
    return initialValues;
  };

  // Merge all time series data and calculate performance percentages
  const mergedData = () => {
    if (data.length === 0) return [];

    const dateFilter = getDateFilter();
    const initialValues = getInitialValues();
    
    // Get all unique dates from all portfolios
    const allDates = new Set<string>();
    data.forEach((portfolio) => {
      if (!portfolio || !portfolio.time_series) return;
      portfolio.time_series.forEach((point) => {
        if (!point || !point.date) return;
        const date = new Date(point.date);
        if (date >= dateFilter) {
          allDates.add(point.date);
        }
      });
    });

    // Sort dates
    const sortedDates = Array.from(allDates).sort();

    // Create merged data structure with performance percentages
    return sortedDates.map((date) => {
      const dataPoint: any = {
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        fullDate: date,
      };

      // Add each portfolio's performance percentage for this date
      data.forEach((portfolio) => {
        if (!portfolio || !portfolio.time_series) return;
        const point = portfolio.time_series.find((p) => p && p.date === date);
        
        if (point?.value && initialValues[portfolio.portfolio_id]) {
          const initialValue = initialValues[portfolio.portfolio_id];
          const performancePercent = ((point.value - initialValue) / initialValue) * 100;
          dataPoint[`portfolio_${portfolio.portfolio_id}`] = performancePercent;
        } else {
          dataPoint[`portfolio_${portfolio.portfolio_id}`] = null;
        }
      });

      return dataPoint;
    });
  };

  const chartData = mergedData();
  
  // Calculate dynamic Y-axis domain
  const getYAxisDomain = () => {
    if (chartData.length === 0) return [-10, 10];
    
    let min = 0;
    let max = 0;
    
    chartData.forEach((point) => {
      data.forEach((portfolio) => {
        const value = point[`portfolio_${portfolio.portfolio_id}`];
        if (value !== null && value !== undefined) {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      });
    });
    
    // Add 10% padding
    const padding = Math.max(Math.abs(max), Math.abs(min)) * 0.1;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  };

  const yAxisDomain = getYAxisDomain();

  const handleExport = (format: "PNG" | "SVG" | "CSV") => {
    if (format === "CSV") {
      // Export data as CSV
      const headers = ["Date", ...data.filter(p => p && p.portfolio_name).map((p) => p.portfolio_name || "Unknown")];
      const rows = chartData.map((point) => [
        point.fullDate,
        ...data.filter(p => p && p.portfolio_id).map((p) => point[`portfolio_${p.portfolio_id}`] || ""),
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
              (p) => p && p.portfolio_id && `portfolio_${p.portfolio_id}` === entry.dataKey
            );
            if (!portfolio || !portfolio.portfolio_name) return null;

            const value = entry.value || 0;
            const isPositive = value >= 0;

            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: entry.fill || entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {portfolio.portfolio_name || "Unknown"}
                  </span>
                </div>
                <span className={`text-sm font-medium ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}>
                  {isPositive ? "+" : ""}{value.toFixed(2)}%
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
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              domain={yAxisDomain}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => {
                  const portfolioId = parseInt(value.split("_")[1]);
                  const portfolio = data.find((p) => p && p.portfolio_id === portfolioId);
                  return portfolio?.portfolio_name || "Unknown Portfolio";
                }}
              />
            )}
            {data.filter(p => p && p.portfolio_id).map((portfolio, index) => (
              <Bar
                key={portfolio.portfolio_id}
                dataKey={`portfolio_${portfolio.portfolio_id}`}
                fill={getChartColor(index)}
                radius={[4, 4, 0, 0]}
                name={`portfolio_${portfolio.portfolio_id}`}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

