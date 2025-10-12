"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface TimeSeriesPoint {
  date: string;
  value: number;
}

interface PortfolioPerformanceChartProps {
  data: TimeSeriesPoint[];
  title?: string;
  description?: string;
}

export function PortfolioPerformanceChart({ 
  data, 
  title = "Portfolio Performance",
  description = "Value over time"
}: PortfolioPerformanceChartProps) {
  // Sort data by date to ensure chronological order
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Get initial value from the earliest date
  const initialValue = sortedData.length > 0 ? sortedData[0].value : 0;
  
  // Transform data for chart - calculate percentage change
  const chartData = sortedData.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    value: initialValue > 0 ? ((point.value - initialValue) / initialValue) * 100 : 0,
    fullDate: point.date
  }));

  const chartConfig = {
    value: {
      label: "Performance Change",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
                className="text-xs"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value, payload) => {
                      if (payload && payload[0]) {
                        return new Date(payload[0].payload.fullDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        });
                      }
                      return value;
                    }}
                    formatter={(value) => [`${Number(value).toFixed(2)}%`, "Change"]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

